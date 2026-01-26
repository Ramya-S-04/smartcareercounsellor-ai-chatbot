import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { BrainCircuit, Users, TrendingUp, Star, MessageCircle, FileText, Target, Sparkles } from "lucide-react";
import heroImage from "../assets/hero-career-counsellor.jpg";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showLearnMore, setShowLearnMore] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 fixed w-full z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
              <BrainCircuit className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">CareerWise AI</span>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/auth")}
              className="transition-smooth hover:shadow-soft"
            >
              Login
            </Button>
            <Button 
              onClick={() => navigate("/auth")}
              className="gradient-primary text-primary-foreground transition-smooth hover:shadow-glow"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Your Smart
                  <span className="gradient-primary bg-clip-text text-transparent"> Career </span>
                  Counsellor
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Get personalized career guidance powered by AI. Discover your perfect career path, 
                  improve your skills, and land your dream job with intelligent recommendations.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="gradient-hero text-primary-foreground shadow-medium hover:shadow-glow transition-bounce text-lg px-8 py-6"
                  onClick={() => navigate('/dashboard')}
                >
                  Start Chatting
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-6 transition-smooth hover:shadow-soft"
                  onClick={() => setShowLearnMore(true)}
                >
                  Learn More
                </Button>
              </div>
            </div>

            <div className="relative">
              <img 
                src={heroImage} 
                alt="Smart Career Counsellor AI" 
                className="w-full h-auto rounded-2xl shadow-large"
              />
              <div className="absolute inset-0 gradient-primary opacity-10 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-surface/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose CareerWise AI?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform provides comprehensive career guidance tailored to your unique goals and aspirations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BrainCircuit,
                title: "AI-Powered Guidance",
                description: "Get intelligent career recommendations based on your skills, interests, and market trends."
              },
              {
                icon: Users,
                title: "Personalized Path",
                description: "Receive customized career roadmaps designed specifically for your background and goals."
              },
              {
                icon: TrendingUp,
                title: "Skill Assessment",
                description: "Identify your strengths and areas for improvement with comprehensive skill evaluations."
              },
              {
                icon: Star,
                title: "Resume Optimization",
                description: "Upload and optimize your resume with AI-powered suggestions and industry insights."
              }
            ].map((feature, index) => (
              <Card key={index} className="p-8 gradient-card border-0 shadow-soft hover:shadow-medium transition-smooth">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-4xl font-bold text-foreground">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join professionals who have discovered their perfect career path with CareerWise AI.
            </p>
            <Button 
              size="lg" 
              className="gradient-hero text-primary-foreground shadow-medium hover:shadow-glow transition-bounce text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Get Started Today
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50 bg-surface/30">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <BrainCircuit className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">CareerWise AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CareerWise AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Learn More Dialog */}
      <Dialog open={showLearnMore} onOpenChange={setShowLearnMore}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              About CareerWise AI
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">What is CareerWise AI?</h3>
              <p className="text-muted-foreground leading-relaxed">
                CareerWise AI is an intelligent career counselling platform powered by advanced AI technology. 
                We provide personalized guidance to help you navigate every aspect of your professional journey, 
                from career exploration to job search success.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">How Can We Help You?</h3>
              <div className="grid gap-4">
                <div className="flex gap-3 p-4 rounded-lg bg-surface border border-border/50">
                  <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Career Guidance Chat</h4>
                    <p className="text-sm text-muted-foreground">Ask any career-related questions and get instant, personalized advice from our AI counsellor.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 rounded-lg bg-surface border border-border/50">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Resume Review</h4>
                    <p className="text-sm text-muted-foreground">Upload your resume and get AI-powered suggestions to make it stand out to employers.</p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 rounded-lg bg-surface border border-border/50">
                  <Target className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Skill Assessment</h4>
                    <p className="text-sm text-muted-foreground">Discover your strengths and identify areas for growth with comprehensive skill evaluations.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Topics We Cover</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Career Transitions",
                  "Resume Writing",
                  "Interview Prep",
                  "Salary Negotiation",
                  "Skill Development",
                  "Job Search",
                  "Networking",
                  "Work-Life Balance",
                  "Leadership",
                  "Industry Trends"
                ].map((topic) => (
                  <span 
                    key={topic} 
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button 
                className="w-full gradient-primary text-primary-foreground shadow-soft hover:shadow-glow transition-bounce"
                onClick={() => {
                  setShowLearnMore(false);
                  navigate("/auth");
                }}
              >
                Get Started Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;