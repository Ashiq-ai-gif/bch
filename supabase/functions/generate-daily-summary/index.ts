import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const AI_API_KEY = Deno.env.get('CEREBRAS_API_KEY') || Deno.env.get('OPENAI_API_KEY');
// Using Cerebras if available (llama3.1-8b), fallback to OpenAI (gpt-4o-mini)
const MODEL = Deno.env.get('CEREBRAS_API_KEY') ? 'llama3.1-8b' : 'gpt-4o-mini';
const API_URL = Deno.env.get('CEREBRAS_API_KEY')
    ? 'https://api.cerebras.ai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { category, data } = await req.json()

        if (!category || !data) {
            throw new Error('Missing category or data')
        }

        let systemPrompt = "You are a concise, motivational business coach.";
        let userPrompt = "";

        if (category === 'habits') {
            systemPrompt += " Analyze the user's daily habits and provide a ONE-SENTENCE, punchy, encouraging summary. Focus on completion rate and consistency.";
            userPrompt = `Habits Data: ${JSON.stringify(data)}. Generate a short summary (max 15 words).`;
        } else if (category === 'business') {
            systemPrompt += " Analyze the user's daily business metrics (revenue, profit) and provide a ONE-SENTENCE, professional, insight-driven summary.";
            userPrompt = `Business Data: Revenue: ${data.revenue}, Profit: ${data.gross_profit}. Generate a short summary (max 15 words).`;
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 50,
            }),
        })

        const result = await response.json()
        const summary = result.choices[0].message.content.trim();

        return new Response(
            JSON.stringify({ summary }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message, summary: "Great job logging your progress today!" }), // Fallback
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // Return 200 with fallback to avoid breaking UI
        )
    }
})
