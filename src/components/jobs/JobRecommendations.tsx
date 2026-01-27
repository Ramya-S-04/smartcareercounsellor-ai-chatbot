import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Briefcase, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  Target
} from "lucide-react";

interface JobRecommendation {
  title: string;
  companyType: string;
  matchScore: number;
  requirements: string[];
  whyGoodFit: string;
  salaryRange: string;
  growthPotential: "Low" | "Medium" | "High";
}

const careerPaths = [
  { value: "software_engineering", label: "Software Engineering" },
  { value: "data_science", label: "Data Science" },
  { value: "product_management", label: "Product Management" },
  { value: "design", label: "UX/UI Design" },
  { value: "general", label: "General" },
];

export const JobRecommendations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>("general");
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setProfile(data);
    };

    fetchProfile();
  }, [user]);

  const generateRecommendations = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to get job recommendations.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("job-recommendations", {
        body: { profile, careerPath: selectedPath },
      });

      if (error) throw error;

      if (data?.recommendations) {
        setRecommendations(data.recommendations);
        toast({
          title: "Recommendations generated!",
          description: `Found ${data.recommendations.length} job matches for you.`,
        });
      }
    } catch (error: any) {
      console.error("Error generating recommendations:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getGrowthColor = (growth: string) => {
    switch (growth) {
      case "High":
        return "bg-success/10 text-success border-success/30";
      case "Medium":
        return "bg-warning/10 text-warning border-warning/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-muted-foreground";
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-primary-foreground" />
          </div>
          Job Recommendations
        </h2>
        <p className="text-muted-foreground mt-2">
          AI-powered job matches based on your profile and career goals
        </p>
      </div>

      {/* Controls */}
      <Card className="shadow-soft mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Career Path
              </label>
              <Select value={selectedPath} onValueChange={setSelectedPath}>
                <SelectTrigger>
                  <SelectValue placeholder="Select career path" />
                </SelectTrigger>
                <SelectContent>
                  {careerPaths.map((path) => (
                    <SelectItem key={path.value} value={path.value}>
                      {path.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generateRecommendations}
              disabled={loading}
              className="gradient-primary text-primary-foreground shadow-soft hover:shadow-glow"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Recommendations
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Summary */}
      {profile && (
        <Card className="shadow-soft mb-8 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Your Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4 text-sm">
              <div>
                <span className="text-muted-foreground">Role:</span>
                <p className="font-medium text-foreground">{profile.job_title || "Not set"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Experience:</span>
                <p className="font-medium text-foreground">{profile.years_of_experience || 0} years</p>
              </div>
              <div>
                <span className="text-muted-foreground">Education:</span>
                <p className="font-medium text-foreground capitalize">
                  {profile.education_level?.replace("_", " ") || "Not set"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Skills:</span>
                <p className="font-medium text-foreground">{profile.skills?.length || 0} listed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {recommendations.map((job, index) => (
            <Card key={index} className="shadow-soft hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-foreground">{job.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4" />
                      {job.companyType}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getMatchColor(job.matchScore)}`}>
                      {job.matchScore}%
                    </div>
                    <span className="text-xs text-muted-foreground">Match</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={job.matchScore} className="h-2" />

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={getGrowthColor(job.growthPotential)}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {job.growthPotential} Growth
                  </Badge>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {job.salaryRange}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Key Requirements</h4>
                  <ul className="space-y-1">
                    {job.requirements.slice(0, 4).map((req, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <p className="text-sm text-muted-foreground italic">{job.whyGoodFit}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Ready to Find Your Dream Job?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Select a career path and click the button above to get personalized job recommendations powered by AI.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
