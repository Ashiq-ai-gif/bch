import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesVelocityChart } from "@/components/dashboard/SalesVelocityChart";
import { GoalProgressBar } from "@/components/dashboard/GoalProgressBar";
import { GrowthStreak } from "@/components/dashboard/GrowthStreak";
import { AIAnalysisPanel } from "@/components/dashboard/AIAnalysisPanel";
import { PlusCircle, BookOpen, CheckSquare, TrendingUp, Shield } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface DashboardProps {
  userId?: string;
}

const Dashboard = ({ userId }: DashboardProps) => {
  const { user, signOut } = useAuth();
  const effectiveUserId = userId || user?.id; // Use passed userId or logged-in user
  const isViewMode = !!userId; // Flag to check if we are viewing as admin/another user
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasGoals, setHasGoals] = useState(false);
  const [todayStats, setTodayStats] = useState({
    learning: null as string | null,
    habits: { total: 0, completed: 0, exists: false, summary: null as string | null },
    business: { revenue: 0, profit: 0, logged: false, summary: null as string | null }
  });

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", effectiveUserId)
        .single();

      setProfile(data);

      const { data: goalsData } = await supabase
        .from("financial_goals")
        .select("id")
        .eq("user_id", effectiveUserId)
        .single();

      if (!goalsData && data?.organization_name && !isViewMode) {
        navigate("/onboarding");
        return;
      }

      setHasGoals(!!goalsData);
      setLoading(false);
    };

    const fetchTodayStats = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch Learning
      const { data: learningData } = await supabase
        .from("daily_learning")
        .select("learning_point")
        .eq("user_id", effectiveUserId)
        .eq("log_date", today)
        .maybeSingle();

      // Fetch Business
      const { data: businessData } = await supabase
        .from("daily_business_logs")
        .select("revenue, gross_profit, ai_summary")
        .eq("user_id", effectiveUserId)
        .eq("log_date", today)
        .maybeSingle();

      // Fetch Habits & Tasks
      const { data: habitData } = await supabase
        .from("daily_habits")
        .select("id, ai_summary")
        .eq("user_id", effectiveUserId)
        .eq("log_date", today)
        .maybeSingle();

      let habitsStats = { total: 0, completed: 0, exists: false };

      if (habitData) {
        const { data: todos } = await supabase
          .from("todo_items")
          .select("completed")
          .eq("daily_habit_id", habitData.id);

        if (todos) {
          habitsStats = {
            total: todos.length,
            completed: todos.filter(t => t.completed).length,
            exists: true
          };
        } else {
          habitsStats.exists = true;
        }
      }

      setTodayStats({
        learning: learningData?.learning_point || null,
        habits: { ...habitsStats, summary: habitData?.ai_summary || null },
        business: {
          revenue: Number(businessData?.revenue) || 0,
          profit: Number(businessData?.gross_profit) || 0,
          logged: !!businessData,
          summary: businessData?.ai_summary || null
        }
      });
    };

    fetchProfile();
    fetchTodayStats();
  }, [user, navigate, effectiveUserId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // Import motion
  // NOTE: You need to add 'import { motion } from "framer-motion";' at the top of the file

  return (
    <div className="min-h-screen bg-transparent">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                Welcome back, {profile?.full_name}!
              </h1>
              <p className="text-sm text-gray-400">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            </div>
            {!isViewMode && (
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                {isAdmin && (
                  <Button variant="outline" onClick={() => navigate("/admin")} className="glass-card-hover border-white/10 shrink-0">
                    <Shield className="w-4 h-4 mr-2" />Admin
                  </Button>
                )}
                <Button variant="default" onClick={() => navigate("/daily-input")} className="btn-gradient shrink-0">
                  <PlusCircle className="w-4 h-4 mr-2" />Daily Input
                </Button>
                <Button variant="ghost" onClick={signOut} className="hover:bg-white/10 shrink-0">Sign Out</Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {!hasGoals ? (
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle>Complete Your Setup</CardTitle>
              <CardDescription>Set up your financial goals to unlock AI insights</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/onboarding")} className="btn-gradient">Complete Onboarding</Button>
            </CardContent>
          </Card>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants}>
              <GrowthStreak userId={effectiveUserId} />
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <SalesVelocityChart userId={effectiveUserId} />
              </motion.div>
              <motion.div variants={itemVariants}>
                <GoalProgressBar userId={effectiveUserId} />
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <AIAnalysisPanel userId={effectiveUserId} />
            </motion.div>

            <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-4">
              <Card className="glass-card glass-card-hover cursor-pointer border-l-4 border-l-blue-500" onClick={() => !isViewMode && navigate("/daily-input?tab=learning")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5 text-blue-400" />Today's Learning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {todayStats.learning ? (
                      <span className="text-foreground">{todayStats.learning}</span>
                    ) : (
                      "Log what you learned and how you'll apply it"
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card glass-card-hover cursor-pointer border-l-4 border-l-purple-500" onClick={() => !isViewMode && navigate("/daily-input?tab=habits")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckSquare className="w-5 h-5 text-purple-400" />Habits & Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {todayStats.habits.exists ? (
                      <span className="flex flex-col gap-1">
                        {todayStats.habits.summary ? (
                          <span className="text-foreground italic">"{todayStats.habits.summary}"</span>
                        ) : (
                          <span className="text-foreground font-medium">
                            {todayStats.habits.completed}/{todayStats.habits.total} tasks completed
                          </span>
                        )}
                      </span>
                    ) : (
                      "Track your daily habits and complete tasks"
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card glass-card-hover cursor-pointer border-l-4 border-l-pink-500" onClick={() => !isViewMode && navigate("/daily-input?tab=business")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-pink-400" />Business Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {todayStats.business.logged ? (
                      <span className="flex flex-col gap-1">
                        <span className="text-foreground font-medium">Rev: {formatCurrency(todayStats.business.revenue)}</span>
                        {todayStats.business.summary ? (
                          <span className="text-xs text-foreground italic mt-1">"{todayStats.business.summary}"</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Profit: {formatCurrency(todayStats.business.profit)}</span>
                        )}
                      </span>
                    ) : (
                      "Record today's revenue and business performance"
                    )}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
