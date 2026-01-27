import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, User, Mail, Lock, GraduationCap, Briefcase, Target } from "lucide-react";

interface SignUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SignUpModal = ({ open, onOpenChange }: SignUpModalProps) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    education: "",
    experience: "",
    currentRole: "",
    careerGoals: "",
    skills: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate registration process
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
      console.log("Registration attempted with:", formData);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-0 p-0">
        <Card className="gradient-card border-0 shadow-large">
          <DialogHeader className="p-8 pb-4">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
                <BrainCircuit className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-foreground">
              Start Your Career Journey
            </DialogTitle>
            <p className="text-center text-muted-foreground mt-2">
              Tell us about yourself to get personalized career guidance
            </p>
          </DialogHeader>
          
          <div className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="John"
                      className="h-10 bg-background/50 border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Doe"
                      className="h-10 bg-background/50 border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="john@example.com"
                        className="pl-10 h-10 bg-background/50 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="h-10 bg-background/50 border-border/50 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Career Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Career Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="education" className="text-sm font-medium">Education Level</Label>
                    <Select onValueChange={(value) => handleInputChange("education", value)}>
                      <SelectTrigger className="h-10 bg-background/50 border-border/50">
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high-school">High School</SelectItem>
                        <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                        <SelectItem value="master">Master's Degree</SelectItem>
                        <SelectItem value="phd">Ph.D.</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-sm font-medium">Years of Experience</Label>
                    <Select onValueChange={(value) => handleInputChange("experience", value)}>
                      <SelectTrigger className="h-10 bg-background/50 border-border/50">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1 years</SelectItem>
                        <SelectItem value="2-5">2-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currentRole" className="text-sm font-medium">Current Role/Field</Label>
                  <Input
                    id="currentRole"
                    value={formData.currentRole}
                    onChange={(e) => handleInputChange("currentRole", e.target.value)}
                    placeholder="e.g., Software Engineer, Student, Marketing Manager"
                    className="h-10 bg-background/50 border-border/50 focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="careerGoals" className="text-sm font-medium">Career Goals</Label>
                  <Textarea
                    id="careerGoals"
                    value={formData.careerGoals}
                    onChange={(e) => handleInputChange("careerGoals", e.target.value)}
                    placeholder="Describe your career aspirations and goals..."
                    className="bg-background/50 border-border/50 focus:border-primary min-h-[80px]"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="skills" className="text-sm font-medium">Key Skills</Label>
                  <Textarea
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => handleInputChange("skills", e.target.value)}
                    placeholder="List your key skills, separated by commas..."
                    className="bg-background/50 border-border/50 focus:border-primary min-h-[60px]"
                    rows={2}
                  />
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Account Setup
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      placeholder="Choose a username"
                      className="h-10 bg-background/50 border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="Create a password"
                        className="h-10 bg-background/50 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        placeholder="Confirm password"
                        className="h-10 bg-background/50 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 gradient-primary text-primary-foreground shadow-soft hover:shadow-glow transition-bounce text-lg font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
            
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button 
                  onClick={() => onOpenChange(false)}
                  className="text-primary hover:text-primary-light font-medium transition-smooth"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
};