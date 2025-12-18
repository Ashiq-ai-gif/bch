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

    const { timeline, targetUserId } = await req.json();

    let targetId = user.id;

    if (targetUserId && targetUserId !== user.id) {
      // Check if caller is admin
      const { data: hasRole } = await supabaseClient.rpc('has_role', {
        _role: 'admin',
        _user_id: user.id
      });

      if (hasRole) {
        targetId = targetUserId;
      } else {
        return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required for this action' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Fetch profile first to determine start date
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', targetId)
      .maybeSingle();

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

    // DATE CLAMPING: Don't look back further than when they joined
    const joinDate = new Date(profile?.created_at || new Date());
    // Reset time components for accurate date comparison
    joinDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    if (joinDate >= startDate) {
      startDate = joinDate;
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = now.toISOString().split('T')[0];

    // Calculate expected days (for consistency check)
    const msPerDay = 1000 * 60 * 60 * 24;
    let expectedDays = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / msPerDay) + 1);

    // Calculate User Tenure (Total Days Active)
    const daysActive = Math.max(1, Math.floor((now.getTime() - joinDate.getTime()) / msPerDay) + 1);

    // FORCE OVERRIDE for Day 1
    if (daysActive <= 1) {
      expectedDays = 1;
    }

    // Fetch all user data in parallel
    const [habitsResult, learningResult, businessResult, goalsResult, achievementsResult] = await Promise.all([
      supabaseClient
        .from('daily_habits')
        .select('*', { count: 'exact' })
        .eq('user_id', targetId)
        .gte('log_date', startDateStr)
        .order('log_date', { ascending: false })
        .limit(10), // Limit payload, use count for stats
      supabaseClient
        .from('daily_learning')
        .select('*', { count: 'exact' })
        .eq('user_id', targetId)
        .gte('log_date', startDateStr)
        .order('log_date', { ascending: false })
        .limit(10),
      supabaseClient
        .from('daily_business_logs')
        .select('log_date, revenue, gross_profit') // Specific columns for lightweight full fetch
        .eq('user_id', targetId)
        .gte('log_date', startDateStr)
        .order('log_date', { ascending: false }),
      supabaseClient
        .from('financial_goals')
        .select('*')
        .eq('user_id', targetId)
        .maybeSingle(),
      supabaseClient
        .from('achievements')
        .select('*')
        .eq('user_id', targetId)
        .order('earned_at', { ascending: false })
        .limit(5)
    ]);

    const habits = habitsResult.data || [];
    const habitsCount = habitsResult.count || habits.length;

    const learnings = learningResult.data || [];
    const learningsCount = learningResult.count || learnings.length;

    const businessLogs = businessResult.data || [];
    const goals = goalsResult.data;
    const achievements = achievementsResult.data || [];

    // Check if we have enough data (using counts now)
    const hasData = habitsCount > 0 || learningsCount > 0 || businessLogs.length > 0;

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

    // Use TOTAL count for rates, but DATA for AI context
    const habitCompletionRate = expectedDays > 0 ? (habitsCount / expectedDays) * 100 : 0;
    const learningRate = expectedDays > 0 ? (learningsCount / expectedDays) * 100 : 0;

    const contextSummary = `
User Profile: ${profile?.full_name || 'User'}, ${profile?.organization_name || 'Business Owner'}
Program: ${profile?.enrolled_program || 'Not specified'}
User Tenure: ${daysActive} days (Joined on ${profile?.created_at?.split('T')[0]})
Analysis Period: ${startDateStr} to ${endDateStr} (${expectedDays} days)

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
- Habit Completion Rate: ${habitCompletionRate.toFixed(0)}% (Based on ${expectedDays} expected days)
- Learning Implementation Rate: ${learningRate.toFixed(0)}%
`;

    // Call Google Gemini AI
    // Call Google Gemini AI
    // Use env var for security
    const API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!API_KEY) {
      throw new Error("GEMINI_API_KEY not set");
    }

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: `You are a business growth coach. Analyze the user's ACTUAL data and provide personalized feedback.

CRITICAL CONTEXT - DATA CONSISTENCY:
- This analysis ONLY covers ${expectedDays} days (${startDateStr} to ${endDateStr}).
- If expectedDays = 1, and the user has 1 entry, that is 100% PERFECT consistency. Do not suggest more is needed.
- If daysActive <= 3, you MUST praise their start. Do not mention "lack of details" or "inconsistency". It is Day 1.

CRITICAL CONTEXT - USER TENURE:
- The user has been active for ${daysActive} days.
- IF DAYS_ACTIVE <= 3: This is a BRAND NEW user. Your tone must be CELEBRATORY. 
  - "Great first entry!", "Excellent start!", "Welcome to the journey!"
  - IGNORE empty fields. Focusing on simply showing up is the goal for Day 1.
  - DO NOT say "lack of meaningful actions" or "limits insights".
- IF DAYS_ACTIVE > 14: Be stricter about consistency and gaps in data.

You must respond with a valid JSON object with these exact fields:
{
  "habitReport": "2-3 sentences. For Day 1/New Users: CELEBRATE showing up. For Veterans: Analyze consistency.",
  "learningReport": "2-3 sentences about their learning patterns and implementation",
  "actionsReport": "2-3 sentences about key actions they've taken",
  "resultsReport": "2-3 sentences about their financial performance vs goals",
  "performanceRating": number from 1-5 (GIVE 5 STARS for Day 1 users if they logged anything),
  "suggestions": ["3 specific actionable suggestions. For new users, suggest easy wins."]
}

Be direct, data-driven, and actionable. Reference specific dates, numbers, or entries when possible.`
            }
          ]
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Analyze this period (${expectedDays} days expected) and provide a growth report:\n\n${contextSummary}`
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json"
        }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      // Fallback response based on actual data
      return new Response(JSON.stringify({
        habitReport: `You've logged ${habitsCount} habit entries with ${habitCompletionRate.toFixed(0)}% completion rate.`,
        learningReport: `You've recorded ${learningsCount} learning points, aiming for ${learningRate.toFixed(0)}% consistency.`,
        actionsReport: `Your most recent action: ${habits[0]?.most_important_action || 'None recorded yet'}`,
        resultsReport: `Total revenue this period: ₹${totalRevenue.toFixed(2)}, averaging ₹${avgDailyRevenue.toFixed(2)}/day.`,
        performanceRating: Math.min(5, Math.ceil((habitCompletionRate + learningRate) / 40)),
        suggestions: [
          habitsCount < 3 ? "Log your habits more consistently" : "Maintain your habit logging streak",
          learningRate < 50 ? "Focus on creating implementation plans for your learnings" : "Great job on implementing your learnings",
          businessLogs.length < 3 ? "Track your daily revenue consistently" : "Keep up the revenue tracking"
        ],
        achievements: achievements.map(a => ({ name: a.badge_name, description: a.badge_description })),
        dataPoints: {
          habits: habitsCount,
          learnings: learningsCount,
          businessLogs: businessLogs.length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiContent) {
      throw new Error("No content in AI response");
    }

    // Parse AI response - handle markdown code blocks
    let parsedAnalysis;
    try {
      let jsonStr = aiContent.trim();
      // Remove markdown code blocks if present
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      parsedAnalysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent, parseError);
      // Construct fallback manually if parsing fails, or re-throw if critical
      // Using the same data-based fallback as above to ensure UI doesn't break
      parsedAnalysis = {
        habitReport: `You've logged ${habitsCount} habit entries with ${habitCompletionRate.toFixed(0)}% completion rate.`,
        learningReport: `You've recorded ${learningsCount} learning points, aiming for ${learningRate.toFixed(0)}% consistency.`,
        actionsReport: `Your most recent action: ${habits[0]?.most_important_action || 'None recorded yet'}`,
        resultsReport: `Total revenue this period: ₹${totalRevenue.toFixed(2)}, averaging ₹${avgDailyRevenue.toFixed(2)}/day.`,
        performanceRating: Math.min(5, Math.ceil((habitCompletionRate + learningRate) / 40)),
        suggestions: [
          habitsCount < 3 ? "Log your habits more consistently" : "Maintain your habit logging streak",
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
        habits: habitsCount,
        learnings: learningsCount,
        businessLogs: businessLogs.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-analysis function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      debug_key_len: Deno.env.get('GEMINI_API_KEY')?.length ?? 0,
      debug_key_start: Deno.env.get('GEMINI_API_KEY')?.substring(0, 5) ?? "NULL"
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
