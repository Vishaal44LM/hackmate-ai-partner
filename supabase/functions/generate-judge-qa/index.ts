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

Create 5 realistic Q&A pairs covering:

**❓ Question 1: Technical Implementation**
Focus on how the solution was built

**💬 Sample Answer 1:**
A clear, confident response addressing the technical approach

**❓ Question 2: Scalability & Future**
Ask about growth potential and next steps

**💬 Sample Answer 2:**
Demonstrate vision and planning

**❓ Question 3: Market/User Impact**
Question about real-world application

**💬 Sample Answer 3:**
Show understanding of user needs

**❓ Question 4: Challenges Faced**
What problems did they overcome?

**💬 Sample Answer 4:**
Honest but positive response

**❓ Question 5: Differentiation**
What makes this unique?

**💬 Sample Answer 5:**
Clear competitive advantage

**🎯 Practice Tips:**
- How to handle questions you don't know
- Body language suggestions
- Time management advice

Make questions realistic and answers inspiring!`;

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