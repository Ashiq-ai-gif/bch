import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesVelocityChart } from "@/components/dashboard/SalesVelocityChart";
import { GoalProgressBar } from "@/components/dashboard/GoalProgressBar";
import { GrowthStreak } from "@/components/dashboard/GrowthStreak";
import { AIAnalysisPanel } from "@/components/dashboard/AIAnalysisPanel";
import { PlusCircle, BookOpen, CheckSquare, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasGoals, setHasGoals] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setProfile(data);

      const { data: goalsData } = await supabase
        .from("financial_goals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!goalsData && data?.organization_name) {
        navigate("/onboarding");
        return;
      }

      setHasGoals(!!goalsData);
      setLoading(false);
    };

    fetchProfile();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {profile?.full_name}!</h1>
              <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/daily-input")}>
                <PlusCircle className="w-4 h-4 mr-2" />Daily Input
              </Button>
              <Button variant="ghost" onClick={signOut}>Sign Out</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {!hasGoals ? (
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Setup</CardTitle>
              <CardDescription>Set up your financial goals to unlock AI insights</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/onboarding")}>Complete Onboarding</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <GrowthStreak />
            <div className="grid md:grid-cols-2 gap-6">
              <SalesVelocityChart />
              <GoalProgressBar />
            </div>
            <AIAnalysisPanel />
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/daily-input?tab=learning")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5" />Today's Learning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Log what you learned and how you'll apply it</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/daily-input?tab=habits")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckSquare className="w-5 h-5" />Habits & Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Track your daily habits and complete tasks</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/daily-input?tab=business")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5" />Business Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Record today's revenue and business performance</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
