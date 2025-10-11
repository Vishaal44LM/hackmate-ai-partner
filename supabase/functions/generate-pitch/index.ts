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

Provide:

**🎯 Tagline**
A memorable one-liner that captures the essence (max 10 words)

**📢 60-Second Pitch Script**
A structured pitch following this format:

**Hook (5-10 seconds)**
Start with a compelling problem or statistic

**Problem (10-15 seconds)**
Explain the pain point clearly

**Solution (15-20 seconds)**
Describe your solution and how it works

**Impact (10-15 seconds)**
Show the value and potential impact

**Call to Action (5-10 seconds)**
End with a memorable statement

**💡 Delivery Tips**
- Key points to emphasize
- Where to pause for effect
- Body language suggestions

Make it passionate, clear, and judge-winning!`;

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