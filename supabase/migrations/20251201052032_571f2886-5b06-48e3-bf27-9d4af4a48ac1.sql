-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all financial goals
CREATE POLICY "Admins can view all financial goals"
ON public.financial_goals
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all daily habits
CREATE POLICY "Admins can view all daily habits"
ON public.daily_habits
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all daily learning
CREATE POLICY "Admins can view all daily learning"
ON public.daily_learning
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all business logs
CREATE POLICY "Admins can view all business logs"
ON public.daily_business_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all achievements
CREATE POLICY "Admins can view all achievements"
ON public.achievements
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all monthly targets
CREATE POLICY "Admins can view all monthly targets"
ON public.monthly_targets
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all AI reports
CREATE POLICY "Admins can view all AI reports"
ON public.ai_reports
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all todo items
CREATE POLICY "Admins can view all todo items"
ON public.todo_items
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));