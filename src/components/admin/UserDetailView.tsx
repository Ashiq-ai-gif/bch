import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, TrendingUp, Calendar, BookOpen, Target, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserDetailViewProps {
  userId: string;
}

interface Metrics {
  daysLogged: number;
  totalRevenue: number;
  totalProfit: number;
  learningEntries: number;
  achievementsCount: number;
}

interface Profile {
  full_name: string;
  organization_name: string | null;
  enrolled_program: string | null;
  location: string | null;
  phone: string | null;
  company_type: string | null;
}

interface Goals {
  baseline_monthly_revenue: number;
  year_1_target: number;
  year_2_target: number;
  year_3_target: number;
  year_4_target: number;
  five_year_target: number;
}

export function UserDetailView({ userId }: UserDetailViewProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string>('');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [timeline, setTimeline] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();

  const fetchUserSummary = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-summary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ targetUserId: userId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user summary');
      }

      const data = await response.json();
      setSummary(data.summary);
      setMetrics(data.metrics);
      setProfile(data.profile);
      setGoals(data.goals);
    } catch (error: any) {
      console.error('Error fetching user summary:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load user data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserSummary();
    }
  }, [userId]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatProgram = (program: string | null) => {
    if (!program) return 'Not enrolled';
    return program.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-auto">
      {/* User Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{profile?.full_name || 'Unknown User'}</h2>
          <p className="text-muted-foreground">{profile?.organization_name || 'No organization'}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">{formatProgram(profile?.enrolled_program)}</Badge>
            {profile?.location && <Badge variant="outline">{profile.location}</Badge>}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUserSummary}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Days Logged</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics?.daysLogged || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Revenue (30d)</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatCurrency(metrics?.totalRevenue || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Profit (30d)</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatCurrency(metrics?.totalProfit || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Learning</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics?.learningEntries || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Achievements</span>
            </div>
            <p className="text-2xl font-bold mt-1">{metrics?.achievementsCount || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            AI Executive Summary
          </CardTitle>
          <CardDescription>AI-generated analysis of user performance and engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {summary.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3">{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Goals */}
      {goals && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Goals</CardTitle>
            <CardDescription>User's defined growth targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Baseline Monthly</p>
                <p className="text-lg font-semibold">{formatCurrency(goals.baseline_monthly_revenue)}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Year 1 Target</p>
                <p className="text-lg font-semibold">{formatCurrency(goals.year_1_target)}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Year 2 Target</p>
                <p className="text-lg font-semibold">{formatCurrency(goals.year_2_target)}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Year 3 Target</p>
                <p className="text-lg font-semibold">{formatCurrency(goals.year_3_target)}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Year 4 Target</p>
                <p className="text-lg font-semibold">{formatCurrency(goals.year_4_target)}</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <p className="text-sm text-muted-foreground">5 Year Target</p>
                <p className="text-lg font-semibold text-primary">{formatCurrency(goals.five_year_target)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Tabs for Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Performance View</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={timeline} onValueChange={(v) => setTimeline(v as typeof timeline)}>
            <TabsList className="mb-4">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly">
              <p className="text-muted-foreground">Weekly performance data for this user will be displayed here based on their daily inputs.</p>
            </TabsContent>
            <TabsContent value="monthly">
              <p className="text-muted-foreground">Monthly performance data for this user will be displayed here based on their daily inputs.</p>
            </TabsContent>
            <TabsContent value="yearly">
              <p className="text-muted-foreground">Yearly performance data for this user will be displayed here based on their daily inputs.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
