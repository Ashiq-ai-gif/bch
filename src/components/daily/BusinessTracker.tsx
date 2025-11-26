import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, DollarSign } from "lucide-react";
import { format } from "date-fns";

export const BusinessTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [monthlyTarget, setMonthlyTarget] = useState(0);
  const [data, setData] = useState({
    revenue: "",
    gross_profit: "",
    ai_prediction: "",
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch monthly target
      const { data: targetData } = await supabase
        .from("monthly_targets")
        .select("target_revenue")
        .eq("user_id", user.id)
        .eq("year", currentYear)
        .eq("month", currentMonth)
        .maybeSingle();

      if (targetData) {
        setMonthlyTarget(Number(targetData.target_revenue));
      }

      // Fetch today's data
      const { data: businessData } = await supabase
        .from("daily_business_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .maybeSingle();

      if (businessData) {
        setData({
          revenue: businessData.revenue.toString(),
          gross_profit: businessData.gross_profit.toString(),
          ai_prediction: businessData.ai_prediction || "",
        });
      }
    };

    fetchData();
  }, [user, today, currentYear, currentMonth]);

  const handleSave = async () => {
    if (!user || !data.revenue.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter today's revenue",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Get month-to-date revenue for prediction
    const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const { data: monthData } = await supabase
      .from("daily_business_logs")
      .select("revenue")
      .eq("user_id", user.id)
      .gte("log_date", startOfMonth)
      .lt("log_date", today);

    const monthToDateRevenue = monthData?.reduce((sum, item) => sum + Number(item.revenue), 0) || 0;
    const totalWithToday = monthToDateRevenue + parseFloat(data.revenue);
    
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const currentDay = new Date().getDate();
    const projectedRevenue = (totalWithToday / currentDay) * daysInMonth;

    let prediction = "";
    if (monthlyTarget > 0) {
      const percentageOfTarget = (projectedRevenue / monthlyTarget) * 100;
      if (percentageOfTarget >= 100) {
        prediction = `On track to exceed target by ${(percentageOfTarget - 100).toFixed(1)}%! Projected: $${projectedRevenue.toFixed(2)}`;
      } else {
        const dailyNeeded = (monthlyTarget - totalWithToday) / (daysInMonth - currentDay);
        prediction = `Currently at ${percentageOfTarget.toFixed(1)}% of target. Need $${dailyNeeded.toFixed(2)}/day to hit goal.`;
      }
    }

    const { error } = await supabase
      .from("daily_business_logs")
      .upsert({
        user_id: user.id,
        log_date: today,
        revenue: parseFloat(data.revenue),
        gross_profit: parseFloat(data.gross_profit || "0"),
        ai_prediction: prediction,
      }, {
        onConflict: "user_id,log_date",
      });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setData({ ...data, ai_prediction: prediction });
      toast({
        title: "Success",
        description: "Business metrics saved successfully",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Metrics</CardTitle>
          <CardDescription>Track your daily revenue and performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Target</p>
                <p className="text-2xl font-bold">${monthlyTarget.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="revenue">Today's Revenue / Turnover ($) *</Label>
            <Input
              id="revenue"
              type="number"
              step="0.01"
              value={data.revenue}
              onChange={(e) => setData({ ...data, revenue: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profit">Today's Gross Profit ($)</Label>
            <Input
              id="profit"
              type="number"
              step="0.01"
              value={data.gross_profit}
              onChange={(e) => setData({ ...data, gross_profit: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Business Metrics"}
          </Button>

          {data.ai_prediction && (
            <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm mb-1">AI Business Predictor</p>
                  <p className="text-sm">{data.ai_prediction}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};