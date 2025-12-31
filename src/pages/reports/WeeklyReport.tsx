import { useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval, isSameDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ChevronLeft, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MeshBackground } from "@/components/ui/mesh-background";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function WeeklyReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>("this-week");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    habitsCompleted: 0,
    learningCount: 0,
    revenueData: [] as number[],
    habitsData: [] as number[],
    labels: [] as string[],
    aiSummary: "",
    aiActions: ""
  });

  // Calculate week ranges
  const today = new Date();
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
  const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });

  useEffect(() => {
    if (!user) return;

    const fetchWeeklyData = async () => {
      setLoading(true);
      const startDate = selectedWeek === "this-week" ? thisWeekStart : lastWeekStart;
      const endDate = selectedWeek === "this-week" ? thisWeekEnd : lastWeekEnd;
      
      try {
        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = format(endDate, 'yyyy-MM-dd');

        // Fetch Business Logs
        const { data: businessLogs } = await supabase
          .from('daily_business_logs')
          .select('log_date, revenue, gross_profit')
          .eq('user_id', user.id)
          .gte('log_date', startStr)
          .lte('log_date', endStr);

        // Fetch Habit Logs (aggregate completion)
        // Note: Ideally we join with todo_items, but for summary we might just check if a log exists or complex join
        // For now, let's count "daily_habits" entries as separate days tracked
        const { data: habitLogs } = await supabase
          .from('daily_habits')
          .select('id, log_date')
          .eq('user_id', user.id)
          .gte('log_date', startStr)
          .lte('log_date', endStr);

        // Fetch Learning Logs
        const { data: learningLogs } = await supabase
            .from('daily_learning')
            .select('log_date')
            .eq('user_id', user.id)
            .gte('log_date', startStr)
            .lte('log_date', endStr);


        // Aggregation
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const labels = days.map(d => format(d, 'EEE')); // Mon, Tue...
        
        let totalRevenue = 0;
        let totalProfit = 0;
        const revenueData = days.map(day => {
            const log = businessLogs?.find(b => isSameDay(new Date(b.log_date), day));
            const rev = Number(log?.revenue || 0);
            totalRevenue += rev;
            totalProfit += Number(log?.gross_profit || 0);
            return rev;
        });

        const habitsData = days.map(day => {
            // Simply 1 if logged, 0 if not for simple tracking. 
            // Or we could fetch actual completed tasks count if we had deep query.
            // Let's assume 1 for "Day Tracked"
            return habitLogs?.some(h => isSameDay(new Date(h.log_date), day)) ? 1 : 0;
        });

        // Fetch AI Report
        const { data: aiReport } = await supabase
            .from('ai_reports')
            .select('*')
            .eq('user_id', user.id)
            .eq('report_period', 'weekly')
            .gte('start_date', startStr)
            .lte('end_date', endStr)
            .maybeSingle();

        setStats({
          totalRevenue,
          totalProfit,
          habitsCompleted: habitLogs?.length || 0,
          learningCount: learningLogs?.length || 0,
          revenueData,
          habitsData,
          labels,
          aiSummary: aiReport?.results_report || "No AI analysis available for this week yet.",
          aiActions: aiReport?.actions_report || "Complete your daily logs to get AI insights."
        });
      } catch (error) {
        console.error("Error loading weekly report", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
  }, [user, selectedWeek]);

  // ... (rest of code)

  return (
    <div className="min-h-screen bg-transparent text-white print:text-black print:bg-white">
      {/* ... Header ... */}
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {/* AI Insight Card */}
        <Card className="bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50 border-white/10 print:border-gray-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    ✨ AI Performance Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-semibold text-violet-300 mb-1">Summary</h3>
                    <p className="text-gray-200 text-sm leading-relaxed">{stats.aiSummary}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-fuchsia-300 mb-1">Recommended Actions</h3>
                    <div className="text-gray-200 text-sm whitespace-pre-line">{stats.aiActions}</div>
                </div>
            </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white/5 border-white/10 print:border-gray-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 print:border-gray-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Gross Profit</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-400">₹{stats.totalProfit.toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 print:border-gray-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Days Tracked</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.habitsCompleted}/7</div>
                </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 print:border-gray-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Learning Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.learningCount}</div>
                </CardContent>
            </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-white/5 border-white/10 print:bg-white print:text-black">
                <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <Line 
                        data={{
                            labels: stats.labels,
                            datasets: [{
                                label: 'Revenue',
                                data: stats.revenueData,
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                                tension: 0.4
                            }]
                        }}
                        options={{
                            responsive: true,
                            plugins: { legend: { display: false } },
                            scales: {
                                y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#9ca3af' } },
                                x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
                            }
                        }}
                    />
                </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 print:bg-white print:text-black">
                <CardHeader>
                    <CardTitle>Habit Consistency</CardTitle>
                </CardHeader>
                <CardContent>
                     <Bar 
                        data={{
                            labels: stats.labels,
                            datasets: [{
                                label: 'Tracked',
                                data: stats.habitsData,
                                backgroundColor: stats.habitsData.map(v => v ? '#22c55e' : '#374151'),
                                borderRadius: 4
                            }]
                        }}
                        options={{
                            responsive: true,
                            plugins: { legend: { display: false } },
                            scales: {
                                y: { display: false, max: 1.5 },
                                x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
                            }
                        }}
                    />
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
