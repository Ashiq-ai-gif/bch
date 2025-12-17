import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import { format } from "date-fns";

interface LearningTrackerProps {
  date: string;
}

export const LearningTracker = ({ date }: LearningTrackerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [data, setData] = useState({
    learning_point: "",
    implementation_plan: "",
    ai_suggestions: "",
  });

  useEffect(() => {
    if (!user) return;

    // Reset data on date change
    setData({
      learning_point: "",
      implementation_plan: "",
      ai_suggestions: "",
    });

    const fetchTodayData = async () => {
      const { data: existingData } = await supabase
        .from("daily_learning")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", date)
        .maybeSingle();

      if (existingData) {
        setData({
          learning_point: existingData.learning_point,
          implementation_plan: existingData.implementation_plan,
          ai_suggestions: existingData.ai_suggestions || "",
        });
      }
    };

    fetchTodayData();
  }, [user, date]);

  const handleGetAISuggestions = async () => {
    if (!data.learning_point.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your learning point first",
        variant: "destructive",
      });
      return;
    }

    setAiLoading(true);
    // TODO: Call AI edge function to generate suggestions
    // For now, using placeholder
    setTimeout(() => {
      setData({
        ...data,
        ai_suggestions: "Based on your learning about digital marketing, consider:\n1. Testing 3 different ad variations this week\n2. Setting up retargeting campaigns for website visitors\n3. Creating a content calendar to maintain consistent posting",
      });
      setAiLoading(false);
      toast({
        title: "AI Suggestions Generated",
        description: "Review the suggestions below",
      });
    }, 2000);
  };

  const handleSave = async () => {
    if (!user || !data.learning_point.trim() || !data.implementation_plan.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in learning point and implementation plan",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("daily_learning")
      .upsert({
        user_id: user.id,
        log_date: date,
        ...data,
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
      toast({
        title: "Success",
        description: "Your learning has been saved",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Today's Learning</CardTitle>
          <CardDescription>What did you learn today and how will you implement it?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="learning">Today's Learning Point *</Label>
            <Textarea
              id="learning"
              value={data.learning_point}
              onChange={(e) => setData({ ...data, learning_point: e.target.value })}
              placeholder="Describe what you learned today..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="implementation">How Will I Implement This? *</Label>
            <Textarea
              id="implementation"
              value={data.implementation_plan}
              onChange={(e) => setData({ ...data, implementation_plan: e.target.value })}
              placeholder="Describe your action plan..."
              rows={4}
            />
          </div>

          <Button
            onClick={handleGetAISuggestions}
            disabled={aiLoading || !data.learning_point.trim()}
            variant="outline"
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {aiLoading ? "Generating..." : "Get AI Suggestions"}
          </Button>

          {data.ai_suggestions && (
            <div className="space-y-2">
              <Label>AI Suggestions on Learning</Label>
              <div className="p-4 bg-primary/5 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{data.ai_suggestions}</p>
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Learning"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};