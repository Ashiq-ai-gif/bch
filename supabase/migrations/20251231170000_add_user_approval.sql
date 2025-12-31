-- Add is_approved column to profiles
alter table public.profiles 
add column if not exists is_approved boolean default false;

-- Auto-approve existing users so they don't get locked out
update public.profiles 
set is_approved = true 
where is_approved is false;

-- Ensure RLS allows users to read their own approval status (already covered by "Users can view own profile" usually, but good to verify if specific policy needs update. Assuming public profile or own profile visibility is already there)
