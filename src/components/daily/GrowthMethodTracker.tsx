import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast as sonnerToast } from "sonner"; // Renamed to avoid conflict
import { Loader2, Users, UserCheck, UserPlus, Heart, ClipboardCheck, Lightbulb, Megaphone, TrendingUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"; // Added
import { format } from "date-fns"; // Added

const DAY_PRIORITIES: Record<number, { name: string; description: string; icon: React.ReactNode }> = {
  0: { name: "Reflection Day", description: "Reflect on your week's performance and plan for the next", icon: <Lightbulb className="w-5 h-5" /> },
  1: { name: "Reaching New Customers", description: "Focus on acquiring new customers and expanding your reach", icon: <UserPlus className="w-5 h-5" /> },
  2: { name: "Reconnecting Current Customers", description: "Strengthen relationships with existing customers", icon: <UserCheck className="w-5 h-5" /> },
  3: { name: "Reactivating Inactive Customers", description: "Bring back customers who haven't engaged recently", icon: <Users className="w-5 h-5" /> },
  4: { name: "Referral Day", description: "Focus on asking for and following up on referrals", icon: <TrendingUp className="w-5 h-5" /> },
  5: { name: "Relationship Day", description: "Follow-up with prospects and nurture relationships", icon: <Heart className="w-5 h-5" /> },
  6: { name: "Review Day", description: "Review your week's results and analyze performance", icon: <ClipboardCheck className="w-5 h-5" /> },
};

interface GrowthTrackerProps {
  date: string;
}

export const GrowthMethodTracker = ({ date }: GrowthTrackerProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("marketing");
  const [priorityDescription, setPriorityDescription] = useState("");
  const [marketingNotes, setMarketingNotes] = useState("");
  const [salesNotes, setSalesNotes] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);

  const dayOfWeek = new Date(date).getDay();
  const todayPriority = DAY_PRIORITIES[dayOfWeek];
  const dayName = format(new Date(date), "EEEE");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('growth_method_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('log_date', date)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setExistingId(data.id);
          setPriorityDescription(data.priority_description || "");
          setMarketingNotes(data.marketing_notes || "");
          setSalesNotes(data.sales_notes || "");
        } else {
          // Reset form if no data for this date
          setExistingId(null);
          setPriorityDescription("");
          setMarketingNotes("");
          setSalesNotes("");
        }
      } catch (error) {
        console.error('Error fetching growth method data:', error);
        sonnerToast.error("Failed to load growth method data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, date]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        log_date: date,
        day_of_week: format(new Date(date), "EEEE"),
        day_priority: todayPriority.name,
        priority_description: priorityDescription,
        marketing_notes: marketingNotes,
        sales_notes: salesNotes,
      };

      const { error } = await supabase
        .from('growth_method_logs')
        .upsert({
          ...payload,
          id: existingId || undefined
        }, { onConflict: 'user_id,log_date' });

      if (error) throw error;

      sonnerToast.success("Growth method log saved successfully!");
    } catch (error) {
      console.error('Error saving growth method data:', error);
      sonnerToast.error("Failed to save growth method data");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Today's Priority Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              {todayPriority.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{dayName}'s Priority</CardTitle>
                <Badge variant="secondary">{todayPriority.name}</Badge>
              </div>
              <CardDescription>{todayPriority.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">What did you do for today's priority?</label>
            <Textarea
              value={priorityDescription}
              onChange={(e) => setPriorityDescription(e.target.value)}
              placeholder={`Describe your ${todayPriority.name.toLowerCase()} activities today...`}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Marketing & Sales Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Track your marketing and sales activities for today</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="marketing" className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                Marketing
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Sales
              </TabsTrigger>
            </TabsList>

            <TabsContent value="marketing" className="space-y-2">
              <label className="text-sm font-medium">What did you do for marketing today?</label>
              <Textarea
                value={marketingNotes}
                onChange={(e) => setMarketingNotes(e.target.value)}
                placeholder="Describe your marketing activities... (social media, content creation, ads, outreach, etc.)"
                className="min-h-[150px]"
              />
            </TabsContent>

            <TabsContent value="sales" className="space-y-2">
              <label className="text-sm font-medium">What did you do for sales today?</label>
              <Textarea
                value={salesNotes}
                onChange={(e) => setSalesNotes(e.target.value)}
                placeholder="Describe your sales activities... (calls, meetings, proposals, follow-ups, closings, etc.)"
                className="min-h-[150px]"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Growth Method Log"
        )}
      </Button>
    </div>
  );
};
