import { useState, type ChangeEvent, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { BrainCircuit, Lock, User } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoginModal = ({ open, onOpenChange }: LoginModalProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
      // Here you would handle the actual login logic
      console.log("Login attempted with:", { username, password });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden">
        <Card className="gradient-card border-0 shadow-large">
          <DialogHeader className="p-8 pb-4">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
                <BrainCircuit className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-foreground">
              Welcome Back
            </DialogTitle>
            <p className="text-center text-muted-foreground mt-2">
              Sign in to continue your career journey
            </p>
          </DialogHeader>
          
          <div className="p-8 pt-4">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-foreground">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary transition-smooth"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary transition-smooth"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 gradient-primary text-primary-foreground shadow-soft hover:shadow-glow transition-bounce text-lg font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button 
                  onClick={() => onOpenChange(false)}
                  className="text-primary hover:text-primary-light font-medium transition-smooth"
                >
                  Sign up here
                </button>
              </p>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
};