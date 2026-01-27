import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Resume {
  id: string;
  file_name: string;
  file_url: string;
  ai_feedback: string | null;
  analyzed_at: string | null;
  created_at: string;
}

export const ResumeUpload = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResumes = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching resumes:", error);
    } else {
      setResumes(data || []);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF, DOC, DOCX, or TXT file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Upload to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("resumes")
        .getPublicUrl(filePath);

      // Save to database
      const { data: resumeData, error: dbError } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success("Resume uploaded successfully!");
      fetchResumes();

      // Analyze the resume
      await analyzeResume(resumeData, file);

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload resume. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const analyzeResume = async (resume: Resume, file: File) => {
    setIsAnalyzing(true);
    setSelectedResume(resume);

    try {
      // Read file content
      const text = await file.text();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-resume`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            resumeText: text,
            fileName: resume.file_name,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to analyze resume");
      }

      const data = await response.json();
      
      // Update database with feedback
      await supabase
        .from("resumes")
        .update({
          ai_feedback: data.feedback,
          analyzed_at: new Date().toISOString(),
        })
        .eq("id", resume.id);

      setFeedback(data.feedback);
      fetchResumes();
      toast.success("Resume analysis complete!");

    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze resume. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const viewFeedback = (resume: Resume) => {
    setSelectedResume(resume);
    setFeedback(resume.ai_feedback);
  };

  const handleDeleteClick = (resume: Resume) => {
    setResumeToDelete(resume);
    setDeleteDialogOpen(true);
  };

  const deleteResume = async () => {
    if (!resumeToDelete || !user) return;

    setIsDeleting(true);
    try {
      // Extract file path from URL
      const url = new URL(resumeToDelete.file_url);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('resumes') + 1).join('/');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("resumes")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("resumes")
        .delete()
        .eq("id", resumeToDelete.id);

      if (dbError) throw dbError;

      // Clear feedback if this was the selected resume
      if (selectedResume?.id === resumeToDelete.id) {
        setSelectedResume(null);
        setFeedback(null);
      }

      toast.success("Resume deleted successfully!");
      fetchResumes();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete resume. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6">Resume Upload & Analysis</h2>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <Card className="gradient-card border-0 shadow-soft p-8">
          <div 
            className="border-2 border-dashed border-border/50 rounded-2xl p-12 text-center hover:border-primary/50 transition-smooth cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {isUploading ? (
              <>
                <Loader2 className="h-16 w-16 text-primary mx-auto mb-6 animate-spin" />
                <h3 className="text-xl font-bold mb-2">Uploading...</h3>
              </>
            ) : (
              <>
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Upload className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Upload Your Resume</h3>
                <p className="text-muted-foreground mb-6">
                  Drag and drop your resume here, or click to browse
                </p>
                <Button className="gradient-primary text-primary-foreground shadow-soft hover:shadow-glow">
                  <FileText className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
                </p>
              </>
            )}
          </div>

          {/* Previous Resumes */}
          {resumes.length > 0 && (
            <div className="mt-8">
              <h4 className="font-semibold mb-4">Your Resumes</h4>
              <div className="space-y-3">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between p-4 bg-background/50 rounded-xl hover:bg-background/80 transition-smooth"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{resume.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(resume.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(resume.file_url, '_blank')}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      {resume.ai_feedback ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewFeedback(resume)}
                          className="text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          View Feedback
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Not analyzed
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(resume)}
                        className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Feedback Section */}
        <Card className="gradient-card border-0 shadow-soft p-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            AI Feedback
          </h3>

          {isAnalyzing ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Analyzing your resume...</p>
              <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
            </div>
          ) : feedback ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="bg-background/50 rounded-xl p-6 whitespace-pre-wrap text-sm leading-relaxed max-h-[60vh] overflow-y-auto">
                {feedback}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Upload a resume to get AI-powered feedback</p>
              <p className="text-sm mt-2">Our AI will analyze your resume and provide detailed improvement suggestions</p>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{resumeToDelete?.file_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteResume}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
