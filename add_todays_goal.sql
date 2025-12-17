-- Add todays_goal column to daily_habits table
ALTER TABLE public.daily_habits 
ADD COLUMN IF NOT EXISTS todays_goal TEXT;

-- Update RLS policies if necessary (usually not needed for just adding a column to an existing table if policies allow update)
