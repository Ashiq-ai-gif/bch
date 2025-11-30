import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Star, TrendingUp, Lightbulb, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TimelineView = "weekly" | "monthly" | "yearly";

interface AnalysisData {
  habitReport: string;
  learningReport: string;
  actionsReport: string;
  resultsReport: string;
  performanceRating: number;
  suggestions: string[];
  achievements: { name: string; description: string }[];
  dataPoints?: {
    habits: number;
    learnings: number;
    businessLogs: number;
  };
}

export const AIAnalysisPanel = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [timeline, setTimeline] = useState<TimelineView>("weekly");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const fetchAnalysis = async () => {
    if (!user || !session) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ timeline }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analysis');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Failed to generate analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [user, session, timeline]);

  const handleRefresh = () => {
    fetchAnalysis();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Growth Analysis
            </CardTitle>
            <CardDescription>
              Personalized insights based on your actual data
              {analysis?.dataPoints && (
                <span className="ml-2 text-xs">
                  ({analysis.dataPoints.habits} habits, {analysis.dataPoints.learnings} learnings, {analysis.dataPoints.businessLogs} business logs)
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Tabs value={timeline} onValueChange={(v) => setTimeline(v as TimelineView)}>
              <TabsList>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Analyzing your data...</span>
          </div>
        ) : analysis ? (
          <>
            {/* Performance Rating */}
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
              <div>
                <p className="text-sm font-medium">Performance Rating</p>
                <p className="text-xs text-muted-foreground">Based on your discipline & execution</p>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= (analysis.performanceRating || 0)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* AI Reports */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Badge variant="outline">Habit Report</Badge>
                </h4>
                <p className="text-sm text-muted-foreground">{analysis.habitReport}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Badge variant="outline">Learning Report</Badge>
                </h4>
                <p className="text-sm text-muted-foreground">{analysis.learningReport}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Badge variant="outline">Actions Report</Badge>
                </h4>
                <p className="text-sm text-muted-foreground">{analysis.actionsReport}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Badge variant="outline">Results Report</Badge>
                </h4>
                <p className="text-sm text-muted-foreground">{analysis.resultsReport}</p>
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                AI Suggestions For Growth
              </h4>
              <ul className="space-y-2">
                {analysis.suggestions?.map((suggestion, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleRefresh}>
                Generate New Analysis
              </Button>
            </div>

            {/* Achievements Section */}
            {analysis.achievements && analysis.achievements.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Achievements</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.achievements.map((achievement, index) => (
                    <Badge key={index} variant="secondary" title={achievement.description || ''}>
                      {achievement.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No analysis available. Start logging your daily data to receive AI insights.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
