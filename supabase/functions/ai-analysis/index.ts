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

    const { timeline } = await req.json();
    
    // Calculate date ranges based on timeline
    const now = new Date();
    let startDate: Date;
    
    switch (timeline) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = now.toISOString().split('T')[0];

    // Fetch all user data in parallel
    const [habitsResult, learningResult, businessResult, goalsResult, profileResult, achievementsResult] = await Promise.all([
      supabaseClient
        .from('daily_habits')
        .select('*')
        .eq('user_id', user.id)
        .gte('log_date', startDateStr)
        .order('log_date', { ascending: false }),
      supabaseClient
        .from('daily_learning')
        .select('*')
        .eq('user_id', user.id)
        .gte('log_date', startDateStr)
        .order('log_date', { ascending: false }),
      supabaseClient
        .from('daily_business_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('log_date', startDateStr)
        .order('log_date', { ascending: false }),
      supabaseClient
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabaseClient
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(5)
    ]);

    const habits = habitsResult.data || [];
    const learnings = learningResult.data || [];
    const businessLogs = businessResult.data || [];
    const goals = goalsResult.data;
    const profile = profileResult.data;
    const achievements = achievementsResult.data || [];

    // Check if we have enough data
    const hasData = habits.length > 0 || learnings.length > 0 || businessLogs.length > 0;
    
    if (!hasData) {
      return new Response(JSON.stringify({
        habitReport: "No habit data recorded yet. Start logging your daily habits to receive personalized analysis.",
        learningReport: "No learning entries found. Record what you learn each day to get AI-powered insights.",
        actionsReport: "No actions logged yet. Track your daily activities to receive performance analysis.",
        resultsReport: "No business metrics recorded. Log your daily revenue to see financial insights.",
        performanceRating: 0,
        suggestions: [
          "Start by logging today's habits and wake-up time",
          "Record your daily learning and implementation plans",
          "Track your business revenue to establish a baseline"
        ],
        achievements: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare context for AI
    const totalRevenue = businessLogs.reduce((sum, log) => sum + Number(log.revenue || 0), 0);
    const avgDailyRevenue = businessLogs.length > 0 ? totalRevenue / businessLogs.length : 0;
    const totalProfit = businessLogs.reduce((sum, log) => sum + Number(log.gross_profit || 0), 0);
    
    const habitCompletionDays = habits.filter(h => h.most_important_action).length;
    const habitCompletionRate = habits.length > 0 ? (habitCompletionDays / habits.length) * 100 : 0;
    
    const learningImplementations = learnings.filter(l => l.implementation_plan).length;
    const learningRate = learnings.length > 0 ? (learningImplementations / learnings.length) * 100 : 0;

    const contextSummary = `
User Profile: ${profile?.full_name || 'User'}, ${profile?.organization_name || 'Business Owner'}
Program: ${profile?.enrolled_program || 'Not specified'}
Timeline: ${timeline} (${startDateStr} to ${endDateStr})

HABIT DATA (${habits.length} entries):
${habits.slice(0, 5).map(h => `- Date: ${h.log_date}, Wake: ${h.wake_up_time || 'N/A'}, Action: ${h.most_important_action || 'None'}, Well: ${h.what_went_well || 'N/A'}, Wrong: ${h.what_went_wrong || 'N/A'}`).join('\n')}

LEARNING DATA (${learnings.length} entries):
${learnings.slice(0, 5).map(l => `- Date: ${l.log_date}, Learning: ${l.learning_point?.substring(0, 100) || 'N/A'}, Implementation: ${l.implementation_plan?.substring(0, 100) || 'N/A'}`).join('\n')}

BUSINESS DATA (${businessLogs.length} entries):
- Total Revenue: ₹${totalRevenue.toFixed(2)}
- Average Daily Revenue: ₹${avgDailyRevenue.toFixed(2)}
- Total Gross Profit: ₹${totalProfit.toFixed(2)}
${businessLogs.slice(0, 5).map(b => `- Date: ${b.log_date}, Revenue: ₹${b.revenue}, Profit: ₹${b.gross_profit}`).join('\n')}

GOALS:
${goals ? `- Year 1 Target: ₹${goals.year_1_target}, 5-Year Target: ₹${goals.five_year_target}, Baseline: ₹${goals.baseline_monthly_revenue}/month` : 'No goals set'}

METRICS:
- Habit Completion Rate: ${habitCompletionRate.toFixed(0)}%
- Learning Implementation Rate: ${learningRate.toFixed(0)}%
- Days with data: ${Math.max(habits.length, learnings.length, businessLogs.length)}
`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

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
            content: `You are a strict but encouraging business growth coach. Analyze the user's ACTUAL data and provide personalized feedback. Be specific, reference their actual numbers and entries. Never make up data - only analyze what's provided.

You must respond with a valid JSON object with these exact fields:
{
  "habitReport": "2-3 sentences analyzing their habit consistency based on actual entries",
  "learningReport": "2-3 sentences about their learning patterns and implementation",
  "actionsReport": "2-3 sentences about key actions they've taken",
  "resultsReport": "2-3 sentences about their financial performance vs goals",
  "performanceRating": number from 1-5 based on overall discipline,
  "suggestions": ["3 specific actionable suggestions based on their data"]
}

Be direct, data-driven, and actionable. Reference specific dates, numbers, or entries when possible.`
          },
          {
            role: 'user',
            content: `Analyze this ${timeline} data and provide a growth report:\n\n${contextSummary}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No AI response content');
    }

    // Parse AI response - handle markdown code blocks
    let parsedAnalysis;
    try {
      let jsonStr = aiContent;
      // Remove markdown code blocks if present
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      parsedAnalysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      // Fallback response based on actual data
      parsedAnalysis = {
        habitReport: `You've logged ${habits.length} habit entries with ${habitCompletionRate.toFixed(0)}% completion rate.`,
        learningReport: `You've recorded ${learnings.length} learning points with ${learningRate.toFixed(0)}% having implementation plans.`,
        actionsReport: `Your most recent action: ${habits[0]?.most_important_action || 'None recorded yet'}`,
        resultsReport: `Total revenue this period: ₹${totalRevenue.toFixed(2)}, averaging ₹${avgDailyRevenue.toFixed(2)}/day.`,
        performanceRating: Math.min(5, Math.ceil((habitCompletionRate + learningRate) / 40)),
        suggestions: [
          habits.length < 3 ? "Log your habits more consistently" : "Maintain your habit logging streak",
          learningRate < 50 ? "Focus on creating implementation plans for your learnings" : "Great job on implementing your learnings",
          businessLogs.length < 3 ? "Track your daily revenue consistently" : "Keep up the revenue tracking"
        ]
      };
    }

    // Format achievements
    const formattedAchievements = achievements.map(a => ({
      name: a.badge_name,
      description: a.badge_description
    }));

    return new Response(JSON.stringify({
      ...parsedAnalysis,
      achievements: formattedAchievements,
      dataPoints: {
        habits: habits.length,
        learnings: learnings.length,
        businessLogs: businessLogs.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-analysis function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
