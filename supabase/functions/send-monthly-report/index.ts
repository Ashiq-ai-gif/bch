import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts'

const ENGAGELO_API_KEY = Deno.env.get("ENGAGELO_API_KEY");
const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("Starting Monthly Report Notification Run...");

        const { data: users, error } = await supabaseAdmin
            .from('profiles')
            .select('user_id, full_name, phone')
            .not('phone', 'is', null);

        if (error) throw error;
        
        console.log(`Found ${users?.length || 0} users to notify.`);

        const results = [];
        
        for (const user of users || []) {
            if (!user.phone) continue;
            
            // 3. Fetch User's Data for the Month
            // 3. Fetch User's Data for the Month
            const now = new Date();
            // If run in the first 7 days of a month, assume it's for the PREVIOUS month
            const isEarlyMonth = now.getDate() <= 7;
            const targetDate = isEarlyMonth ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : now;
            
            const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0); // Last day of target month
            
            const startDateStr = startOfMonth.toISOString().split('T')[0];
            const endDateStr = endOfMonth.toISOString().split('T')[0];
            const currentMonth = startOfMonth.toLocaleString('default', { month: 'long' });

            const [habitsResult, businessResult, learningResult] = await Promise.all([
                supabaseAdmin.from('daily_habits').select('*').eq('user_id', user.user_id).gte('log_date', startDateStr),
                supabaseAdmin.from('daily_business_logs').select('*').eq('user_id', user.user_id).gte('log_date', startDateStr),
                supabaseAdmin.from('daily_learning').select('*').eq('user_id', user.user_id).gte('log_date', startDateStr)
            ]);

            const habits = habitsResult.data || [];
            const business = businessResult.data || [];
            const learning = learningResult.data || [];

            // 4. Generate AI Report
            const context = `
                User: ${user.full_name}
                Period: Monthly (${currentMonth})
                Habits Logged: ${habits.length} days.
                Total Revenue: ${business.reduce((acc: number, curr: any) => acc + Number(curr.revenue), 0)}.
                Learning Count: ${learning.length}.
            `;

            let aiSummary = "Keep pushing forward!";
            let aiActions = "Set clear goals.";

            try {
                const API_KEY = Deno.env.get('GEMINI_API_KEY');
                if (API_KEY) {
                    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            system_instruction: {
                                parts: [{ text: "You are a business mentor. Analyze likely monthly performance. Output JSON: { summary: string, actions: string[] }." }]
                            },
                            contents: [{ role: 'user', parts: [{ text: context }] }]
                        }),
                    });

                    if (aiResponse.ok) {
                        const aiData = await aiResponse.json();
                        const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
                        try {
                            const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                            const parsed = JSON.parse(cleanedText);
                            aiSummary = parsed.summary || aiSummary;
                            aiActions = Array.isArray(parsed.actions) ? parsed.actions.join('\n') : (parsed.actions || aiActions);
                        } catch (e) { aiSummary = rawText || aiSummary; }
                    }
                }
            } catch (e) { console.error("AI Error", e); }

            // 5. Save Report
             await supabaseAdmin.from('ai_reports').insert({
                    user_id: user.user_id,
                    report_period: 'monthly',
                    start_date: startDateStr,
                    end_date: endDateStr,
                    results_report: aiSummary,
                    actions_report: aiActions,
                    performance_rating: 4 // Placeholder logic
            });

            // 6. Send WhatsApp
            const url = new URL("https://bot.engagelo.com/api/v1/whatsapp/send/template");
            url.searchParams.append("apiToken", ENGAGELO_API_KEY || "");
            url.searchParams.append("phone_number_id", "900886739777976");
            url.searchParams.append("template_id", "REPLACE_WITH_MONTHLY_TEMPLATE_ID");
            url.searchParams.append("phone_number", user.phone);
            
            // Note: We need to figure out how to pass {{1}} (Name) and {{2}} (Month)
            // url.searchParams.append("1", user.full_name);
            // url.searchParams.append("2", currentMonth);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            results.push({ user: user.full_name, status: response.status });
        }

        return new Response(JSON.stringify({ success: true, sent_count: results.length }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })

    } catch (error: any) {
        console.error("Error:", error);
         return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        })
    }
})
