-- Allow admins to update any profile
create policy "Admins can update all profiles"
on public.profiles
for update
to authenticated
using (
  (select count(*) from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = 'admin') > 0
);
