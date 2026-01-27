import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Send, Bot, User as UserIcon, LogIn, Plus, MessageSquare, Trash2, Clock, Mic, MicOff, ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "../../integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  imageUrl?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-chat`;
const VOICE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-transcribe`;

const INITIAL_MESSAGE: Message = {
  id: "initial",
  content: "Hello! I'm your AI Career Counsellor. I'm here to help you navigate your career journey, explore new opportunities, and achieve your professional goals. How can I assist you today?",
  sender: "bot",
  timestamp: new Date()
};

export const ChatInterface = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    
    if (error) {
      console.error("Error loading conversations:", error);
      return;
    }
    
    setConversations(data || []);
  };

  const loadConversation = async (conversationId: string) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    if (error) {
      console.error("Error loading messages:", error);
      return;
    }
    
    const loadedMessages: Message[] = (data as any[]).map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      sender: msg.role === "user" ? "user" : "bot",
      timestamp: new Date(msg.created_at),
    }));
    
    setMessages([INITIAL_MESSAGE, ...loadedMessages]);
    setCurrentConversationId(conversationId);
    setShowHistory(false);
  };

  const createNewConversation = async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;
    
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.id, title })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
    
    setCurrentConversationId(data.id);
    loadConversations();
    return data.id;
  };

  const saveMessage = async (conversationId: string, role: "user" | "assistant", content: string) => {
    if (!user) return;
    
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role,
      content,
    });
  };

  const deleteConversation = async (conversationId: string) => {
    const { error } = await supabase
      .from("chat_conversations")
      .delete()
      .eq("id", conversationId);
    
    if (error) {
      toast.error("Failed to delete conversation");
      return;
    }
    
    if (currentConversationId === conversationId) {
      startNewChat();
    }
    
    loadConversations();
    toast.success("Conversation deleted");
  };

  const startNewChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setCurrentConversationId(null);
    setShowHistory(false);
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !selectedImage) || isTyping) return;

    // Upload image if selected
    let uploadedImageUrl: string | null = null;
    if (selectedImage) {
      uploadedImageUrl = await uploadImage();
      if (!uploadedImageUrl && selectedImage) {
        return; // Upload failed
      }
      clearSelectedImage();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage || (uploadedImageUrl ? "[Image attached]" : ""),
      sender: "user",
      timestamp: new Date(),
      imageUrl: uploadedImageUrl || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Create or use existing conversation
    let convId = currentConversationId;
    if (!convId && user) {
      convId = await createNewConversation(inputMessage);
    }

    // Save user message
    if (convId && user) {
      await saveMessage(convId, "user", inputMessage);
    }

    // Prepare messages for API
    const apiMessages = messages
      .filter(m => m.id !== "initial")
      .map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.content
      }));
    
    apiMessages.push({ role: "user", content: inputMessage });

    let assistantContent = "";

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment and try again.");
        } else if (response.status === 402) {
          toast.error("Service temporarily unavailable. Please try again later.");
        } else {
          toast.error(errorData.error || "Failed to get response");
        }
        setIsTyping(false);
        return;
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const assistantMessageId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        content: "",
        sender: "bot",
        timestamp: new Date()
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => 
                prev.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => 
                prev.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch { /* ignore partial leftovers */ }
        }
      }

      // Save assistant message
      if (convId && user && assistantContent) {
        await saveMessage(convId, "assistant", assistantContent);
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Voice recording functions
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to access microphone. Please allow microphone access.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const response = await fetch(VOICE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ audio: base64Audio }),
        });

        if (!response.ok) {
          throw new Error('Transcription failed');
        }

        const data = await response.json();
        if (data.text) {
          setInputMessage(prev => prev ? `${prev} ${data.text}` : data.text);
          toast.success("Voice transcribed successfully!");
        }
        setIsTranscribing(false);
      };
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Failed to transcribe audio. Please try again.");
      setIsTranscribing(false);
    }
  };

  // Image upload functions
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !user) return null;
    
    setIsUploadingImage(true);
    try {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, selectedImage);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(data.path);
      
      return publicUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image");
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (processedLine.startsWith('• ') || processedLine.startsWith('- ')) {
        processedLine = `<span class="ml-2">${processedLine}</span>`;
      }
      
      return (
        <span 
          key={index} 
          dangerouslySetInnerHTML={{ __html: processedLine }}
          className="block"
        />
      );
    });
  };

  return (
    <div className="flex h-full max-h-[calc(100vh-180px)]">
      {/* Chat History Sidebar */}
      {user && (
        <div className={cn(
          "border-r border-border/50 bg-surface/50 transition-all duration-300 flex flex-col",
          showHistory ? "w-72" : "w-0 overflow-hidden"
        )}>
          <div className="p-4 border-b border-border/50">
            <Button
              onClick={startNewChat}
              className="w-full gradient-primary text-primary-foreground"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all group",
                    currentConversationId === conv.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-accent"
                  )}
                  onClick={() => loadConversation(conv.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No previous conversations
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI Career Counsellor</h3>
                <p className="text-sm text-muted-foreground">Online • Ready to help</p>
              </div>
            </div>
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                History
              </Button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 px-6">
          <Card className="h-full gradient-card border-0 shadow-soft">
            <ScrollArea className="h-full p-6">
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start gap-3",
                      message.sender === "user" ? "flex-row-reverse" : ""
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      message.sender === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "gradient-primary"
                    )}>
                      {message.sender === "user" ? (
                        <UserIcon className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                    
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 shadow-soft",
                      message.sender === "user" 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : "bg-surface border border-border/50"
                    )}>
                      {message.imageUrl && (
                        <img 
                          src={message.imageUrl} 
                          alt="Uploaded" 
                          className="max-w-full rounded-lg mb-2 max-h-48 object-cover"
                        />
                      )}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {renderContent(message.content)}
                      </div>
                      <p className={cn(
                        "text-xs mt-2 opacity-70",
                        message.sender === "user" ? "text-primary-foreground" : "text-muted-foreground"
                      )}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="bg-surface border border-border/50 rounded-2xl px-4 py-3 shadow-soft">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
          </Card>
        </div>

        {/* Input Area */}
        <div className="p-6 pt-4">
          {user ? (
            <Card className="gradient-card border-0 shadow-soft p-4">
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-24 rounded-lg border border-border/50"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={clearSelectedImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <div className="flex gap-2 items-center">
                {/* Image Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping || isUploadingImage}
                  className="h-11 px-3"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                </Button>
                
                {/* Voice Recording Button */}
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTyping || isTranscribing}
                  className="h-11 px-3"
                >
                  {isTranscribing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                
                <Input
                  value={inputMessage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your career goals, skill development, job search tips..."
                  className="flex-1 bg-background/50 border-border/50 focus:border-primary h-11"
                  disabled={isTyping || isTranscribing}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && !selectedImage) || isTyping || isUploadingImage}
                  className="gradient-primary text-primary-foreground shadow-soft hover:shadow-glow transition-bounce h-11 px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {isRecording && (
                <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  Recording... Click the mic button to stop
                </p>
              )}
            </Card>
          ) : (
            <Card className="gradient-card border-0 shadow-soft p-6 text-center">
              <p className="text-muted-foreground mb-4">Please login to start chatting with your AI Career Counsellor</p>
              <Button 
                onClick={() => navigate("/auth")}
                className="gradient-primary text-primary-foreground shadow-soft hover:shadow-glow transition-bounce"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Click to Login
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
