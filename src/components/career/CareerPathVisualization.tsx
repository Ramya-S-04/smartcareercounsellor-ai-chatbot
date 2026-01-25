import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  TrendingUp, 
  Briefcase, 
  GraduationCap, 
  Award, 
  ChevronRight, 
  Zap, 
  Target,
  ArrowRight,
  Star,
  Clock
} from "lucide-react";

interface CareerLevel {
  title: string;
  level: number;
  yearsRequired: number;
  skills: string[];
  averageSalary: string;
  description: string;
}

interface CareerPath {
  name: string;
  paths: CareerLevel[];
  color: string;
}

const careerPathsData: Record<string, CareerPath> = {
  software_engineering: {
    name: "Software Engineering",
    color: "from-blue-500 to-indigo-600",
    paths: [
      {
        title: "Junior Developer",
        level: 1,
        yearsRequired: 0,
        skills: ["HTML/CSS", "JavaScript", "Git", "Problem Solving"],
        averageSalary: "$50,000 - $70,000",
        description: "Entry-level position focused on learning and contributing to team projects.",
      },
      {
        title: "Mid-Level Developer",
        level: 2,
        yearsRequired: 2,
        skills: ["React/Vue/Angular", "APIs", "Database Design", "Testing"],
        averageSalary: "$70,000 - $100,000",
        description: "Independently handle complex features and mentor junior developers.",
      },
      {
        title: "Senior Developer",
        level: 3,
        yearsRequired: 5,
        skills: ["System Design", "Architecture", "Leadership", "Code Review"],
        averageSalary: "$100,000 - $140,000",
        description: "Lead technical decisions and drive engineering excellence.",
      },
      {
        title: "Staff Engineer",
        level: 4,
        yearsRequired: 8,
        skills: ["Cross-team Leadership", "Technical Strategy", "Mentorship"],
        averageSalary: "$140,000 - $180,000",
        description: "Influence technical direction across multiple teams.",
      },
      {
        title: "Principal Engineer",
        level: 5,
        yearsRequired: 12,
        skills: ["Company-wide Impact", "Innovation", "Technical Vision"],
        averageSalary: "$180,000 - $250,000+",
        description: "Shape the technical future of the organization.",
      },
    ],
  },
  data_science: {
    name: "Data Science",
    color: "from-green-500 to-teal-600",
    paths: [
      {
        title: "Data Analyst",
        level: 1,
        yearsRequired: 0,
        skills: ["SQL", "Excel", "Statistics", "Visualization"],
        averageSalary: "$55,000 - $75,000",
        description: "Analyze data and create reports to support business decisions.",
      },
      {
        title: "Data Scientist",
        level: 2,
        yearsRequired: 2,
        skills: ["Python/R", "Machine Learning", "Statistical Modeling"],
        averageSalary: "$80,000 - $120,000",
        description: "Build predictive models and derive insights from complex datasets.",
      },
      {
        title: "Senior Data Scientist",
        level: 3,
        yearsRequired: 5,
        skills: ["Deep Learning", "MLOps", "A/B Testing", "Leadership"],
        averageSalary: "$120,000 - $160,000",
        description: "Lead data science initiatives and mentor team members.",
      },
      {
        title: "Principal Data Scientist",
        level: 4,
        yearsRequired: 8,
        skills: ["Research", "Innovation", "Cross-functional Leadership"],
        averageSalary: "$160,000 - $220,000+",
        description: "Drive data science strategy and innovation.",
      },
    ],
  },
  product_management: {
    name: "Product Management",
    color: "from-purple-500 to-pink-600",
    paths: [
      {
        title: "Associate PM",
        level: 1,
        yearsRequired: 0,
        skills: ["User Research", "Analytics", "Communication", "Agile"],
        averageSalary: "$60,000 - $80,000",
        description: "Support product initiatives and learn the PM craft.",
      },
      {
        title: "Product Manager",
        level: 2,
        yearsRequired: 2,
        skills: ["Strategy", "Roadmapping", "Stakeholder Management"],
        averageSalary: "$90,000 - $130,000",
        description: "Own product areas and drive feature development.",
      },
      {
        title: "Senior PM",
        level: 3,
        yearsRequired: 5,
        skills: ["Leadership", "Vision", "Cross-team Collaboration"],
        averageSalary: "$130,000 - $170,000",
        description: "Lead major product initiatives and influence strategy.",
      },
      {
        title: "Director of Product",
        level: 4,
        yearsRequired: 8,
        skills: ["Team Leadership", "Business Strategy", "Executive Communication"],
        averageSalary: "$170,000 - $220,000+",
        description: "Lead product teams and set organizational direction.",
      },
    ],
  },
  design: {
    name: "UX/UI Design",
    color: "from-orange-500 to-red-600",
    paths: [
      {
        title: "Junior Designer",
        level: 1,
        yearsRequired: 0,
        skills: ["Figma", "UI Basics", "Visual Design", "Typography"],
        averageSalary: "$45,000 - $65,000",
        description: "Create designs under guidance and build foundational skills.",
      },
      {
        title: "UX/UI Designer",
        level: 2,
        yearsRequired: 2,
        skills: ["User Research", "Prototyping", "Design Systems"],
        averageSalary: "$70,000 - $100,000",
        description: "Own design projects and conduct user research.",
      },
      {
        title: "Senior Designer",
        level: 3,
        yearsRequired: 5,
        skills: ["Design Leadership", "Strategy", "Mentorship"],
        averageSalary: "$100,000 - $140,000",
        description: "Lead design initiatives and mentor junior designers.",
      },
      {
        title: "Design Lead",
        level: 4,
        yearsRequired: 8,
        skills: ["Team Management", "Design Vision", "Stakeholder Influence"],
        averageSalary: "$140,000 - $180,000+",
        description: "Lead design teams and shape product vision.",
      },
    ],
  },
};

export const CareerPathVisualization = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [assessmentScores, setAssessmentScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        setProfile(profileData);

        // Fetch assessments
        const { data: assessments } = await supabase
          .from("skill_assessments")
          .select("*")
          .eq("user_id", user.id);

        if (assessments) {
          const scores: Record<string, number> = {};
          assessments.forEach((a) => {
            if (!scores[a.category] || a.score > scores[a.category]) {
              scores[a.category] = Math.round((a.score / a.total_questions) * 100);
            }
          });
          setAssessmentScores(scores);
        }
      } catch (error: any) {
        toast({
          title: "Error loading data",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const getCurrentLevel = (path: CareerPath) => {
    const years = profile?.years_of_experience || 0;
    let currentLevel = 0;
    for (const level of path.paths) {
      if (years >= level.yearsRequired) {
        currentLevel = level.level;
      }
    }
    return currentLevel;
  };

  const getProgressToNextLevel = (path: CareerPath) => {
    const years = profile?.years_of_experience || 0;
    const currentLevel = getCurrentLevel(path);
    const currentLevelData = path.paths.find((p) => p.level === currentLevel);
    const nextLevelData = path.paths.find((p) => p.level === currentLevel + 1);

    if (!nextLevelData) return 100;
    if (!currentLevelData) return 0;

    const yearsInLevel = years - currentLevelData.yearsRequired;
    const yearsNeeded = nextLevelData.yearsRequired - currentLevelData.yearsRequired;

    return Math.min(100, (yearsInLevel / yearsNeeded) * 100);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary-foreground" />
          </div>
          Career Path Visualization
        </h2>
        <p className="text-muted-foreground mt-2">
          Explore potential career progressions based on your skills and experience
        </p>
      </div>

      {/* Current Status */}
      <Card className="shadow-soft mb-8 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Your Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-accent/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Briefcase className="h-4 w-4" />
                <span className="text-sm">Current Role</span>
              </div>
              <p className="font-semibold text-foreground">
                {profile?.job_title || "Not specified"}
              </p>
            </div>
            <div className="p-4 bg-accent/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Experience</span>
              </div>
              <p className="font-semibold text-foreground">
                {profile?.years_of_experience || 0} years
              </p>
            </div>
            <div className="p-4 bg-accent/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <GraduationCap className="h-4 w-4" />
                <span className="text-sm">Education</span>
              </div>
              <p className="font-semibold text-foreground capitalize">
                {profile?.education_level?.replace("_", " ") || "Not specified"}
              </p>
            </div>
            <div className="p-4 bg-accent/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Award className="h-4 w-4" />
                <span className="text-sm">Skills</span>
              </div>
              <p className="font-semibold text-foreground">
                {profile?.skills?.length || 0} listed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career Path Selection */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {Object.entries(careerPathsData).map(([key, path]) => {
          const currentLevel = getCurrentLevel(path);
          const progress = getProgressToNextLevel(path);
          
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all duration-300 hover:shadow-medium ${
                selectedPath === key ? "ring-2 ring-primary shadow-medium" : "shadow-soft"
              }`}
              onClick={() => setSelectedPath(selectedPath === key ? null : key)}
            >
              <CardContent className="p-4">
                <div className={`w-full h-2 rounded-full bg-gradient-to-r ${path.color} mb-3`} />
                <h3 className="font-bold text-foreground mb-1">{path.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Level {currentLevel} of {path.paths.length}
                </p>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.round(progress)}% to next level
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Path Details */}
      {selectedPath && careerPathsData[selectedPath] && (
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${careerPathsData[selectedPath].color} flex items-center justify-center`}>
                <Target className="h-4 w-4 text-primary-foreground" />
              </div>
              {careerPathsData[selectedPath].name} Career Path
            </CardTitle>
            <CardDescription>
              Your progression roadmap based on experience and skills
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
              
              {careerPathsData[selectedPath].paths.map((level, index) => {
                const isCurrentLevel = getCurrentLevel(careerPathsData[selectedPath]) === level.level;
                const isPastLevel = getCurrentLevel(careerPathsData[selectedPath]) > level.level;
                const isFutureLevel = getCurrentLevel(careerPathsData[selectedPath]) < level.level;
                
                return (
                  <div key={level.level} className="relative pl-16 pb-8 last:pb-0">
                    {/* Timeline Node */}
                    <div className={`absolute left-4 w-5 h-5 rounded-full border-2 ${
                      isPastLevel 
                        ? "bg-primary border-primary" 
                        : isCurrentLevel 
                        ? "bg-primary border-primary animate-pulse" 
                        : "bg-background border-muted-foreground"
                    }`}>
                      {isPastLevel && (
                        <Star className="h-3 w-3 text-primary-foreground absolute top-0.5 left-0.5" />
                      )}
                    </div>
                    
                    <div className={`p-4 rounded-xl border ${
                      isCurrentLevel 
                        ? "bg-primary/5 border-primary/30" 
                        : isPastLevel 
                        ? "bg-accent/30 border-border/50" 
                        : "bg-card border-border/30"
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground">{level.title}</h4>
                            {isCurrentLevel && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                <Zap className="h-3 w-3 mr-1" />
                                Current
                              </Badge>
                            )}
                            {isPastLevel && (
                              <Badge variant="secondary" className="bg-success/10 text-success">
                                Achieved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {level.yearsRequired}+ years experience
                          </p>
                        </div>
                        <span className="text-sm font-medium text-primary">
                          {level.averageSalary}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {level.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {level.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className={
                              profile?.skills?.includes(skill)
                                ? "bg-success/10 border-success/30 text-success"
                                : ""
                            }
                          >
                            {skill}
                            {profile?.skills?.includes(skill) && (
                              <Star className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skill Assessment Scores */}
      {Object.keys(assessmentScores).length > 0 && (
        <Card className="shadow-soft mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Your Skill Assessment Scores
            </CardTitle>
            <CardDescription>
              Based on your completed skill assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(assessmentScores).map(([category, score]) => (
                <div key={category} className="p-4 bg-accent/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize text-foreground">
                      {category.replace("_", " ")}
                    </span>
                    <span className="text-lg font-bold text-primary">{score}%</span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
