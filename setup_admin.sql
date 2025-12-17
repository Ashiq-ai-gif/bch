-- Create admin user and assign admin role
-- This script should be run in the Supabase SQL Editor

-- Create admin user and assign admin role
-- This script should be run in the Supabase SQL Editor

DO $$
DECLARE
  user_uuid UUID;
  user_email TEXT := 'sreejith.businessinfluencer@gmail.com';
BEGIN
  -- Check if user exists
  SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;

  -- If user doesn't exist, create them
  IF user_uuid IS NULL THEN
    user_uuid := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_uuid,
      'authenticated',
      'authenticated',
      user_email,
      crypt('Sreejith@6282', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  END IF;
  
  -- Create profile for the user
  INSERT INTO public.profiles (user_id, full_name, created_at, updated_at)
  VALUES (user_uuid, 'Admin User', NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_uuid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
END $$;
