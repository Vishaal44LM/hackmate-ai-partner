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

    const systemPrompt = `You are a professional pitch coach for hackathons. Create a compelling 60-second pitch based on the project summary.

Provide clean, formatted output WITHOUT using markdown symbols like # or *. Use plain text with clear sections:

TAGLINE
A memorable one-liner that captures the essence (max 10 words)

PROJECT SUMMARY
Provide a clear, explainable summary of what the project does, why it matters, and who it helps. Make it easy to understand for anyone, even non-technical judges. Explain the value proposition clearly.

60-SECOND PITCH SCRIPT

Hook (5-10 seconds)
Start with a compelling problem or statistic that grabs attention

Problem (10-15 seconds)
Explain the pain point clearly and why it matters

Solution (15-20 seconds)
Describe your solution and how it works in simple terms

Impact (10-15 seconds)
Show the value and potential impact on users and society

Call to Action (5-10 seconds)
End with a memorable statement that inspires action

DELIVERY TIPS
• Speak with confidence and passion
• Make eye contact with judges
• Use hand gestures to emphasize key points
• Pause after important statements
• Smile and show enthusiasm for your project
• Practice timing to stay within 60 seconds

Make it passionate, clear, and judge-winning! Use bullet points (•) for lists. No asterisks or hashes.`;

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
          { role: "user", content: `Create a winning 60-second pitch for this project:\n\n${summary}` },
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
    const pitch = data.choices[0].message.content;

    return new Response(JSON.stringify({ pitch }), {
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