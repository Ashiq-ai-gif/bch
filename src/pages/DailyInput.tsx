import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle2, Lock, CalendarIcon } from "lucide-react";
import { LearningTracker } from "@/components/daily/LearningTracker";
import { HabitTracker } from "@/components/daily/HabitTracker";
import { GrowthMethodTracker } from "@/components/daily/GrowthMethodTracker";
import { BusinessTracker } from "@/components/daily/BusinessTracker";
import { supabase } from "@/integrations/supabase/client";
import { calculateDayCount, formatDayDisplay, getTodayDate } from "@/utils/dateUtils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isSameDay, parseISO } from "date-fns";

const DailyInput = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "learning");
  const [dayCount, setDayCount] = useState<number>(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [joinedDate, setJoinedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkStatus = async () => {
      try {
        setIsLoading(true);
        const dateStr = format(selectedDate, "yyyy-MM-dd");

        // Fetch profile for start date (only once or if missing)
        if (!joinedDate) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("created_at")
            .eq("user_id", user.id)
            .single();

          if (profile?.created_at) {
            setJoinedDate(new Date(profile.created_at));
            setDayCount(calculateDayCount(profile.created_at)); // Initial calc for 'Day X' relative to join
          }
        }

        // Recalculate Day X for the SELECTED date
        if (joinedDate) {
          const dayDiff = Math.floor((selectedDate.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          setDayCount(Math.max(1, dayDiff));
        }

        // Check if daily habit exists for SELECTED date
        const { data: habit } = await supabase
          .from("daily_habits")
          .select("id")
          .eq("user_id", user.id)
          .eq("log_date", dateStr)
          .maybeSingle();

        setIsCompleted(!!habit);

      } catch (error) {
        console.error("Error checking daily status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [user, navigate, selectedDate, joinedDate]); // Re-run when selectedDate changes

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const isToday = isSameDay(selectedDate, new Date());

  if (isLoading && !joinedDate) { // Only full page load on first mount
    return (
      <div className="min-h-screen bg-transparent p-8">
        <div className="container mx-auto space-y-4">
          <Skeleton className="h-12 w-full max-w-sm" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Locked State (Only if completed AND it's today - strictly speaking user can view past days even if completed, but maybe they want to EDIT?
  // User asked: "he can do his previous day input".
  // Implementation: If completed, show "Complete" state (ReadOnly). If NOT completed, show Inputs.
  // We should allow viewing "Complete" state for past days too.

  const showLockedState = isCompleted;

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 flex-wrap">
                  Daily Input
                  <span className="text-sm font-normal px-2 py-0.5 bg-primary/10 text-primary rounded-full whitespace-nowrap">
                    Day {dayCount}
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground">{formatDayDisplay(selectedDate)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full md:w-[240px] justify-start text-left font-normal glass-card hover:bg-white/10 border-white/10",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) =>
                      date > new Date() || (joinedDate ? date < joinedDate : false)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {showLockedState ? (
          <div className="flex items-center justify-center py-12">
            <Card className="w-full max-w-md text-center p-6 space-y-6 glass-card border-primary/20">
              <div className="flex justify-center">
                <div className="bg-primary/10 p-4 rounded-full">
                  <CheckCircle2 className="w-16 h-16 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Day {dayCount} Complete!</h1>
                <p className="text-muted-foreground">
                  Data for {formatDayDisplay(selectedDate)} has been submitted.
                </p>
                {isToday ? (
                  <p className="text-sm font-medium text-primary">
                    Come back tomorrow to continue your streak!
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Great job catching up on your history!
                  </p>
                )}
              </div>
              <div className="pt-4 border-t flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-3 h-3" />
                Entry is locked
              </div>
            </Card>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-lg mx-auto mb-8 h-auto gap-2 bg-black/20 p-1">
              <TabsTrigger value="learning" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">Learning</TabsTrigger>
              <TabsTrigger value="habits" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">Habits</TabsTrigger>
              <TabsTrigger value="growth" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">Growth</TabsTrigger>
              <TabsTrigger value="business" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">Business</TabsTrigger>
            </TabsList>

            <TabsContent value="learning">
              <LearningTracker date={selectedDateStr} />
            </TabsContent>

            <TabsContent value="habits">
              <HabitTracker date={selectedDateStr} />
            </TabsContent>

            <TabsContent value="growth">
              <GrowthMethodTracker date={selectedDateStr} />
            </TabsContent>

            <TabsContent value="business">
              <BusinessTracker date={selectedDateStr} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default DailyInput;