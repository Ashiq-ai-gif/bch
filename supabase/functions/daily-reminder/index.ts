import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts'

// Configuration
const ENGAGELO_API_KEY = Deno.env.get("ENGAGELO_API_KEY");

Deno.serve(async (req: Request) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Initialize admin client to fetch all users
        // Note: We use SUPABASE_SERVICE_ROLE_KEY to bypass RLS
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Get current time in IST
        const now = new Date();
        // Convert to IST (UTC+5:30)
        // IST Offset is 19800000 ms
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        const currentDateStr = istTime.toISOString().split('T')[0]; // YYYY-MM-DD

        console.log(`Running Daily Reminder Check. IST Time: ${istTime.toISOString()}, Date: ${currentDateStr}`);

        // 3. Fetch all profiles with valid phone numbers
        // Types are 'any' here as we don't have the generated types imported, 
        // but the query is simple enough.
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('user_id, full_name, phone')
            .not('phone', 'is', null);

        if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            throw profilesError;
        }

        // 4. Fetch who has submitted TODAY
        const { data: submissions, error: submissionsError } = await supabaseAdmin
            .from('daily_habits')
            .select('user_id')
            .eq('log_date', currentDateStr);

        if (submissionsError) {
            console.error("Error fetching submissions:", submissionsError);
            throw submissionsError;
        }

        const submittedUserIds = new Set(submissions?.map((s: any) => s.user_id) || []);

        // 5. Identify missing users
        const missingUsers = profiles?.filter((p: any) => !submittedUserIds.has(p.user_id) && p.phone) || [];

        console.log(`Found ${missingUsers.length} users who haven't submitted today.`);

        const results = [];

        // 6. Send WhatsApp to missing users
        for (const user of missingUsers) {
            console.log(`Sending reminder to ${user.full_name} (${user.phone})...`);

            try {
                // Construct GET URL with query params
                const url = new URL("https://bot.engagelo.com/api/v1/whatsapp/send/template");
                url.searchParams.append("apiToken", ENGAGELO_API_KEY || "");
                url.searchParams.append("phone_number_id", "900886739777976");
                url.searchParams.append("template_id", "290165");
                url.searchParams.append("phone_number", user.phone);

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                let resultJson;
                const resultText = await response.text();
                try {
                    resultJson = JSON.parse(resultText);
                } catch (e) {
                    resultJson = { text: resultText };
                }

                if (!response.ok) {
                    console.error(`Engagelo API Error for ${user.full_name}:`, resultText);
                }

                results.push({
                    user: user.full_name,
                    status: response.status,
                    result: resultJson
                });

            } catch (err: any) {
                console.error(`Failed to send to ${user.full_name}:`, err);
                results.push({ user: user.full_name, error: err.message });
            }
        }

        return new Response(
            JSON.stringify({
                message: "Daily reminder check completed",
                date: currentDateStr,
                reminders_sent: results.length,
                details: results
            }),
            {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json"
                }
            },
        )
    } catch (error: any) {
        console.error("Error in daily-reminder function:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            },
            status: 500,
        })
    }
})
