import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { 
  User, 
  MessageCircle, 
  TrendingUp, 
  ClipboardCheck, 
  Upload, 
  LogOut,
  BrainCircuit,
  X,
  Briefcase,
  GraduationCap
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: "profile", label: "User Profile", icon: User },
  { id: "chat", label: "Career Chat", icon: MessageCircle },
  { id: "resume", label: "Upload Resume", icon: Upload },
  { id: "interview-prep", label: "Interview Prep", icon: GraduationCap },
  { id: "career-path", label: "Career Path", icon: TrendingUp },
  { id: "jobs", label: "Job Recommendations", icon: Briefcase },
  { id: "skill-assessment", label: "Skill Assessment", icon: ClipboardCheck },
];

export const Sidebar = ({ 
  open, 
  onOpenChange, 
  activeSection, 
  onSectionChange 
}: SidebarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex flex-col h-screen bg-surface/80 border-r border-border/50 transition-all duration-300",
        open ? "w-80" : "w-16"
      )}>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <BrainCircuit className="h-5 w-5 text-primary-foreground" />
            </div>
            {open && (
              <div className="overflow-hidden">
                <h3 className="font-bold text-foreground">{userName}</h3>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-start h-12 transition-smooth",
                open ? "px-4" : "px-3",
                activeSection === item.id && "gradient-primary text-primary-foreground shadow-soft"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <item.icon className={cn("h-5 w-5", open ? "mr-3" : "")} />
              {open && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>

        <div className="p-4">
          <Separator className="mb-4" />
          <Button
            variant="destructive"
            size="sm"
            className={cn(
              "w-full justify-start h-12",
              open ? "px-4" : "px-3"
            )}
            onClick={handleLogout}
          >
            <LogOut className={cn("h-5 w-5", open ? "mr-3" : "")} />
            {open && <span>Logout</span>}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-surface/95 backdrop-blur-sm border-r border-border/50 transform transition-transform duration-300 lg:hidden",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <Card className="h-full gradient-card border-0 rounded-none">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                  <BrainCircuit className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{userName}</h3>
                  <p className="text-sm text-muted-foreground truncate max-w-[180px]">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            <nav className="mt-6 space-y-2">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start h-12 px-4 transition-smooth",
                    activeSection === item.id && "gradient-primary text-primary-foreground shadow-soft"
                  )}
                  onClick={() => {
                    onSectionChange(item.id);
                    onOpenChange(false);
                  }}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </nav>

            <div className="absolute bottom-6 left-6 right-6">
              <Separator className="mb-4" />
              <Button
                variant="destructive"
                size="sm"
                className="w-full justify-start h-12 px-4"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};