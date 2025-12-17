-- Add todays_goal column to daily_habits table
ALTER TABLE public.daily_habits 
ADD COLUMN IF NOT EXISTS todays_goal TEXT;
