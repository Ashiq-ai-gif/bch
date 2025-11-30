import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, subDays } from "date-fns";
import { TrendingUp } from "lucide-react";

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
        .maybeSingle();

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

      if (salesData && salesData.length > 0) {
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

  const dailyBaseline = baseline / 30;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Sales Velocity
        </CardTitle>
        <CardDescription>
          {data.length > 0 
            ? `Current performance vs pre-program baseline (₹${dailyBaseline.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day)`
            : "Start logging your daily revenue to see your sales velocity"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis 
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                className="text-xs"
              />
              <Tooltip 
                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <ReferenceLine
                y={dailyBaseline}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                label={{ value: "Baseline", position: "right", fill: "hsl(var(--muted-foreground))" }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Daily Revenue"
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">No sales data yet</p>
            <p className="text-sm text-center">Log your daily revenue in the Daily Input section to see your growth chart</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
