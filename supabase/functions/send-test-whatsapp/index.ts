import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from '../_shared/cors.ts'

const ENGAGELO_API_KEY = Deno.env.get("ENGAGELO_API_KEY");

Deno.serve(async (req: Request) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { phone } = await req.json();

        if (!phone) {
            throw new Error("Phone is required");
        }

        console.log(`Sending test whatsapp template to ${phone}`);

        const PHONE_NUMBER_ID = "900886739777976";
        const TEMPLATE_ID = "290165";
        
        // Construct GET URL with query params
        const url = new URL("https://bot.engagelo.com/api/v1/whatsapp/send/template");
        url.searchParams.append("apiToken", ENGAGELO_API_KEY || "");
        url.searchParams.append("phone_number_id", PHONE_NUMBER_ID);
        url.searchParams.append("template_id", TEMPLATE_ID);
        url.searchParams.append("phone_number", phone);

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
            console.error(`Engagelo API Error:`, resultText);
             return new Response(JSON.stringify({ error: resultText }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        return new Response(
            JSON.stringify({ success: true, result: resultJson }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        )
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        })
    }
})
