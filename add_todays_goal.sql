-- Add todays_goal column to daily_habits table
ALTER TABLE public.daily_habits 
ADD COLUMN IF NOT EXISTS todays_goal TEXT;

-- Add ai_summary column to daily_habits table (used for daily reflection summary)
ALTER TABLE public.daily_habits 
ADD COLUMN IF NOT EXISTS ai_summary TEXT;
