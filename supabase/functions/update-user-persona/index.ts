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
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'No authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Fetch user profile and current persona
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // Fetch last 5 days of data for context
        const { data: recentHabits } = await supabaseClient
            .from('daily_habits')
            .select('*')
            .eq('user_id', user.id)
            .order('log_date', { ascending: false })
            .limit(5);

        const { data: recentBusiness } = await supabaseClient
            .from('daily_business_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('log_date', { ascending: false })
            .limit(5);

        const context = `
    EXISTING SUMMARY: ${profile?.ai_persona_summary || "None yet."}
    
    PROFILE:
    Name: ${profile?.full_name}
    Org: ${profile?.organization_name}
    Program: ${profile?.enrolled_program}
    Onboarding Answer 1: ${profile?.onboarding_answer_1}
    Onboarding Answer 2: ${profile?.onboarding_answer_2}
    
    RECENT HABITS (Last 5 Logs):
    ${recentHabits?.map((h: any) => `- ${h.log_date}: Wake ${h.wake_up_time}, Goal: ${h.todays_goal}, Well: ${h.what_went_well}, Wrong: ${h.what_went_wrong}`).join('\n')}
    
    RECENT BUSINESS (Last 5 Logs):
    ${recentBusiness?.map((b: any) => `- ${b.log_date}: Rev ${b.revenue}, Profit ${b.gross_profit}, Notes: ${b.notes}`).join('\n')}
    `;

        // Call Google Gemini AI
        // Call Google Gemini AI
        // Hardcoded key as per user request to bypass environment issues
        const API_KEY = "AIzaSyAJN5-n6Nhz9cdsiXw9IBcn8X-w8dqsmJs";
        if (!API_KEY) {
            throw new Error("GEMINI_API_KEY not set");
        }

        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [
                        {
                            text: `You are a sophisticated AI Profiler. 
            Your goal is to maintain a "Living Persona Document" for this user.
            
            Read the EXISTING SUMMARY, PROFILE, and RECENT LOGS.
            Create a NEW, updated summary (approx 150-200 words).
            
            The summary must capture:
            1. Their core identity and business type.
            2. Their CURRENT struggles (based on recent 'what went wrong').
            3. Their CURRENT wins and momentum.
            4. Their psychological state (determined, struggling, consistent, etc.).
            
            This summary will be used by other AI agents to generate personalized tasks.
            Do NOT include "Here is the summary". Just write the summary text directly.`
                        }
                    ]
                },
                contents: [{ role: 'user', parts: [{ text: `Update the persona based on this data:\n${context}` }] }]
            }),
        });

        if (!aiResponse.ok) {
            throw new Error(`AI API Error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const newSummary = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (newSummary) {
            // Save the updated summary
            await supabaseClient
                .from('profiles')
                .update({ ai_persona_summary: newSummary })
                .eq('user_id', user.id);
        }

        return new Response(JSON.stringify({ success: true, summary: newSummary }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in update-user-persona:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
