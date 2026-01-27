import { useState, useEffect } from "react";
import { CheckCircle, Code, Users, TrendingUp, ArrowRight, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { skillAssessments, AssessmentCategory, Question } from "@/data/skillAssessmentQuestions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AssessmentResult {
  category: string;
  score: number;
  total: number;
  percentage: number;
  completedAt: string;
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case "Code":
      return <Code className="h-6 w-6 text-primary-foreground" />;
    case "Users":
      return <Users className="h-6 w-6 text-primary-foreground" />;
    case "TrendingUp":
      return <TrendingUp className="h-6 w-6 text-primary-foreground" />;
    default:
      return <CheckCircle className="h-6 w-6 text-primary-foreground" />;
  }
};

export const SkillAssessment = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<AssessmentCategory | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [previousResults, setPreviousResults] = useState<AssessmentResult[]>([]);

  useEffect(() => {
    fetchPreviousResults();
  }, [user]);

  const fetchPreviousResults = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("skill_assessments")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("Error fetching results:", error);
    } else if (data) {
      const results: AssessmentResult[] = data.map((item) => ({
        category: item.category,
        score: item.score,
        total: item.total_questions,
        percentage: Math.round((item.score / item.total_questions) * 100),
        completedAt: item.completed_at,
      }));
      setPreviousResults(results);
    }
  };

  const startAssessment = (category: AssessmentCategory) => {
    setSelectedCategory(category);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
  };

  const handleAnswer = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
  };

  const nextQuestion = () => {
    if (selectedCategory && currentQuestionIndex < selectedCategory.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const finishAssessment = async () => {
    if (!selectedCategory || !user) return;

    const score = selectedCategory.questions.reduce((acc, q) => {
      return acc + (answers[q.id] === q.correctAnswer ? 1 : 0);
    }, 0);

    // Save to database
    const { error } = await supabase.from("skill_assessments").insert({
      user_id: user.id,
      category: selectedCategory.name,
      score,
      total_questions: selectedCategory.questions.length,
      answers,
    });

    if (error) {
      console.error("Error saving assessment:", error);
      toast.error("Failed to save results");
    } else {
      toast.success("Assessment completed!");
      fetchPreviousResults();
    }

    setShowResults(true);
  };

  const resetAssessment = () => {
    setSelectedCategory(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  // Results view
  if (showResults && selectedCategory) {
    const score = selectedCategory.questions.reduce((acc, q) => {
      return acc + (answers[q.id] === q.correctAnswer ? 1 : 0);
    }, 0);
    const percentage = Math.round((score / selectedCategory.questions.length) * 100);

    return (
      <div className="p-8">
        <Card className="gradient-card border-0 shadow-soft p-8 max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-10 w-10 text-primary-foreground" />
          </div>
          
          <h2 className="text-3xl font-bold mb-2">Assessment Complete!</h2>
          <p className="text-muted-foreground mb-6">{selectedCategory.name}</p>

          <div className="mb-8">
            <p className={`text-6xl font-bold ${getScoreColor(percentage)}`}>
              {percentage}%
            </p>
            <p className="text-muted-foreground mt-2">
              {score} out of {selectedCategory.questions.length} correct
            </p>
          </div>

          <div className="mb-8">
            {percentage >= 80 && (
              <p className="text-green-500 font-medium">Excellent! You have strong skills in this area.</p>
            )}
            {percentage >= 60 && percentage < 80 && (
              <p className="text-yellow-500 font-medium">Good job! There's room for improvement.</p>
            )}
            {percentage < 60 && (
              <p className="text-red-500 font-medium">Keep learning! Practice makes perfect.</p>
            )}
          </div>

          <div className="space-y-4 text-left mb-8">
            <h4 className="font-semibold">Review your answers:</h4>
            {selectedCategory.questions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-background/50 rounded-xl">
                <p className="font-medium text-sm mb-2">
                  {idx + 1}. {q.question}
                </p>
                <p className={`text-sm ${answers[q.id] === q.correctAnswer ? "text-green-500" : "text-red-500"}`}>
                  Your answer: {q.options[answers[q.id]]}
                  {answers[q.id] !== q.correctAnswer && (
                    <span className="text-muted-foreground ml-2">
                      (Correct: {q.options[q.correctAnswer]})
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>

          <Button
            onClick={resetAssessment}
            className="gradient-primary text-primary-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Take Another Assessment
          </Button>
        </Card>
      </div>
    );
  }

  // Assessment in progress
  if (selectedCategory) {
    const currentQuestion = selectedCategory.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / selectedCategory.questions.length) * 100;

    return (
      <div className="p-8">
        <Card className="gradient-card border-0 shadow-soft p-8 max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{selectedCategory.name}</h3>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {selectedCategory.questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <h2 className="text-xl font-bold mb-6">{currentQuestion.question}</h2>

          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(currentQuestion.id, idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-smooth ${
                  answers[currentQuestion.id] === idx
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-primary/50 bg-background/50"
                }`}
              >
                <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {option}
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            {currentQuestionIndex === selectedCategory.questions.length - 1 ? (
              <Button
                onClick={finishAssessment}
                disabled={Object.keys(answers).length !== selectedCategory.questions.length}
                className="gradient-primary text-primary-foreground"
              >
                Finish Assessment
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                disabled={answers[currentQuestion.id] === undefined}
                className="gradient-primary text-primary-foreground"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Category selection
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-2">Skill Assessment</h2>
      <p className="text-muted-foreground mb-8">
        Test your skills and get personalized feedback to improve your career readiness.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {skillAssessments.map((category) => {
          const lastResult = previousResults.find((r) => r.category === category.name);
          
          return (
            <Card
              key={category.id}
              className="gradient-card border-0 shadow-soft p-6 hover:shadow-glow transition-smooth"
            >
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4">
                {getIcon(category.icon)}
              </div>
              <h3 className="font-bold text-lg mb-2">{category.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
              
              {lastResult && (
                <div className="mb-4 p-3 bg-background/50 rounded-lg">
                  <p className="text-sm">
                    Last score: <span className={`font-bold ${getScoreColor(lastResult.percentage)}`}>
                      {lastResult.percentage}%
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lastResult.completedAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="text-sm text-muted-foreground mb-4">
                {category.questions.length} questions
              </div>

              <Button
                onClick={() => startAssessment(category)}
                className="w-full gradient-primary text-primary-foreground"
              >
                {lastResult ? "Retake Test" : "Start Test"}
              </Button>
            </Card>
          );
        })}
      </div>

      {previousResults.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-4">Your Assessment History</h3>
          <Card className="gradient-card border-0 shadow-soft p-6">
            <div className="space-y-4">
              {previousResults.slice(0, 5).map((result, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-background/50 rounded-xl"
                >
                  <div>
                    <p className="font-medium">{result.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(result.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getScoreColor(result.percentage)}`}>
                      {result.percentage}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.score}/{result.total}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
