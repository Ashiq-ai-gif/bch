import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, isSameDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ChevronLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function MonthlyReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("this-month");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    habitsCompleted: 0,
    learningCount: 0,
    revenueData: [] as number[],
    labels: [] as string[],
    aiSummary: "",
    aiActions: ""
  });

  // Calculate month ranges
  const today = new Date();
  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchMonthlyData = async () => {
      setLoading(true);
      setError(null);
      const startDate = selectedMonth === "this-month" ? thisMonthStart : lastMonthStart;
      const endDate = selectedMonth === "this-month" ? thisMonthEnd : lastMonthEnd;
      
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

        // Fetch Habit Logs
        const { data: habitLogs } = await supabase
          .from('daily_habits')
          .select('id, log_date')
          .eq('user_id', user.id)
          .gte('log_date', startStr)
          .lte('log_date', endStr);

        const { data: learningLogs } = await supabase
            .from('daily_learning')
            .select('log_date')
            .eq('user_id', user.id)
            .gte('log_date', startStr)
            .lte('log_date', endStr);


        // Aggregation: For month, day-by-day might be too dense for labels, but okay for a sparkline
        // Let's do day-by-day
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const labels = days.map(d => format(d, 'd')); // 1, 2, 3...
        
        let totalRevenue = 0;
        let totalProfit = 0;
        const revenueData = days.map(day => {
            const log = businessLogs?.find(b => isSameDay(new Date(b.log_date), day));
            const rev = Number(log?.revenue || 0);
            totalRevenue += rev;
            totalProfit += Number(log?.gross_profit || 0);
            return rev;
        });

        // Fetch AI Report
        const { data: aiReport } = await supabase
            .from('ai_reports')
            .select('*')
            .eq('user_id', user.id)
            .eq('report_period', 'monthly')
            .gte('start_date', startStr)
            .lte('end_date', endStr)
            .maybeSingle();

        setStats({
          totalRevenue,
          totalProfit,
          habitsCompleted: habitLogs?.length || 0,
          learningCount: learningLogs?.length || 0,
          revenueData,
          labels,
          aiSummary: aiReport?.results_report || "No AI analysis available for this month yet.",
          aiActions: aiReport?.actions_report || "Complete your daily business logs to unlock insights."
        });

      } catch (err) {
        console.error("Error loading monthly report", err);
        setError("Failed to load report data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [user, selectedMonth]);

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center text-white">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
       </div>
     );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white print:text-black print:bg-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ChevronLeft className="w-5 h-5" />
             </Button>
             <div>
                <h1 className="text-xl font-bold">Monthly Performance Report</h1>
                <p className="text-sm text-gray-400">
                    {format(selectedMonth === "this-month" ? thisMonthStart : lastMonthStart, "MMMM yyyy")}
                </p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                    <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleDownload} className="border-white/10 hover:bg-white/10">
                <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {/* AI Insight Card */}
        <Card className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-white/10 print:border-gray-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    ✨ AI Business Strategy
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-semibold text-blue-300 mb-1">Performance Summary</h3>
                    <p className="text-gray-200 text-sm leading-relaxed">{stats.aiSummary}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-indigo-300 mb-1">Strategic Actions</h3>
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
                    <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        ₹{stats.totalRevenue.toLocaleString()}
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 print:border-gray-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Gross Profit</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-green-400">₹{stats.totalProfit.toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 print:border-gray-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Habits Tracked</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{stats.habitsCompleted} <span className="text-sm text-gray-500 font-normal">days</span></div>
                </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 print:border-gray-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Insights Logged</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{stats.learningCount}</div>
                </CardContent>
            </Card>
        </div>

        {/* Big Chart */}
        <Card className="bg-white/5 border-white/10 print:bg-white print:text-black">
            <CardHeader>
                <CardTitle>Monthly Revenue Growth</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
                <Line 
                    data={{
                        labels: stats.labels,
                        datasets: [{
                            label: 'Revenue',
                            data: stats.revenueData,
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }]
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { 
                                grid: { color: 'rgba(255,255,255,0.05)' }, 
                                ticks: { color: '#9ca3af', callback: (val) => `₹${val}` } 
                            },
                            x: { 
                                grid: { display: false }, 
                                ticks: { color: '#9ca3af' } 
                            }
                        }
                    }}
                />
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
