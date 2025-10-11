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
    const { idea } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a hackathon project planner. Expand the given project idea into a comprehensive plan.

Provide a detailed breakdown with these sections:

**🎯 Problem Statement**
Clear description of the problem being solved

**💡 Proposed Solution**
Detailed explanation of how the project solves the problem

**🛠️ Tech Stack**
- Frontend technologies
- Backend technologies
- APIs/Services needed
- Database requirements

**👥 Team Roles**
Suggested roles and responsibilities for a 2-4 person team

**⏱️ 36-Hour Timeline**
Hour-by-hour breakdown:
- Hours 0-6: Setup and initial development
- Hours 6-18: Core feature implementation
- Hours 18-30: Integration and testing
- Hours 30-36: Polish, presentation prep, and deployment

**🎨 Key Features (MVP)**
List of must-have features for the hackathon demo

**🚀 Future Enhancements**
Features to add after the hackathon

Make it actionable and realistic for a 36-hour hackathon!`;

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
          { role: "user", content: `Expand this hackathon project idea into a detailed plan:\n\n${idea}` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const expansion = data.choices[0].message.content;

    return new Response(JSON.stringify({ expansion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});