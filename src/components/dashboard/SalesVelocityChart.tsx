import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, subDays } from "date-fns";

interface SalesData {
  date: string;
  revenue: number;
  baseline: number;
}

export const SalesVelocityChart = () => {
  const { user } = useAuth();
  const [data, setData] = useState<SalesData[]>([]);
  const [baseline, setBaseline] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch baseline
      const { data: goalsData } = await supabase
        .from("financial_goals")
        .select("baseline_monthly_revenue")
        .eq("user_id", user.id)
        .single();

      const baselineValue = goalsData?.baseline_monthly_revenue || 0;
      setBaseline(Number(baselineValue));

      // Fetch last 30 days of sales data
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const { data: salesData } = await supabase
        .from("daily_business_logs")
        .select("log_date, revenue")
        .eq("user_id", user.id)
        .gte("log_date", thirtyDaysAgo)
        .order("log_date", { ascending: true });

      if (salesData) {
        const chartData = salesData.map((item) => ({
          date: format(new Date(item.log_date), "MMM dd"),
          revenue: Number(item.revenue),
          baseline: Number(baselineValue / 30), // Daily baseline
        }));
        setData(chartData);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Velocity</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Velocity</CardTitle>
        <CardDescription>
          Current performance vs pre-program baseline (${(baseline / 30).toFixed(2)}/day)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Legend />
            <ReferenceLine
              y={baseline / 30}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              label="Baseline"
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Daily Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};