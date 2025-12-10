-- Create table for growth method logs
CREATE TABLE public.growth_method_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  day_of_week TEXT NOT NULL,
  day_priority TEXT NOT NULL,
  priority_description TEXT,
  marketing_notes TEXT,
  sales_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, log_date)
);

-- Enable RLS
ALTER TABLE public.growth_method_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own growth method logs" 
ON public.growth_method_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own growth method logs" 
ON public.growth_method_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own growth method logs" 
ON public.growth_method_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all growth method logs" 
ON public.growth_method_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_growth_method_logs_updated_at
BEFORE UPDATE ON public.growth_method_logs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();