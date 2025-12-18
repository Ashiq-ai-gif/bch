import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const AI_API_KEY = Deno.env.get('CEREBRAS_API_KEY') || Deno.env.get('OPENAI_API_KEY') || Deno.env.get('GEMINI_API_KEY');

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
        } else if (category === 'learning') {
            systemPrompt = "You are an expert business consultant and learning strategist. Analyze the user's key learning and implementation plan.";
            systemPrompt += " Provide 3 specific, actionable, and tactical suggestions to help them implement this learning effectively. Format as a numbered list.";
            userPrompt = `Learning Point: "${data.learning_point}". Implementation Plan: "${data.implementation_plan}". Generate 3 actionable suggestions.`;
        }

        // Determine Provider
        // Hardcoded key as per user request to bypass environment issues
        const GEMINI_API_KEY_LITERAL = "AIzaSyAJN5-n6Nhz9cdsiXw9IBcn8X-w8dqsmJs";
        const isGemini = !!GEMINI_API_KEY_LITERAL; // Force Gemini if literal key is present
        const isCerebras = !!Deno.env.get('CEREBRAS_API_KEY');

        let response;
        if (isGemini) {
            const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY_LITERAL}`;
            response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                    }]
                })
            });
        } else {
            // OpenAI / Cerebras
            const MODEL = isCerebras ? 'llama3.1-8b' : 'gpt-4o-mini';
            const API_URL = isCerebras
                ? 'https://api.cerebras.ai/v1/chat/completions'
                : 'https://api.openai.com/v1/chat/completions';

            response = await fetch(API_URL, {
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
                    max_tokens: category === 'learning' ? 300 : 50,
                }),
            });
        }

        const result = await response.json();
        console.log("AI API Result:", JSON.stringify(result)); // DEBUG LOG

        let summary = "";

        if (isGemini) {
            summary = result.candidates?.[0]?.content?.parts?.[0]?.text;
        } else {
            summary = result.choices?.[0]?.message?.content?.trim();
        }

        if (!summary) {
            console.error("AI returned no summary. Result:", JSON.stringify(result));
            throw new Error("AI returned no content");
        }

        return new Response(
            JSON.stringify({ summary: summary || "Nice work!" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error("AI API Error:", error);
        return new Response(
            JSON.stringify({ error: error.message, summary: "Great job logging your progress today!" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})
