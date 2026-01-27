import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Loader2, Bot, User as UserIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { AudioRecorder, AudioQueue, encodeAudioForAPI, createWavFromPCM } from "../../utils/RealtimeAudio";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const REALTIME_URL = `wss://ejvtczsxqavqenmmfztq.functions.supabase.co/functions/v1/realtime-chat`;

export const RealtimeVoiceChat = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [userTranscript, setUserTranscript] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentTranscript, userTranscript]);

  const handleAudioData = useCallback((audioData: Float32Array) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && !isMuted) {
      const base64Audio = encodeAudioForAPI(audioData);
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio
      }));
    }
  }, [isMuted]);

  const processAudioDelta = useCallback(async (base64Audio: string) => {
    if (!audioQueueRef.current) return;

    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      await audioQueueRef.current.addToQueue(bytes);
    } catch (error) {
      console.error("Error processing audio delta:", error);
    }
  }, []);

  const startConnection = useCallback(async () => {
    setIsConnecting(true);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      audioQueueRef.current = new AudioQueue(
        audioContextRef.current,
        (playing) => setIsAISpeaking(playing)
      );

      // Connect WebSocket
      console.log("Connecting to:", REALTIME_URL);
      const ws = new WebSocket(REALTIME_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setIsConnecting(false);

        // Start recording
        recorderRef.current = new AudioRecorder(handleAudioData);
        recorderRef.current.start();

        toast.success("Voice chat connected! Start speaking.");
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received:", data.type);

          switch (data.type) {
            case "response.audio.delta":
              if (data.delta) {
                processAudioDelta(data.delta);
              }
              break;

            case "response.audio_transcript.delta":
              if (data.delta) {
                setCurrentTranscript(prev => prev + data.delta);
              }
              break;

            case "response.audio_transcript.done":
              if (currentTranscript || data.transcript) {
                const finalTranscript = data.transcript || currentTranscript;
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: "assistant",
                  content: finalTranscript,
                  timestamp: new Date()
                }]);
                setCurrentTranscript("");
              }
              break;

            case "conversation.item.input_audio_transcription.completed":
              if (data.transcript) {
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: "user",
                  content: data.transcript,
                  timestamp: new Date()
                }]);
                setUserTranscript("");
              }
              break;

            case "input_audio_buffer.speech_started":
              setUserTranscript("Listening...");
              break;

            case "input_audio_buffer.speech_stopped":
              setUserTranscript("");
              break;

            case "response.function_call_arguments.done":
              console.log("Function call:", data.name, data.arguments);
              // Handle function calls (mock interview start, feedback)
              if (data.name === "start_mock_interview") {
                toast.info("Starting mock interview session...");
              } else if (data.name === "provide_interview_feedback") {
                toast.success("Interview feedback received!");
              }
              break;

            case "error":
              console.error("API Error:", data.error);
              toast.error(data.error?.message || "An error occurred");
              break;
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error("Connection error. Please try again.");
        setIsConnecting(false);
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        setIsConnected(false);
        setIsConnecting(false);
        recorderRef.current?.stop();
        audioQueueRef.current?.clear();
      };

    } catch (error) {
      console.error("Failed to start connection:", error);
      toast.error("Failed to start voice chat. Please allow microphone access.");
      setIsConnecting(false);
    }
  }, [handleAudioData, processAudioDelta, currentTranscript]);

  const stopConnection = useCallback(() => {
    wsRef.current?.close();
    recorderRef.current?.stop();
    audioQueueRef.current?.clear();
    audioContextRef.current?.close();

    wsRef.current = null;
    recorderRef.current = null;
    audioQueueRef.current = null;
    audioContextRef.current = null;

    setIsConnected(false);
    setIsAISpeaking(false);
    setCurrentTranscript("");
    setUserTranscript("");
    toast.info("Voice chat ended");
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    toast.info(isMuted ? "Microphone unmuted" : "Microphone muted");
  }, [isMuted]);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              isConnected 
                ? "gradient-primary animate-pulse" 
                : "bg-muted"
            )}>
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Career Counsellor</h3>
              <p className="text-sm text-muted-foreground">
                {isConnected 
                  ? isAISpeaking 
                    ? "Speaking..." 
                    : "Listening..."
                  : "Voice Chat Offline"
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected && (
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="sm"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}

            <Button
              variant={isConnected ? "destructive" : "default"}
              onClick={isConnected ? stopConnection : startConnection}
              disabled={isConnecting}
              className={cn(!isConnected && "gradient-primary text-primary-foreground")}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : isConnected ? (
                <>
                  <PhoneOff className="h-4 w-4 mr-2" />
                  End Call
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Start Voice Chat
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 px-6">
        <Card className="h-full gradient-card border-0 shadow-soft">
          <ScrollArea className="h-full p-6">
            {messages.length === 0 && !isConnected ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
                  <Phone className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Real-Time Voice Chat
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Have a natural voice conversation with your AI Career Counsellor. 
                  Get instant feedback, practice mock interviews, and receive personalized guidance.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start gap-3",
                      message.role === "user" ? "flex-row-reverse" : ""
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "gradient-primary"
                    )}>
                      {message.role === "user" ? (
                        <UserIcon className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                    
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 shadow-soft",
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : "bg-surface border border-border/50"
                    )}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className={cn(
                        "text-xs mt-2 opacity-70",
                        message.role === "user" ? "text-primary-foreground" : "text-muted-foreground"
                      )}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Current AI transcript */}
                {currentTranscript && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse">
                      <Volume2 className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="bg-surface border border-border/50 rounded-2xl px-4 py-3 shadow-soft">
                      <p className="text-sm leading-relaxed text-foreground">{currentTranscript}</p>
                    </div>
                  </div>
                )}

                {/* User speaking indicator */}
                {userTranscript && (
                  <div className="flex items-start gap-3 flex-row-reverse">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse">
                      <Mic className="h-4 w-4" />
                    </div>
                    <div className="bg-primary/20 border border-primary/30 rounded-2xl px-4 py-3 shadow-soft ml-auto">
                      <p className="text-sm text-primary">{userTranscript}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>
        </Card>
      </div>

      {/* Voice Status */}
      {isConnected && (
        <div className="p-6 pt-4">
          <Card className="gradient-card border-0 shadow-soft p-4">
            <div className="flex items-center justify-center gap-4">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                isAISpeaking 
                  ? "bg-primary/20 text-primary" 
                  : "bg-muted text-muted-foreground"
              )}>
                <Volume2 className={cn("h-4 w-4", isAISpeaking && "animate-pulse")} />
                <span className="text-sm font-medium">AI</span>
              </div>

              <div className="w-px h-6 bg-border" />

              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                !isMuted && !isAISpeaking 
                  ? "bg-primary/20 text-primary" 
                  : "bg-muted text-muted-foreground"
              )}>
                {isMuted ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className={cn("h-4 w-4", !isAISpeaking && "animate-pulse")} />
                )}
                <span className="text-sm font-medium">You</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
