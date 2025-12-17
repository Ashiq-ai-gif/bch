import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2 } from "lucide-react";

interface TodoItem {
  id: string;
  task_description: string;
  completed: boolean;
  is_ai_generated: boolean;
}

interface HabitTrackerProps {
  date: string;
}

export const HabitTracker = ({ date }: HabitTrackerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [habitId, setHabitId] = useState<string | null>(null);
  const [wakeTime, setWakeTime] = useState("");
  const [todaysGoal, setTodaysGoal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reflection, setReflection] = useState({
    most_important_action: "",
    what_went_well: "",
    what_went_wrong: "",
    what_to_improve: "",
  });
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    if (!user) return;

    // Reset state when date changes
    setHabitId(null);
    setWakeTime("");
    setTodaysGoal("");
    setReflection({
      most_important_action: "",
      what_went_well: "",
      what_went_wrong: "",
      what_to_improve: "",
    });
    setTodos([]);

    const fetchTodayData = async () => {
      const { data: habitData } = await supabase
        .from("daily_habits")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", date)
        .maybeSingle();

      if (habitData) {
        setHabitId(habitData.id);
        setWakeTime(habitData.wake_up_time || "");
        setTodaysGoal(habitData.todays_goal || "");
        setReflection({
          most_important_action: habitData.most_important_action || "",
          what_went_well: habitData.what_went_well || "",
          what_went_wrong: habitData.what_went_wrong || "",
          what_to_improve: habitData.what_to_improve || "",
        });

        // Fetch todos
        const { data: todoData } = await supabase
          .from("todo_items")
          .select("*")
          .eq("daily_habit_id", habitData.id)
          .order("created_at");

        if (todoData) {
          setTodos(todoData);
        }
      }
    };

    fetchTodayData();
  }, [user, date]);

  const handleGenerateTasks = async () => {
    if (!todaysGoal.trim()) {
      toast({ title: "Error", description: "Please enter a goal first", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-tasks', {
        body: { goal: todaysGoal }
      });

      if (error) throw error;

      if (data.advice) {
        toast({ title: "AI Advice", description: data.advice });
      }

      if (data.tasks && Array.isArray(data.tasks)) {
        // Ensure habit record exists to attach tasks
        let currentHabitId = habitId;
        if (!currentHabitId) {
          // Create habit if not exists
          const { data: newHabit } = await supabase.from("daily_habits").insert({
            user_id: user.id,
            log_date: date,
            todays_goal: todaysGoal
          }).select().single();

          if (newHabit) {
            currentHabitId = newHabit.id;
            setHabitId(currentHabitId);
          }
        }

        if (currentHabitId) {
          for (const task of data.tasks) {
            const { data: newTodo } = await supabase.from("todo_items").insert({
              user_id: user.id,
              daily_habit_id: currentHabitId,
              task_description: task,
              is_ai_generated: true
            }).select().single();

            if (newTodo) setTodos(prev => [...prev, newTodo]);
          }
        }
      }

    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to generate tasks", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTodo = async () => {
    if (!user || !newTodo.trim()) return;

    // First ensure habit record exists
    let currentHabitId = habitId;
    if (!currentHabitId) {
      const { data, error } = await supabase
        .from("daily_habits")
        .insert({
          user_id: user.id,
          log_date: date,
          todays_goal: todaysGoal,
        })
        .select()
        .single();

      if (error || !data) {
        toast({
          title: "Error",
          description: "Failed to create habit record",
          variant: "destructive",
        });
        return;
      }

      currentHabitId = data.id;
      setHabitId(currentHabitId);
    }

    const { data, error } = await supabase
      .from("todo_items")
      .insert({
        user_id: user.id,
        daily_habit_id: currentHabitId,
        task_description: newTodo,
        is_ai_generated: false,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setTodos([...todos, data]);
      setNewTodo("");
    }
  };

  const handleToggleTodo = async (todoId: string, completed: boolean) => {
    const { error } = await supabase
      .from("todo_items")
      .update({ completed: !completed })
      .eq("id", todoId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTodos(todos.map(t => t.id === todoId ? { ...t, completed: !completed } : t));
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    const { error } = await supabase
      .from("todo_items")
      .delete()
      .eq("id", todoId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTodos(todos.filter(t => t.id !== todoId));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    let aiSummary = "";
    // Only generate summary if we are saving habits (not just reflection fallback)
    if (user) {
      try {
        const { data: summaryData, error: summaryError } = await supabase.functions.invoke('generate-daily-summary', {
          body: { category: 'habits', data: { ...reflection, tasks_completed: todos.filter(t => t.completed).length, total_tasks: todos.length, wake_time: wakeTime, goal: todaysGoal } }
        });
        if (!summaryError && summaryData?.summary) {
          aiSummary = summaryData.summary;
        }
      } catch (e) {
        console.error("Failed to generate summary", e);
      }
    }

    const { error } = await supabase
      .from("daily_habits")
      .upsert({
        id: habitId || undefined,
        user_id: user.id,
        log_date: date,
        wake_up_time: wakeTime || null,
        todays_goal: todaysGoal,
        ai_summary: aiSummary || null, // Save summary
        ...reflection,
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
        description: "Your habits and reflection have been saved",
      });

      // Background update of user persona
      supabase.functions.invoke('update-user-persona').catch(console.error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Habits & Goal</CardTitle>
          <CardDescription>Track your morning routine, set a main goal, and generate tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wake_time">Wake Up Time</Label>
            <Input
              id="wake_time"
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="todays_goal">Today's Main Goal</Label>
            <div className="flex gap-2">
              <Textarea
                id="todays_goal"
                placeholder="E.g., Finish the monthly report"
                value={todaysGoal}
                onChange={(e) => setTodaysGoal(e.target.value)}
                rows={2}
              />
              <Button
                variant="secondary"
                className="h-auto"
                onClick={handleGenerateTasks}
                disabled={isGenerating || !todaysGoal.trim()}
              >
                {isGenerating ? "Analyzing..." : "Generate Tasks"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">The AI will analyze your goal and break it down into actionable tasks.</p>
          </div>

          <div className="space-y-2">
            <Label>Today's Tasks</Label>
            <div className="space-y-2">
              {todos.map((todo) => (
                <div key={todo.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => handleToggleTodo(todo.id, todo.completed)}
                  />
                  <span className={`flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""} ${todo.is_ai_generated ? "text-blue-600" : ""}`}>
                    {todo.task_description}
                  </span>
                  {todo.is_ai_generated && <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded">AI</span>}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTodo(todo.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a new task..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
              />
              <Button onClick={handleAddTodo} size="icon">
                <PlusCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Reflection</CardTitle>
          <CardDescription>Reflect on your day's actions and outcomes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="important">Most Important Action Taken</Label>
            <Textarea
              id="important"
              value={reflection.most_important_action}
              onChange={(e) => setReflection({ ...reflection, most_important_action: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="well">What Went Well</Label>
            <Textarea
              id="well"
              value={reflection.what_went_well}
              onChange={(e) => setReflection({ ...reflection, what_went_well: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wrong">What Went Wrong</Label>
            <Textarea
              id="wrong"
              value={reflection.what_went_wrong}
              onChange={(e) => setReflection({ ...reflection, what_went_wrong: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="improve">What Could Be Improved</Label>
            <Textarea
              id="improve"
              value={reflection.what_to_improve}
              onChange={(e) => setReflection({ ...reflection, what_to_improve: e.target.value })}
              rows={2}
            />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Habits & Reflection"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};