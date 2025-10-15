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

Provide a detailed breakdown WITHOUT using markdown symbols like # or *. Use plain text with clear sections and bullet points (•):

PROBLEM STATEMENT
Clear description of the problem being solved

PROPOSED SOLUTION
Detailed explanation of how the project solves the problem

TECH STACK
• Frontend technologies
• Backend technologies
• APIs/Services needed
• Database requirements

36-HOUR TIMELINE

Hours 0-6: Setup and Initial Development
• Set up development environment
• Initialize project structure
• Create basic UI framework

Hours 6-18: Core Feature Implementation
• Build main functionality
• Integrate APIs and services
• Implement key user workflows

Hours 18-30: Integration and Testing
• Connect frontend and backend
• Test core features
• Fix critical bugs

Hours 30-36: Polish and Presentation
• Refine UI/UX
• Prepare demo and pitch
• Deploy to production

KEY FEATURES (MVP)
• List of must-have features for the hackathon demo
• Each feature described clearly
• Prioritized for 36-hour timeline

FUTURE ENHANCEMENTS
• Features to add after the hackathon
• Scalability improvements
• Additional functionality

Make it actionable and realistic for a 36-hour hackathon! Use bullet points (•) and clean formatting without asterisks or hashes.`;

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