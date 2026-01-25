import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert resume reviewer and career advisor. Analyze the resume content provided and give comprehensive, actionable feedback.

Your analysis should include:

1. **Overall Impression** (2-3 sentences)
   - First impression of the resume
   - Professional presentation assessment

2. **Strengths** (3-5 bullet points)
   - What the resume does well
   - Effective sections or content

3. **Areas for Improvement** (3-5 bullet points with specific suggestions)
   - Missing information or sections
   - Content that could be enhanced
   - Formatting or structure issues

4. **ATS Optimization Tips**
   - Keyword suggestions based on their field
   - Formatting recommendations for ATS systems

5. **Action Items** (prioritized list)
   - Top 5 specific changes to make immediately

Be encouraging but honest. Provide specific examples when suggesting improvements.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, fileName } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing resume:", fileName);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { 
            role: "user", 
            content: `Please analyze this resume and provide detailed feedback:\n\n---\n${resumeText}\n---\n\nFile name: ${fileName}` 
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to analyze resume" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content || "Unable to generate feedback";

    console.log("Resume analysis completed");

    return new Response(
      JSON.stringify({ feedback }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Resume analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
