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

    // Verify admin user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin using the has_role function
    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'Target user ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to fetch all user data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    // Fetch financial goals
    const { data: goals } = await supabaseAdmin
      .from('financial_goals')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    // Fetch all daily habits (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: habits } = await supabaseAdmin
      .from('daily_habits')
      .select('*')
      .eq('user_id', targetUserId)
      .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('log_date', { ascending: false });

    // Fetch all daily learning
    const { data: learning } = await supabaseAdmin
      .from('daily_learning')
      .select('*')
      .eq('user_id', targetUserId)
      .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('log_date', { ascending: false });

    // Fetch business logs
    const { data: businessLogs } = await supabaseAdmin
      .from('daily_business_logs')
      .select('*')
      .eq('user_id', targetUserId)
      .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('log_date', { ascending: false });

    // Fetch achievements
    const { data: achievements } = await supabaseAdmin
      .from('achievements')
      .select('*')
      .eq('user_id', targetUserId);

    // Calculate metrics
    const totalRevenue = businessLogs?.reduce((sum, log) => sum + Number(log.revenue), 0) || 0;
    const totalProfit = businessLogs?.reduce((sum, log) => sum + Number(log.gross_profit), 0) || 0;
    const daysLogged = habits?.length || 0;
    const learningEntries = learning?.length || 0;

    // Build context for AI
    const contextSummary = `
USER PROFILE:
- Name: ${profile?.full_name || 'Not set'}
- Organization: ${profile?.organization_name || 'Not set'}
- Program: ${profile?.enrolled_program || 'Not set'}
- Location: ${profile?.location || 'Not set'}

FINANCIAL GOALS:
- Baseline Monthly Revenue: ₹${goals?.baseline_monthly_revenue?.toLocaleString('en-IN') || 0}
- Year 1 Target: ₹${goals?.year_1_target?.toLocaleString('en-IN') || 0}
- 5 Year Target: ₹${goals?.five_year_target?.toLocaleString('en-IN') || 0}

LAST 30 DAYS PERFORMANCE:
- Days with data logged: ${daysLogged}
- Learning entries: ${learningEntries}
- Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}
- Total Gross Profit: ₹${totalProfit.toLocaleString('en-IN')}
- Achievements earned: ${achievements?.length || 0}

RECENT HABITS DATA:
${habits?.slice(0, 5).map(h => `- ${h.log_date}: Wake ${h.wake_up_time || 'N/A'}, Action: ${h.most_important_action || 'N/A'}`).join('\n') || 'No habit data'}

RECENT LEARNING:
${learning?.slice(0, 5).map(l => `- ${l.log_date}: ${l.learning_point?.substring(0, 100) || 'N/A'}`).join('\n') || 'No learning data'}

RECENT BUSINESS:
${businessLogs?.slice(0, 5).map(b => `- ${b.log_date}: Revenue ₹${Number(b.revenue).toLocaleString('en-IN')}, Profit ₹${Number(b.gross_profit).toLocaleString('en-IN')}`).join('\n') || 'No business data'}
`;

    // Call Lovable AI for executive summary
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an executive business analyst providing summaries for program administrators. Your job is to give a concise, actionable executive summary of a user's performance and engagement. Be direct and professional. Focus on:
1. Overall engagement level (high/medium/low)
2. Key strengths observed
3. Areas of concern
4. Recommended admin action (if any)

Keep the summary to 3-4 paragraphs maximum. Use specific numbers from the data provided.`
          },
          {
            role: 'user',
            content: `Generate an executive summary for this user:\n\n${contextSummary}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      return new Response(JSON.stringify({
        summary: `Unable to generate AI summary. Manual review needed.\n\nQuick Stats:\n- Days logged: ${daysLogged}\n- Revenue (30d): ₹${totalRevenue.toLocaleString('en-IN')}\n- Profit (30d): ₹${totalProfit.toLocaleString('en-IN')}`,
        metrics: { daysLogged, totalRevenue, totalProfit, learningEntries }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || 'Unable to generate summary';

    return new Response(JSON.stringify({
      summary,
      metrics: {
        daysLogged,
        totalRevenue,
        totalProfit,
        learningEntries,
        achievementsCount: achievements?.length || 0
      },
      profile,
      goals
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in admin-user-summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
