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

        const { message, history } = await req.json();

        // Fetch user context (Profile, Recent Habits, Business Logs)
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        const now = new Date();
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        const startDateStr = startDate.toISOString().split('T')[0];

        const [habitsResult, businessResult, goalsResult] = await Promise.all([
            supabaseClient
                .from('daily_habits')
                .select('*')
                .eq('user_id', user.id)
                .gte('log_date', startDateStr)
                .order('log_date', { ascending: false })
                .limit(5),
            supabaseClient
                .from('daily_business_logs')
                .select('log_date, revenue, gross_profit')
                .eq('user_id', user.id)
                .gte('log_date', startDateStr)
                .order('log_date', { ascending: false })
                .limit(5),
            supabaseClient
                .from('financial_goals')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle()
        ]);

        const habits = habitsResult.data || [];
        const businessLogs = businessResult.data || [];
        const goals = goalsResult.data;

        const contextSummary = `
User: ${profile?.full_name || 'User'}
Role: ${profile?.organization_name || 'Business Owner'}
Recent Data (Last 7 days):
- Habits Logged: ${habits.length}
- Recent Revenue: ${businessLogs.map(b => `${b.log_date}: ₹${b.revenue}`).join(', ')}
- Goals: ${goals ? `Target: ₹${goals.year_1_target}` : 'No goals set'}
`;

        // Hardcoded key as per user preference
        const API_KEY = "AIzaSyAJN5-n6Nhz9cdsiXw9IBcn8X-w8dqsmJs";

        // Construct the conversation
        const chatHistory = history?.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        })) || [];

        // Add current message
        chatHistory.push({
            role: 'user',
            parts: [{ text: `Context:\n${contextSummary}\n\nUser Message: ${message}` }]
        });

        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: "You are a friendly and knowledgeable business success chatbot for the 'Business Career Hub' (BCH) app. Your goal is to help users track their habits, improve their business, and stay motivated. Use the provided data context to give personalized advice. Be concise, encouraging, and actionable." }]
                },
                contents: chatHistory
            }),
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error('AI API error:', aiResponse.status, errorText);
            throw new Error(`AI API Error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const reply = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

        return new Response(JSON.stringify({ reply }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
