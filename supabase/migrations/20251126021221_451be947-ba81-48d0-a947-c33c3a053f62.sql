-- Create enums for structured data
CREATE TYPE public.timeline_period AS ENUM ('weekly', 'monthly', 'yearly', 'two_year', 'five_year');
CREATE TYPE public.habit_category AS ENUM ('morning_routine', 'sales_activity', 'learning', 'health', 'other');

-- Financial goals cascade table (5-year, yearly, monthly breakdown)
CREATE TABLE public.financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  baseline_monthly_revenue DECIMAL(12,2) NOT NULL,
  five_year_target DECIMAL(12,2) NOT NULL,
  year_1_target DECIMAL(12,2) NOT NULL,
  year_2_target DECIMAL(12,2) NOT NULL,
  year_3_target DECIMAL(12,2) NOT NULL,
  year_4_target DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Monthly targets broken down from year 1 goal
CREATE TABLE public.monthly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  target_revenue DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Daily business tracking
CREATE TABLE public.daily_business_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  gross_profit DECIMAL(12,2) NOT NULL DEFAULT 0,
  ai_prediction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Daily learning tracker
CREATE TABLE public.daily_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  learning_point TEXT NOT NULL,
  implementation_plan TEXT NOT NULL,
  ai_suggestions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Daily habits and todos
CREATE TABLE public.daily_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  wake_up_time TIME,
  most_important_action TEXT,
  what_went_well TEXT,
  what_went_wrong TEXT,
  what_to_improve TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Todo items (AI-generated and user-added)
CREATE TABLE public.todo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  daily_habit_id UUID NOT NULL,
  task_description TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  priority INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (daily_habit_id) REFERENCES public.daily_habits(id) ON DELETE CASCADE
);

-- AI analysis reports
CREATE TABLE public.ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_period timeline_period NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  habit_report TEXT,
  learning_report TEXT,
  actions_report TEXT,
  results_report TEXT,
  performance_rating INT CHECK (performance_rating >= 1 AND performance_rating <= 5),
  growth_suggestions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- User achievements and badges
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on all tables
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_business_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_goals
CREATE POLICY "Users can view own financial goals" ON public.financial_goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own financial goals" ON public.financial_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial goals" ON public.financial_goals
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for monthly_targets
CREATE POLICY "Users can view own monthly targets" ON public.monthly_targets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own monthly targets" ON public.monthly_targets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own monthly targets" ON public.monthly_targets
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for daily_business_logs
CREATE POLICY "Users can view own business logs" ON public.daily_business_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business logs" ON public.daily_business_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business logs" ON public.daily_business_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for daily_learning
CREATE POLICY "Users can view own learning logs" ON public.daily_learning
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own learning logs" ON public.daily_learning
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own learning logs" ON public.daily_learning
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for daily_habits
CREATE POLICY "Users can view own habit logs" ON public.daily_habits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit logs" ON public.daily_habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit logs" ON public.daily_habits
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for todo_items
CREATE POLICY "Users can view own todos" ON public.todo_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own todos" ON public.todo_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own todos" ON public.todo_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own todos" ON public.todo_items
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_reports
CREATE POLICY "Users can view own AI reports" ON public.ai_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI reports" ON public.ai_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievements
CREATE POLICY "Users can view own achievements" ON public.achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_financial_goals_updated_at
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_daily_business_logs_updated_at
  BEFORE UPDATE ON public.daily_business_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_daily_learning_updated_at
  BEFORE UPDATE ON public.daily_learning
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_daily_habits_updated_at
  BEFORE UPDATE ON public.daily_habits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();