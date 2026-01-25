import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, careerPath } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating job recommendations for career path:", careerPath);

    const systemPrompt = `You are a career advisor AI that provides personalized job recommendations. Based on the user's profile and selected career path, suggest 5-8 specific job roles that would be a good fit.

For each job recommendation, provide:
1. Job Title
2. Company Type (e.g., Startup, Enterprise, Consulting, etc.)
3. Match Score (1-100 based on how well it fits the user's profile)
4. Key Requirements (3-4 bullet points)
5. Why It's a Good Fit (1-2 sentences)
6. Estimated Salary Range
7. Growth Potential (Low/Medium/High)

Format your response as a valid JSON array with objects containing: title, companyType, matchScore, requirements (array), whyGoodFit, salaryRange, growthPotential.

Be specific and realistic based on the user's experience level and skills.`;

    const userPrompt = `Generate job recommendations for this candidate:

Profile:
- Name: ${profile?.full_name || 'Not specified'}
- Current Role: ${profile?.job_title || 'Not specified'}
- Years of Experience: ${profile?.years_of_experience || 0}
- Education: ${profile?.education_level?.replace('_', ' ') || 'Not specified'} in ${profile?.field_of_study || 'Not specified'}
- Skills: ${profile?.skills?.join(', ') || 'Not specified'}
- Career Goals: ${profile?.career_goals || 'Not specified'}

Selected Career Path: ${careerPath || 'General'}

Provide job recommendations that align with their career path and experience level.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_job_recommendations",
              description: "Return job recommendations for the user",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        companyType: { type: "string" },
                        matchScore: { type: "number" },
                        requirements: { type: "array", items: { type: "string" } },
                        whyGoodFit: { type: "string" },
                        salaryRange: { type: "string" },
                        growthPotential: { type: "string", enum: ["Low", "Medium", "High"] },
                      },
                      required: ["title", "companyType", "matchScore", "requirements", "whyGoodFit", "salaryRange", "growthPotential"],
                    },
                  },
                },
                required: ["recommendations"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_job_recommendations" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate recommendations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      const recommendations = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(recommendations), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse content directly
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify({ recommendations: parsed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        console.log("Could not parse content as JSON");
      }
    }

    return new Response(
      JSON.stringify({ error: "Could not parse recommendations" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Job recommendations error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
