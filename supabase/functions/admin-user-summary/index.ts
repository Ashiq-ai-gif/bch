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

    const { targetUserId, timeline = 'monthly', startDate: reqStartDate, endDate: reqEndDate } = await req.json();
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

    // Calculate date ranges based on timeline
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now; // Default to now

    switch (timeline) {
      case 'daily':
        if (reqStartDate) {
          startDate = new Date(reqStartDate);
          endDate = new Date(reqStartDate); // Ensure end date is same as start for daily query logic (usually handled by exact match or range inclusive)
        } else {
          startDate = now;
        }
        break;
      case 'custom':
        if (reqStartDate && reqEndDate) {
          startDate = new Date(reqStartDate);
          endDate = new Date(reqEndDate);
        } else {
          // Fallback to monthly if custom dates missing
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(2023, 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // For queries: if daily (start==end), usually strictly equals. 
    // But generalized 'gte start, lte end' works for day ranges too if precision is day.
    // If strict single day, start=end implies 1 day range.

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

    // Fetch all logs within range
    const [habitsResult, learningResult, businessResult, achievementsResult] = await Promise.all([
      supabaseAdmin
        .from('daily_habits')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('log_date', startDateStr)
        .lte('log_date', endDateStr)
        .order('log_date', { ascending: false }),
      supabaseAdmin
        .from('daily_learning')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('log_date', startDateStr)
        .lte('log_date', endDateStr)
        .order('log_date', { ascending: false }),
      supabaseAdmin
        .from('daily_business_logs')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('log_date', startDateStr)
        .lte('log_date', endDateStr)
        .order('log_date', { ascending: false }),
      supabaseAdmin
        .from('achievements')
        .select('*')
        .eq('user_id', targetUserId)
        // Achievements use 'earned_at' usually, check schema or assume simple timestamp check
        // If earned_at is timestamp w/ timezone, this date range check might need casting or simpler approach
        // For now, assuming standard date comparison or ignoring date filter if not applicable (but it usually is)
        // .gte('earned_at', startDateStr) 
        .order('earned_at', { ascending: false })
    ]);

    const habits = habitsResult.data || [];
    const learning = learningResult.data || [];
    const businessLogs = businessResult.data || [];
    const achievements = achievementsResult.data || [];

    // Calculate metrics
    const totalRevenue = businessLogs.reduce((sum, log) => sum + Number(log.revenue || 0), 0);
    const totalProfit = businessLogs.reduce((sum, log) => sum + Number(log.gross_profit || 0), 0);
    const avgDailyRevenue = businessLogs.length > 0 ? totalRevenue / businessLogs.length : 0;

    const habitCompletionDays = habits.filter(h => h.most_important_action).length;
    const habitCompletionRate = habits.length > 0 ? (habitCompletionDays / habits.length) * 100 : 0;

    const learningImplementations = learning.filter(l => l.implementation_plan).length;
    const learningRate = learning.length > 0 ? (learningImplementations / learning.length) * 100 : 0;

    // Build context for AI
    const contextSummary = `
USER PROFILE:
- Name: ${profile?.full_name || 'Not set'}
- Organization: ${profile?.organization_name || 'Not set'}
- Program: ${profile?.enrolled_program || 'Not set'}
- Timeline: ${timeline} (${startDateStr} to ${endDateStr})

FINANCIAL GOALS:
- Baseline Monthly Revenue: ₹${goals?.baseline_monthly_revenue?.toLocaleString('en-IN') || 0}
- Year 1 Target: ₹${goals?.year_1_target?.toLocaleString('en-IN') || 0}
- 5 Year Target: ₹${goals?.five_year_target?.toLocaleString('en-IN') || 0}

METRICS SUMMARY:
- Days with data logged: ${Math.max(habits.length, learning.length, businessLogs.length)}
- Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}
- Total Gross Profit: ₹${totalProfit.toLocaleString('en-IN')}
- Habit Completion Rate: ${habitCompletionRate.toFixed(0)}%
- Learning Implementation Rate: ${learningRate.toFixed(0)}%

RECENT HABITS DATA (Sample):
${habits.slice(0, 5).map(h => `- ${h.log_date}: Wake ${h.wake_up_time || 'N/A'}, Action: ${h.most_important_action || 'N/A'}`).join('\n') || 'No habit data'}

RECENT LEARNING (Sample):
${learning.slice(0, 5).map(l => `- ${l.log_date}: ${l.learning_point?.substring(0, 100) || 'N/A'}`).join('\n') || 'No learning data'}

RECENT BUSINESS (Sample):
${businessLogs.slice(0, 5).map(b => `- ${b.log_date}: Revenue ₹${Number(b.revenue).toLocaleString('en-IN')}, Profit ₹${Number(b.gross_profit).toLocaleString('en-IN')}`).join('\n') || 'No business data'}
`;

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
            text: `You are an executive business analyst providing summaries for program administrators. Analyze the user's ACTUAL data and provide personalized feedback.
            
You must respond with a valid JSON object with these exact fields:
{
  "summary": "High-level executive summary (3-4 sentences)",
  "habitReport": "Analysis of habit consistency",
  "learningReport": "Analysis of learning patterns",
  "actionsReport": "Analysis of actions taken",
  "resultsReport": "Analysis of financial performance vs goals",
  "performanceRating": number from 1-5,
  "suggestions": ["3 specific actionable suggestions"]
}

Be direct, data-driven, and actionable.`
          }
        },
        contents: [
          {
            role: 'user',
            parts: {
              text: `Generate an executive summary for this user:\n\n${contextSummary}`
            }
          }
        ],
        generationConfig: {
          response_mime_type: "application/json"
        }
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      // Fallback JSON
      return new Response(JSON.stringify({
        summary: "Unable to generate AI summary. Showing raw metrics only.",
        habitReport: "Data unavailable",
        learningReport: "Data unavailable",
        actionsReport: "Data unavailable",
        resultsReport: "Data unavailable",
        performanceRating: 0,
        suggestions: [],
        metrics: {
          daysLogged: habits.length,
          totalRevenue,
          totalProfit,
          learningEntries: learning.length,
          achievementsCount: achievements.length
        },
        profile,
        goals
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    let parsedAnalysis;
    try {
      if (!aiContent) throw new Error("No content in AI response");

      // Clean up markdown code blocks if present
      let cleanJson = aiContent.trim();
      const markdownMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        cleanJson = markdownMatch[1];
      }

      parsedAnalysis = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse AI JSON. Raw content:", aiContent, "Error:", e);
      parsedAnalysis = {
        summary: "AI generated a response but it wasn't in the expected format. Raw response: " + (aiContent || "None"),
        performanceRating: 0,
        suggestions: []
      };
    }

    return new Response(JSON.stringify({
      ...parsedAnalysis,
      metrics: {
        daysLogged: habits.length,
        totalRevenue,
        totalProfit,
        learningEntries: learning.length,
        achievementsCount: achievements.length
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
