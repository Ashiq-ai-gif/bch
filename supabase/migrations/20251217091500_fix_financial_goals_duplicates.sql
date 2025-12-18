-- Remove duplicates from financial_goals, keeping the latest one
DELETE FROM public.financial_goals
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM public.financial_goals
  ) t
  WHERE t.rn > 1
);

-- Add User ID Unique Constraint
ALTER TABLE public.financial_goals ADD CONSTRAINT financial_goals_user_id_key UNIQUE (user_id);
