-- 1. Check if the user exists and what their ID is
SELECT id, email, created_at FROM auth.users WHERE email ILIKE 'Sreejith.businessinfluencer@gmail.com';

-- 2. Insert the admin role if it doesn't exist
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email ILIKE 'Sreejith.businessinfluencer@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Verify the role was assigned
SELECT ur.*, u.email 
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email ILIKE 'Sreejith.businessinfluencer@gmail.com';
