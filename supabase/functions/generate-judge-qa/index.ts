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
    const { summary } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an experienced hackathon judge. Generate challenging but fair questions that judges typically ask, along with strong sample answers.

Provide clean, formatted Q&A WITHOUT using markdown symbols like # or *. Use plain text with clear structure:

QUESTION 1: TECHNICAL IMPLEMENTATION
How did you build this solution? What technologies did you use and why?

ANSWER 1:
A clear, confident response addressing the technical approach, architecture decisions, and technology choices. Explain the reasoning behind key technical decisions.

QUESTION 2: SCALABILITY AND FUTURE PLANS
How would this scale to serve thousands of users? What are your next steps?

ANSWER 2:
Demonstrate vision and planning for growth. Discuss infrastructure considerations, performance optimization, and roadmap for future development.

QUESTION 3: MARKET AND USER IMPACT
Who are your target users and how does this solve their real problems?

ANSWER 3:
Show deep understanding of user needs and pain points. Provide specific examples of how users would benefit from this solution.

QUESTION 4: CHALLENGES FACED
What was the biggest challenge you encountered and how did you overcome it?

ANSWER 4:
Honest but positive response showing problem-solving skills. Highlight learning and adaptability during the hackathon.

QUESTION 5: DIFFERENTIATION
What makes your solution unique compared to existing alternatives?

ANSWER 5:
Clear articulation of competitive advantage and unique value proposition. Explain what sets this project apart.

PRACTICE TIPS
• Take a breath before answering each question
• Be honest if you don't know something, then explain how you'd find out
• Show enthusiasm and confidence in your voice
• Make eye contact with all judges
• Keep answers concise but complete (30-60 seconds each)
• End each answer on a positive note

Make questions realistic and answers inspiring! Use bullet points (•) for lists. No asterisks or hashes.`;

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
          { role: "user", content: `Generate judge Q&A practice for this project:\n\n${summary}` },
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
    const qa = data.choices[0].message.content;

    return new Response(JSON.stringify({ qa }), {
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