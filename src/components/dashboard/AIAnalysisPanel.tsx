import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Star, TrendingUp, Lightbulb } from "lucide-react";

type TimelineView = "weekly" | "monthly" | "yearly";

export const AIAnalysisPanel = () => {
  const [timeline, setTimeline] = useState<TimelineView>("weekly");

  // Placeholder data - will be replaced with actual AI-generated reports
  const mockData = {
    habitReport: "You've maintained an 85% completion rate on your morning routine. Sales calls have been consistent at 10/day, showing strong discipline.",
    learningReport: "You've logged 7 learning points this week focused on digital marketing strategies. Implementation rate is 60% - consider setting specific action timelines.",
    actionsReport: "Top 3 actions taken: Cold outreach (40 calls), Content creation (3 posts), Client meetings (5). Your focus on client meetings correlates with revenue spikes.",
    resultsReport: "Revenue up 15% compared to last week. Average daily revenue: $2,450. You're currently tracking 8% ahead of monthly target.",
    performanceRating: 4,
    suggestions: [
      "Increase follow-up rate on cold calls from 40% to 60% to capture more leads",
      "Schedule learning implementation sessions every Monday to improve action rate",
      "Focus on closing 2 more deals this week to exceed monthly target"
    ]
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
            <CardDescription>Personalized insights based on your data</CardDescription>
          </div>
          <Tabs value={timeline} onValueChange={(v) => setTimeline(v as TimelineView)}>
            <TabsList>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Rating */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
          <div>
            <p className="text-sm font-medium">Performance Rating</p>
            <p className="text-xs text-muted-foreground">Overall discipline & execution</p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= mockData.performanceRating
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
            <p className="text-sm text-muted-foreground">{mockData.habitReport}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge variant="outline">Learning Report</Badge>
            </h4>
            <p className="text-sm text-muted-foreground">{mockData.learningReport}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge variant="outline">Actions Report</Badge>
            </h4>
            <p className="text-sm text-muted-foreground">{mockData.actionsReport}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge variant="outline">Results Report</Badge>
            </h4>
            <p className="text-sm text-muted-foreground">{mockData.resultsReport}</p>
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            AI Suggestions For Growth
          </h4>
          <ul className="space-y-2">
            {mockData.suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="w-full mt-2">
            Generate New Suggestions
          </Button>
        </div>

        {/* Achievements Section */}
        <div className="space-y-2">
          <h4 className="font-semibold">Achievements</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">🏆 10-Day Streak</Badge>
            <Badge variant="secondary">⚡ Early Bird</Badge>
            <Badge variant="secondary">💰 Revenue Milestone</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};