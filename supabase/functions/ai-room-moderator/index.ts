import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomId, recentMessages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get room context
    const { data: room } = await supabase
      .from('rooms')
      .select('name, theme, description')
      .eq('id', roomId)
      .single();

    const systemPrompt = `You are an AI moderator for a collaborative ideation room called "${room?.name}" focused on "${room?.theme}".
    
Your role is to:
1. Suggest new creative ideas based on the conversation
2. Summarize key points when discussions get lengthy
3. Encourage balanced participation
4. Keep the conversation constructive and on-topic

Based on the recent messages, provide ONE of the following:
- A creative idea suggestion (type: "idea")
- A summary of key points (type: "summary")
- An encouragement for quiet participants (type: "engagement")

Recent conversation:
${recentMessages.join('\n')}

Respond with ONLY the suggestion text, no formatting or extra explanations.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate a helpful suggestion for the team.' }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error('Failed to get AI response');
    }

    const aiData = await aiResponse.json();
    const suggestion = aiData.choices[0].message.content;

    // Determine suggestion type based on content
    let suggestionType = 'idea';
    if (suggestion.toLowerCase().includes('summary') || suggestion.toLowerCase().includes('key points')) {
      suggestionType = 'summary';
    } else if (suggestion.toLowerCase().includes('participate') || suggestion.toLowerCase().includes('share')) {
      suggestionType = 'engagement';
    }

    // Save AI suggestion
    const { error: suggestionError } = await supabase
      .from('room_ai_suggestions')
      .insert([{
        room_id: roomId,
        suggestion: suggestion,
        suggestion_type: suggestionType,
      }]);

    if (suggestionError) throw suggestionError;

    // Post AI message to chat
    const { error: messageError } = await supabase
      .from('room_messages')
      .insert([{
        room_id: roomId,
        message: suggestion,
        is_ai: true,
      }]);

    if (messageError) throw messageError;

    return new Response(
      JSON.stringify({ success: true, suggestion }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-room-moderator:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
