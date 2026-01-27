import { useState, useCallback } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";
import { 
  Briefcase, 
  Play, 
  Square, 
  MessageSquare, 
  Send, 
  Loader2, 
  Star, 
  CheckCircle2, 
  AlertCircle,
  Target,
  Clock,
  Trophy
} from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { supabase } from "../../integrations/supabase/client";
import { useAuth } from "../../hooks/useAuth";

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

interface InterviewResponse {
  questionId: string;
  answer: string;
  feedback?: string;
  score?: number;
}

interface InterviewSession {
  role: string;
  difficulty: string;
  questions: InterviewQuestion[];
  responses: InterviewResponse[];
  overallScore?: number;
  status: "setup" | "in-progress" | "review" | "completed";
}

const INTERVIEW_ROLES = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "UX Designer",
  "Marketing Manager",
  "Sales Representative",
  "Project Manager",
  "Business Analyst",
  "HR Manager",
  "Financial Analyst"
];

const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Entry Level", description: "Basic questions for beginners" },
  { value: "medium", label: "Mid-Level", description: "Standard industry questions" },
  { value: "hard", label: "Senior Level", description: "Complex behavioral & technical questions" }
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-chat`;

export const InterviewPrep = () => {
  const { user } = useAuth();
  const [session, setSession] = useState<InterviewSession>({
    role: "",
    difficulty: "medium",
    questions: [],
    responses: [],
    status: "setup"
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [customRole, setCustomRole] = useState("");

  const generateQuestions = useCallback(async () => {
    const role = session.role === "custom" ? customRole : session.role;
    if (!role) {
      toast.error("Please select or enter a role");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate 5 interview questions for a ${role} position at ${session.difficulty} difficulty level. 
            
Return ONLY a JSON array with exactly this format, no other text:
[
  {"id": "1", "question": "question text here", "category": "behavioral/technical/situational", "difficulty": "${session.difficulty}"},
  {"id": "2", "question": "question text here", "category": "behavioral/technical/situational", "difficulty": "${session.difficulty}"},
  ...
]

Include a mix of behavioral, technical, and situational questions appropriate for the role and difficulty level.`
          }]
        }),
      });

      if (!response.ok) throw new Error("Failed to generate questions");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch {}
          }
        }
      }

      // Extract JSON from response
      const jsonMatch = fullContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]) as InterviewQuestion[];
        setSession(prev => ({
          ...prev,
          role,
          questions,
          status: "in-progress"
        }));
        toast.success("Interview questions generated!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [session.role, session.difficulty, customRole]);

  const submitAnswer = useCallback(async () => {
    if (!currentAnswer.trim()) {
      toast.error("Please provide an answer");
      return;
    }

    const currentQuestion = session.questions[currentQuestionIndex];
    setIsEvaluating(true);

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Evaluate this interview answer for a ${session.role} position.

Question: ${currentQuestion.question}
Category: ${currentQuestion.category}
Difficulty: ${currentQuestion.difficulty}

Candidate's Answer: ${currentAnswer}

Provide feedback in exactly this JSON format, no other text:
{
  "score": <number 1-10>,
  "feedback": "<detailed constructive feedback with strengths and areas for improvement>",
  "keyPoints": ["<point 1>", "<point 2>", "<point 3>"]
}`
          }]
        }),
      });

      if (!response.ok) throw new Error("Failed to evaluate answer");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch {}
          }
        }
      }

      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0]);
        
        const newResponse: InterviewResponse = {
          questionId: currentQuestion.id,
          answer: currentAnswer,
          feedback: evaluation.feedback,
          score: evaluation.score
        };

        setSession(prev => ({
          ...prev,
          responses: [...prev.responses, newResponse]
        }));

        setCurrentAnswer("");

        if (currentQuestionIndex < session.questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          toast.success(`Score: ${evaluation.score}/10 - Moving to next question`);
        } else {
          // Calculate overall score
          const allResponses = [...session.responses, newResponse];
          const avgScore = allResponses.reduce((sum, r) => sum + (r.score || 0), 0) / allResponses.length;
          
          setSession(prev => ({
            ...prev,
            responses: allResponses,
            overallScore: Math.round(avgScore * 10) / 10,
            status: "completed"
          }));
          toast.success("Interview completed! Review your results.");
        }
      }
    } catch (error) {
      console.error("Error evaluating answer:", error);
      toast.error("Failed to evaluate answer. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  }, [currentAnswer, currentQuestionIndex, session]);

  const resetInterview = () => {
    setSession({
      role: "",
      difficulty: "medium",
      questions: [],
      responses: [],
      status: "setup"
    });
    setCurrentQuestionIndex(0);
    setCurrentAnswer("");
    setCustomRole("");
  };

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = session.questions.length > 0 
    ? ((currentQuestionIndex + (session.status === "completed" ? 1 : 0)) / session.questions.length) * 100 
    : 0;

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Interview Preparation</h3>
              <p className="text-sm text-muted-foreground">
                {session.status === "setup" && "Set up your mock interview"}
                {session.status === "in-progress" && `Question ${currentQuestionIndex + 1} of ${session.questions.length}`}
                {session.status === "completed" && "Interview Complete - Review Results"}
              </p>
            </div>
          </div>

          {session.status !== "setup" && (
            <Button variant="outline" onClick={resetInterview}>
              Start New Interview
            </Button>
          )}
        </div>

        {session.status !== "setup" && (
          <Progress value={progress} className="mt-4" />
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 px-6 overflow-hidden">
        <Card className="h-full gradient-card border-0 shadow-soft">
          <ScrollArea className="h-full">
            {/* Setup Phase */}
            {session.status === "setup" && (
              <div className="p-6 space-y-6">
                <div className="text-center py-6">
                  <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Practice Mock Interviews
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Prepare for your next interview with AI-powered mock interviews. 
                    Get instant feedback and improve your responses.
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Select Role</label>
                    <Select 
                      value={session.role} 
                      onValueChange={(value: string) => setSession(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERVIEW_ROLES.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                        <SelectItem value="custom">Custom Role...</SelectItem>
                      </SelectContent>
                    </Select>

                    {session.role === "custom" && (
                      <Input
                        placeholder="Enter your custom role"
                        value={customRole}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomRole(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Difficulty Level</label>
                    <div className="grid gap-3">
                      {DIFFICULTY_LEVELS.map(level => (
                        <Card
                          key={level.value}
                          className={cn(
                            "p-4 cursor-pointer transition-all",
                            session.difficulty === level.value
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          )}
                          onClick={() => setSession(prev => ({ ...prev, difficulty: level.value }))}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{level.label}</p>
                              <p className="text-sm text-muted-foreground">{level.description}</p>
                            </div>
                            {session.difficulty === level.value && (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={generateQuestions}
                    disabled={isGenerating || (!session.role || (session.role === "custom" && !customRole))}
                    className="w-full gradient-primary text-primary-foreground"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Interview
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Interview In Progress */}
            {session.status === "in-progress" && currentQuestion && (
              <div className="p-6 space-y-6">
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{currentQuestion.category}</Badge>
                      <Badge variant="outline" className={cn(
                        currentQuestion.difficulty === "easy" && "border-green-500 text-green-500",
                        currentQuestion.difficulty === "medium" && "border-yellow-500 text-yellow-500",
                        currentQuestion.difficulty === "hard" && "border-red-500 text-red-500"
                      )}>
                        {currentQuestion.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
                  </CardHeader>
                </Card>

                <div className="space-y-4">
                  <label className="text-sm font-medium text-foreground">Your Answer</label>
                  <Textarea
                    placeholder="Type your answer here... Be specific and provide examples where possible."
                    value={currentAnswer}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCurrentAnswer(e.target.value)}
                    className="min-h-[200px]"
                    disabled={isEvaluating}
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Take your time to craft a thoughtful response
                    </p>
                    <Button
                      onClick={submitAnswer}
                      disabled={isEvaluating || !currentAnswer.trim()}
                      className="gradient-primary text-primary-foreground"
                    >
                      {isEvaluating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Answer
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Previous Responses */}
                {session.responses.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-medium text-foreground mb-3">Previous Answers</h4>
                    <div className="space-y-3">
                      {session.responses.map((response, index) => (
                        <Card key={response.questionId} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Question {index + 1}</p>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-medium">{response.score}/10</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{response.feedback}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Results Phase */}
            {session.status === "completed" && (
              <div className="p-6 space-y-6">
                <div className="text-center py-6">
                  <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Interview Complete!
                  </h2>
                  <p className="text-muted-foreground">
                    Here's how you performed in your {session.role} interview
                  </p>

                  <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
                    <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold text-foreground">
                      {session.overallScore}
                    </span>
                    <span className="text-muted-foreground">/ 10 Overall</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Detailed Feedback</h3>
                  {session.questions.map((question, index) => {
                    const response = session.responses[index];
                    return (
                      <Card key={question.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">{question.category}</Badge>
                              <span className="text-xs text-muted-foreground">Question {index + 1}</span>
                            </div>
                            <p className="font-medium text-foreground">{question.question}</p>
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            <Star className={cn(
                              "h-5 w-5",
                              (response?.score || 0) >= 7 
                                ? "text-yellow-500 fill-yellow-500" 
                                : "text-muted-foreground"
                            )} />
                            <span className="font-bold">{response?.score}/10</span>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Your Answer:</p>
                            <p className="text-sm text-foreground">{response?.answer}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Feedback:</p>
                            <p className="text-sm text-foreground">{response?.feedback}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={resetInterview}
                    className="gradient-primary text-primary-foreground"
                    size="lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Practice Another Interview
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};
