-- Add ai_persona_summary column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_persona_summary TEXT;
