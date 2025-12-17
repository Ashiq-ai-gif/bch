import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, IndianRupee } from "lucide-react";
import { format } from "date-fns";

interface BusinessTrackerProps {
  date: string;
}

export const BusinessTracker = ({ date }: BusinessTrackerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [monthlyTarget, setMonthlyTarget] = useState(0); // Keep for display, but prediction logic removed from handleSave
  const [data, setData] = useState({
    revenue: "",
    gross_profit: "",
    ai_prediction: "",
  });

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    if (!user) return;

    // Reset data when date changes
    setData({
      revenue: "",
      gross_profit: "",
      ai_prediction: "",
    });

    const fetchData = async () => {
      // Fetch monthly target (still needed for display)
      const { data: targetData } = await supabase
        .from("monthly_targets")
        .select("target_revenue")
        .eq("user_id", user.id)
        .eq("year", currentYear)
        .eq("month", currentMonth)
        .maybeSingle();

      if (targetData) {
        setMonthlyTarget(Number(targetData.target_revenue));
      } else {
        setMonthlyTarget(0); // Reset if no target found for the current month
      }

      // Fetch data for the given date
      const { data: log } = await supabase
        .from("daily_business_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", date)
        .maybeSingle();

      if (log) {
        setData({
          revenue: log.revenue.toString(),
          gross_profit: log.gross_profit.toString(),
          ai_prediction: log.ai_prediction || "",
        });
      }
    };

    fetchData();
  }, [user, date, currentYear, currentMonth]); // Keep currentYear/Month for monthly target fetch

  const handleSave = async () => {
    if (!user || !data.revenue.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter revenue",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Get month-to-date revenue for prediction
    // Note: We use 'date' (the selected date) effectively as 'today' for the context of this entry
    const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const { data: monthData } = await supabase
      .from("daily_business_logs")
      .select("revenue")
      .eq("user_id", user.id)
      .gte("log_date", startOfMonth)
      .lt("log_date", date);

    const monthToDateRevenue = monthData?.reduce((sum, item) => sum + Number(item.revenue), 0) || 0;
    const totalWithToday = monthToDateRevenue + parseFloat(data.revenue);

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const currentDay = parseInt(date.split('-')[2], 10);
    const projectedRevenue = (totalWithToday / currentDay) * daysInMonth;

    let prediction = "";
    if (monthlyTarget > 0) {
      const percentageOfTarget = (projectedRevenue / monthlyTarget) * 100;
      if (percentageOfTarget >= 100) {
        prediction = `On track to exceed target by ${(percentageOfTarget - 100).toFixed(1)}%! Projected: ₹${projectedRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
      } else {
        const remainingDays = Math.max(0, daysInMonth - currentDay);
        const dailyNeeded = remainingDays > 0 ? (monthlyTarget - totalWithToday) / remainingDays : 0;
        prediction = `Currently at ${percentageOfTarget.toFixed(1)}% of target. Need ₹${dailyNeeded.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day to hit goal.`;
      }
    }

    let aiSummary = "";
    try {
      const { data: summaryData, error: summaryError } = await supabase.functions.invoke('generate-daily-summary', {
        body: { category: 'business', data: { revenue: data.revenue, gross_profit: data.gross_profit || "0" } }
      });
      if (!summaryError && summaryData?.summary) {
        aiSummary = summaryData.summary;
      }
    } catch (e) {
      console.error("Failed to generate summary", e);
    }

    const { error } = await supabase
      .from("daily_business_logs")
      .upsert({
        user_id: user.id,
        log_date: date,
        revenue: parseFloat(data.revenue),
        gross_profit: parseFloat(data.gross_profit || "0"),
        ai_prediction: prediction,
        ai_summary: aiSummary, // Save summary
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

      // Background update of user persona
      supabase.functions.invoke('update-user-persona').catch(console.error);
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
                <p className="text-2xl font-bold">₹{monthlyTarget.toLocaleString('en-IN')}</p>
              </div>
              <IndianRupee className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="revenue">Today's Revenue / Turnover (₹) *</Label>
            <Input
              id="revenue"
              type="number"
              step="0.01"
              value={data.revenue}
              onChange={(e) => setData({ ...data, revenue: e.target.value })}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profit">Today's Gross Profit (₹)</Label>
            <Input
              id="profit"
              type="number"
              step="0.01"
              value={data.gross_profit}
              onChange={(e) => setData({ ...data, gross_profit: e.target.value })}
              placeholder="0"
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