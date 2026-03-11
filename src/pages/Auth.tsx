import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { BrainCircuit, Lock, Mail, User, ArrowLeft, GraduationCap, Briefcase, Target } from "lucide-react";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";

type AuthMode = "login" | "signup" | "forgot-password" | "verify-otp" | "reset-password";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [careerGoals, setCareerGoals] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user && mode !== "verify-otp" && mode !== "reset-password") {
          navigate("/dashboard");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message.includes("Invalid login credentials")
          ? "Invalid email or password. Please try again."
          : error.message);
      } else {
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-reset-otp", {
        body: { email },
      });
      if (error) {
        toast.error("Failed to send reset code. Please try again.");
      } else {
        toast.success("If an account exists with that email, a 6-digit code has been sent.");
        setMode("verify-otp");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    setMode("reset-password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-reset-otp", {
        body: { email, code: otpCode, newPassword: password },
      });
      if (error) {
        toast.error("Failed to reset password. Please try again.");
      } else if (data?.error) {
        toast.error(data.error);
        if (data.error.includes("expired")) {
          setMode("forgot-password");
          setOtpCode("");
        }
      } else {
        toast.success("Password updated successfully! Please sign in.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setOtpCode("");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName },
        },
      });
      if (error) {
        toast.error(error.message.includes("already registered")
          ? "This email is already registered. Please login instead."
          : error.message);
      } else if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            education_level: educationLevel,
            field_of_study: fieldOfStudy,
            job_title: jobTitle,
            years_of_experience: yearsOfExperience ? parseInt(yearsOfExperience) : 0,
            career_goals: careerGoals,
          })
          .eq("user_id", data.user.id);
        if (profileError) console.error("Profile update error:", profileError);
        toast.success("Account created successfully! Welcome aboard!");
        navigate("/dashboard");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "Welcome Back";
      case "signup": return "Create Account";
      case "forgot-password": return "Reset Password";
      case "verify-otp": return "Enter Reset Code";
      case "reset-password": return "Set New Password";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "login": return "Sign in to continue your career journey";
      case "signup": return "Tell us about yourself to get personalized guidance";
      case "forgot-password": return "Enter your email to receive a 6-digit reset code";
      case "verify-otp": return `We sent a 6-digit code to ${email}`;
      case "reset-password": return "Enter your new password below";
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    switch (mode) {
      case "login": return handleLogin(e);
      case "signup": return handleSignUp(e);
      case "forgot-password": return handleForgotPassword(e);
      case "verify-otp": return handleVerifyOtp(e);
      case "reset-password": return handleResetPassword(e);
    }
  };

  const resetToLogin = () => {
    setMode("login");
    setPassword("");
    setConfirmPassword("");
    setOtpCode("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="gradient-card border-0 shadow-large p-8 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
              <BrainCircuit className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            {getTitle()}
          </h1>
          <p className="text-center text-muted-foreground mb-6">
            {getSubtitle()}
          </p>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Signup Fields */}
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-foreground">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name" className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary transition-smooth" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="educationLevel" className="text-sm font-medium text-foreground">
                    <GraduationCap className="inline h-4 w-4 mr-1" />Education Level
                  </Label>
                  <Select value={educationLevel} onValueChange={setEducationLevel}>
                    <SelectTrigger className="h-12 bg-background/50 border-border/50"><SelectValue placeholder="Select your education level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                      <SelectItem value="masters">Master's Degree</SelectItem>
                      <SelectItem value="phd">Ph.D.</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fieldOfStudy" className="text-sm font-medium text-foreground">Field of Study</Label>
                  <Input id="fieldOfStudy" type="text" value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)}
                    placeholder="e.g., Computer Science, Business" className="h-12 bg-background/50 border-border/50 focus:border-primary transition-smooth" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-sm font-medium text-foreground">
                    <Briefcase className="inline h-4 w-4 mr-1" />Current/Desired Job Title
                  </Label>
                  <Input id="jobTitle" type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Software Engineer, Marketing Manager" className="h-12 bg-background/50 border-border/50 focus:border-primary transition-smooth" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience" className="text-sm font-medium text-foreground">Years of Experience</Label>
                  <Select value={yearsOfExperience} onValueChange={setYearsOfExperience}>
                    <SelectTrigger className="h-12 bg-background/50 border-border/50"><SelectValue placeholder="Select experience" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Fresh Graduate / Student</SelectItem>
                      <SelectItem value="1">Less than 1 year</SelectItem>
                      <SelectItem value="2">1-2 years</SelectItem>
                      <SelectItem value="4">3-5 years</SelectItem>
                      <SelectItem value="7">5-10 years</SelectItem>
                      <SelectItem value="15">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="careerGoals" className="text-sm font-medium text-foreground">
                    <Target className="inline h-4 w-4 mr-1" />Career Goals
                  </Label>
                  <Textarea id="careerGoals" value={careerGoals} onChange={(e) => setCareerGoals(e.target.value)}
                    placeholder="What are your career aspirations?" className="bg-background/50 border-border/50 focus:border-primary transition-smooth resize-none" rows={3} />
                </div>
              </>
            )}

            {/* Email Field */}
            {(mode === "login" || mode === "signup" || mode === "forgot-password") && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email" className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary transition-smooth" required />
                </div>
              </div>
            )}

            {/* Password Field - for login and signup */}
            {(mode === "login" || mode === "signup") && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password" className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary transition-smooth" required minLength={6} />
                </div>
                {mode === "login" && (
                  <div className="text-right">
                    <button type="button" onClick={() => setMode("forgot-password")}
                      className="text-sm text-primary hover:text-primary/80 font-medium transition-smooth">
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* OTP Code Entry */}
            {mode === "verify-otp" && (
              <div className="space-y-4">
                <Label className="text-sm font-medium text-foreground">Enter 6-digit code</Label>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Didn't receive the code?{" "}
                  <button type="button" onClick={() => { setOtpCode(""); setMode("forgot-password"); }}
                    className="text-primary hover:text-primary/80 font-medium">
                    Resend
                  </button>
                </p>
              </div>
            )}

            {/* New Password Fields - for reset-password */}
            {mode === "reset-password" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input id="newPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password" className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary transition-smooth" required minLength={6} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password" className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary transition-smooth" required minLength={6} />
                  </div>
                </div>
              </>
            )}

            <Button type="submit"
              className="w-full h-12 gradient-primary text-primary-foreground shadow-soft hover:shadow-glow transition-bounce text-lg font-medium mt-6"
              disabled={isLoading}>
              {isLoading
                ? mode === "login" ? "Signing In..."
                : mode === "signup" ? "Creating Account..."
                : mode === "reset-password" ? "Updating Password..."
                : mode === "verify-otp" ? "Verifying..."
                : "Sending Code..."
                : mode === "login" ? "Sign In"
                : mode === "signup" ? "Create Account"
                : mode === "reset-password" ? "Update Password"
                : mode === "verify-otp" ? "Verify Code"
                : "Send Reset Code"}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? (
                <>Don't have an account?{" "}
                  <button onClick={() => setMode("signup")} className="text-primary hover:text-primary/80 font-medium transition-smooth">Sign up here</button>
                </>
              ) : mode === "signup" ? (
                <>Already have an account?{" "}
                  <button onClick={() => setMode("login")} className="text-primary hover:text-primary/80 font-medium transition-smooth">Sign in here</button>
                </>
              ) : (
                <>Remember your password?{" "}
                  <button onClick={resetToLogin} className="text-primary hover:text-primary/80 font-medium transition-smooth">Back to Sign In</button>
                </>
              )}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
