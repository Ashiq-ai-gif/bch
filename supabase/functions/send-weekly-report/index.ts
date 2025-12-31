import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts'

const ENGAGELO_API_KEY = Deno.env.get("ENGAGELO_API_KEY");
// Initialize admin client to fetch all users
const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("Starting Weekly Report Notification Run...");

        // 1. Fetch all users
        // In a real app, maybe only 'active' users
        const { data: users, error } = await supabaseAdmin
            .from('profiles')
            .select('user_id, full_name, phone')
            .not('phone', 'is', null);

        if (error) throw error;
        
        console.log(`Found ${users?.length || 0} users to notify.`);

        const results = [];

        // 2. Iterate and Send
        for (const user of users || []) {
            if (!user.phone) continue;
            
            // 3. Fetch User's Data for the week
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const startDateStr = oneWeekAgo.toISOString().split('T')[0];
            const endDateStr = now.toISOString().split('T')[0];

            const [habitsResult, businessResult, learningResult] = await Promise.all([
                supabaseAdmin.from('daily_habits').select('*').eq('user_id', user.user_id).gte('log_date', startDateStr),
                supabaseAdmin.from('daily_business_logs').select('*').eq('user_id', user.user_id).gte('log_date', startDateStr),
                supabaseAdmin.from('daily_learning').select('*').eq('user_id', user.user_id).gte('log_date', startDateStr)
            ]);

            const habits = habitsResult.data || [];
            const business = businessResult.data || [];
            const learning = learningResult.data || [];

            // 4. Generate AI Report using Gemini
            const context = `
                User: ${user.full_name}
                Period: Weekly (${startDateStr} to ${endDateStr})
                Habits Logged: ${habits.length}/7 days.
                Business: Revenue: ${business.reduce((acc: number, curr: any) => acc + Number(curr.revenue), 0)}, Profit: ${business.reduce((acc: number, curr: any) => acc + Number(curr.gross_profit), 0)}.
                Learning Log Count: ${learning.length}.
                Recent Learning: ${learning.map((l: any) => l.learning_point).slice(0, 3).join('; ')}
            `;

            let aiSummary = "Keep going!";
            let aiActions = "Track more consistently.";

            try {
                const API_KEY = Deno.env.get('GEMINI_API_KEY');
                if (API_KEY) {
                    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            system_instruction: {
                                parts: [{ text: "You are a business coach. Analyze the weekly data. Output a JSON object with keys: 'summary' (2 sentences max, encouraging) and 'actions' (3 bullet points, plain text). Do not use Markdown formatting in the JSON values." }]
                            },
                            contents: [{ role: 'user', parts: [{ text: context }] }]
                        }),
                    });

                    if (aiResponse.ok) {
                        const aiData = await aiResponse.json();
                        const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
                        // Attempt to parse JSON
                        try {
                             // Clean markdown code blocks if present
                            const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                            const parsed = JSON.parse(cleanedText);
                            aiSummary = parsed.summary || aiSummary;
                            aiActions = Array.isArray(parsed.actions) ? parsed.actions.join('\n') : (parsed.actions || aiActions);
                        } catch (e) {
                            console.error("Failed to parse AI JSON", e);
                            aiSummary = rawText || aiSummary; // Fallback to raw text
                        }
                    }
                }
            } catch (aiError) {
                console.error("AI Generation Error", aiError);
            }

            // 5. Save Report to DB
            const { error: dbError } = await supabaseAdmin
                .from('ai_reports')
                .insert({
                    user_id: user.user_id,
                    report_period: 'weekly',
                    start_date: startDateStr,
                    end_date: endDateStr,
                    results_report: aiSummary,
                    actions_report: aiActions,
                    performance_rating: habits.length > 5 ? 5 : (habits.length > 3 ? 3 : 1) // Simple logic
                });

            if (dbError) console.error("Failed to save report", dbError);
            
            // 6. Send WhatsApp Notification
            // Construct GET URL for Template API
            const url = new URL("https://bot.engagelo.com/api/v1/whatsapp/send/template");
            url.searchParams.append("apiToken", ENGAGELO_API_KEY || "");
            url.searchParams.append("phone_number_id", "900886739777976");
            url.searchParams.append("template_id", "REPLACE_WITH_WEEKLY_TEMPLATE_ID"); // Still pending ID
            url.searchParams.append("phone_number", user.phone);
            
            // Send request
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
