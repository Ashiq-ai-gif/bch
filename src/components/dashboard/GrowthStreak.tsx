import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Flame } from "lucide-react";
import { differenceInDays, format, subDays } from "date-fns";

export const GrowthStreak = ({ userId }: { userId?: string }) => {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!effectiveUserId) return;

    const calculateStreak = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("daily_business_logs")
        .select("log_date")
        .eq("user_id", effectiveUserId)
        .order("log_date", { ascending: false })
        .limit(100);

      if (!data || data.length === 0) {
        setStreak(0);
        setLoading(false);
        return;
      }

      let currentStreak = 0;
      let checkDate = new Date();

      for (const log of data) {
        const logDate = new Date(log.log_date);
        const daysDiff = differenceInDays(checkDate, logDate);

        if (daysDiff === 0 || daysDiff === 1) {
          currentStreak++;
          checkDate = logDate;
        } else {
          break;
        }
      }

      setStreak(currentStreak);
      setLoading(false);
    };

    calculateStreak();
  }, [effectiveUserId]);

  return (
    <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Growth Streak
        </CardTitle>
        <CardDescription>Consecutive days of business growth tracking</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-2xl font-bold">Loading...</p>
        ) : (
          <div className="space-y-2">
            <p className="text-5xl font-bold text-orange-500">{streak}</p>
            <p className="text-sm text-muted-foreground">
              {streak === 1 ? "day" : "days"} of consistent tracking
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};