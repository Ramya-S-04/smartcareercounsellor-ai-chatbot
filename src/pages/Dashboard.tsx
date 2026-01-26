import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, Menu } from "lucide-react";
import { Button } from "../components/ui/button";
import { Sidebar } from "../components/layout/Sidebar";
import { ChatInterface } from "../components/chat/ChatInterface";
import { ResumeUpload } from "../components/resume/ResumeUpload";
import { SkillAssessment } from "../components/assessment/SkillAssessment";
import { UserProfile } from "../components/profile/UserProfile";
import { CareerPathVisualization } from "../components/career/CareerPathVisualization";
import { JobRecommendations } from "../components/jobs/JobRecommendations";
import { InterviewPrep } from "../components/interview/InterviewPrep";
import { useAuth } from "../hooks/useAuth";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("chat");
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return <UserProfile />;
      case "chat":
        return <ChatInterface />;
      case "interview-prep":
        return <InterviewPrep />;
      case "career-path":
        return <CareerPathVisualization />;
      case "skill-assessment":
        return <SkillAssessment />;
      case "resume":
        return <ResumeUpload />;
      case "jobs":
        return <JobRecommendations />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border/50 bg-surface/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
              Smart Career Counsellor
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <BrainCircuit className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground hidden sm:block">CareerWise AI</span>
            </div>
          </div>
        </header>

        {/* Welcome Message */}
        <div className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground">
              Welcome back, {userName}! 👋
            </h2>
            <p className="text-muted-foreground mt-1">
              Ready to continue your career journey? Let's explore new opportunities together.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;