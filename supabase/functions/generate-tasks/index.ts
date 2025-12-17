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
        const { goal } = await req.json();

        if (!goal) {
            return new Response(JSON.stringify({ error: 'Goal is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
        );

        const { data: { user } } = await supabaseClient.auth.getUser();
        let personaSummary = "";

        if (user) {
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('ai_persona_summary')
                .eq('user_id', user.id)
                .maybeSingle();
            personaSummary = profile?.ai_persona_summary || "";
        }

        // Call Google Gemini AI
        const API_KEY = Deno.env.get('GEMINI_API_KEY') || "AIzaSyDq9Jr-KvbciG9jEwNDi7aAe8VRfq7o6AA";

        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: {
                        text: `You are a productivity coach tailored to THIS SPECIFIC USER.
            
            USER PERSONA & CONTEXT:
            "${personaSummary}"
            
            Your job:
            1. Analyze their goal: "${goal}"
            2. CONSIDER their persona (struggles, business type, wins) when creating tasks.
               - If they struggle with focus, make tasks smaller.
               - If they are advanced, make tasks more strategic.
            3. Analyze achievability in ONE day.
            4. Break it down into 3-5 distinct, actionable micro-tasks.
            
            Return ONLY a valid JSON object with this structure:
            {
              "advice": "One sentence advice. CONNECT it to their persona (e.g., 'Given your focus on X...').",
              "tasks": ["Task 1", "Task 2", "Task 3"]
            }
            `
                    }
                },
                contents: [
                    {
                        role: 'user',
                        parts: {
                            text: `My goal for today is: "${goal}"`
                        }
                    }
                ],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            }),
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error('AI API error:', aiResponse.status, errorText);
            throw new Error(`AI API Error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const aiContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiContent) {
            throw new Error("No content in AI response");
        }

        // Parse AI response
        let parsedResponse;
        try {
            let jsonStr = aiContent.trim();
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1];
            }
            parsedResponse = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse AI JSON", e);
            parsedResponse = {
                advice: "Here are some tasks to help you get started.",
                tasks: ["Define the scope", "Start with the first step", "Review progress"]
            };
        }

        return new Response(JSON.stringify(parsedResponse), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in generate-tasks function:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
