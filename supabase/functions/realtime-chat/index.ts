import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);

  let openAISocket: WebSocket | null = null;

  clientSocket.onopen = () => {
    console.log("Client connected, establishing OpenAI connection...");

    openAISocket = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
      ["realtime", `openai-insecure-api-key.${OPENAI_API_KEY}`, "openai-beta.realtime-v1"]
    );

    openAISocket.onopen = () => {
      console.log("Connected to OpenAI Realtime API");
    };

    openAISocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("OpenAI event:", data.type);

        // Forward the message to the client
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(event.data);
        }

        // When session is created, send session update
        if (data.type === "session.created") {
          const sessionUpdate = {
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: `You are an expert AI Career Counsellor having a real-time voice conversation. 
              
Your role is to:
- Help users explore career options and provide personalized guidance
- Assist with job interview preparation and mock interviews
- Offer resume and cover letter advice
- Provide insights on industry trends and skill development
- Guide career transitions and professional growth strategies

Be conversational, supportive, and encouraging. Keep responses concise since this is a voice conversation. 
Ask follow-up questions to better understand the user's situation.
When doing mock interviews, role-play as an interviewer and provide constructive feedback.`,
              voice: "alloy",
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
              input_audio_transcription: {
                model: "whisper-1"
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 800
              },
              tools: [
                {
                  type: "function",
                  name: "start_mock_interview",
                  description: "Start a mock interview session for a specific role",
                  parameters: {
                    type: "object",
                    properties: {
                      role: { type: "string", description: "The job role to practice interviewing for" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"], description: "Interview difficulty level" }
                    },
                    required: ["role"]
                  }
                },
                {
                  type: "function",
                  name: "provide_interview_feedback",
                  description: "Provide detailed feedback on the user's interview responses",
                  parameters: {
                    type: "object",
                    properties: {
                      strengths: { type: "array", items: { type: "string" }, description: "What the user did well" },
                      improvements: { type: "array", items: { type: "string" }, description: "Areas for improvement" },
                      overall_score: { type: "number", description: "Overall score from 1-10" }
                    },
                    required: ["strengths", "improvements", "overall_score"]
                  }
                }
              ],
              tool_choice: "auto",
              temperature: 0.8,
              max_response_output_tokens: 4096
            }
          };
          openAISocket!.send(JSON.stringify(sessionUpdate));
          console.log("Session update sent");
        }
      } catch (error) {
        console.error("Error processing OpenAI message:", error);
      }
    };

    openAISocket.onerror = (error) => {
      console.error("OpenAI WebSocket error:", error);
    };

    openAISocket.onclose = (event) => {
      console.log("OpenAI connection closed:", event.code, event.reason);
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.close();
      }
    };
  };

  clientSocket.onmessage = (event) => {
    try {
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.send(event.data);
      }
    } catch (error) {
      console.error("Error forwarding message to OpenAI:", error);
    }
  };

  clientSocket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
  };

  clientSocket.onclose = () => {
    console.log("Client disconnected");
    if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
      openAISocket.close();
    }
  };

  return response;
});
