import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Target } from "lucide-react";

type TimelinePeriod = "month" | "year" | "2year" | "3year" | "4year" | "5year";

export const GoalProgressBar = ({ userId }: { userId?: string }) => {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;
  const [period, setPeriod] = useState<TimelinePeriod>("month");
  const [target, setTarget] = useState(0);
  const [actual, setActual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasGoals, setHasGoals] = useState(false);

  useEffect(() => {
    if (!effectiveUserId) return;

    const fetchProgress = async () => {
      setLoading(true);

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Fetch financial goals
      const { data: goalsData } = await supabase
        .from("financial_goals")
        .select("*")
        .eq("user_id", effectiveUserId)
        .maybeSingle();

      if (!goalsData) {
        setHasGoals(false);
        setLoading(false);
        return;
      }

      setHasGoals(true);
      let targetAmount = 0;

      // Determine target based on selected period
      switch (period) {
        case "month":
          const { data: monthlyData } = await supabase
            .from("monthly_targets")
            .select("target_revenue")
            .eq("user_id", effectiveUserId)
            .eq("year", currentYear)
            .eq("month", currentMonth)
            .maybeSingle();
          targetAmount = Number(monthlyData?.target_revenue || 0);
          break;
        case "year":
          targetAmount = Number(goalsData.year_1_target);
          break;
        case "2year":
          targetAmount = Number(goalsData.year_2_target);
          break;
        case "3year":
          targetAmount = Number(goalsData.year_3_target);
          break;
        case "4year":
          targetAmount = Number(goalsData.year_4_target);
          break;
        case "5year":
          targetAmount = Number(goalsData.five_year_target);
          break;
      }

      setTarget(targetAmount);

      // Calculate actual revenue based on period
      let startDate: string;
      if (period === "month") {
        startDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
      } else {
        startDate = `${currentYear}-01-01`;
      }

      const { data: salesData } = await supabase
        .from("daily_business_logs")
        .select("revenue")
        .eq("user_id", effectiveUserId)
        .gte("log_date", startDate);

      const totalRevenue = salesData?.reduce((sum, item) => sum + Number(item.revenue), 0) || 0;
      setActual(totalRevenue);

      setLoading(false);
    };

    fetchProgress();
  }, [user, period]);

  const percentage = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const remaining = Math.max(target - actual, 0);

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Goal Progress
            </CardTitle>
            <CardDescription>Track your revenue targets</CardDescription>
          </div>
          <Select value={period} onValueChange={(value) => setPeriod(value as TimelinePeriod)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="2year">2-Year Plan</SelectItem>
              <SelectItem value="3year">3-Year Plan</SelectItem>
              <SelectItem value="4year">4-Year Plan</SelectItem>
              <SelectItem value="5year">5-Year Plan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : !hasGoals ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>No financial goals set yet</p>
            <p className="text-sm">Complete onboarding to set your revenue targets</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Current: {formatCurrency(actual)}</span>
                <span className="font-medium">Target: {formatCurrency(target)}</span>
              </div>
              <Progress value={percentage} className="h-4" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{percentage.toFixed(1)}% Complete</span>
                <span>{formatCurrency(remaining)} remaining</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
