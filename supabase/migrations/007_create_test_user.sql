-- =============================================
-- Create Test User with Identity
-- Migration: 007_create_test_user
-- Date: 2026-01-09
-- =============================================

-- Create a test user for development/testing
-- Email: test@petpal.app
-- Password: Test1234!

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'test@petpal.app') THEN
    RAISE NOTICE 'Test user already exists';
    RETURN;
  END IF;

  -- Create the test user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'test@petpal.app',
    extensions.crypt('Test1234!', extensions.gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test User"}',
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  );
  
  RAISE NOTICE 'Created test user with ID: %', new_user_id;

  -- Create identity record (required for email login)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    new_user_id,
    new_user_id::text,
    'email',
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', 'test@petpal.app',
      'email_verified', true,
      'phone_verified', false
    ),
    NOW(),
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Created identity for test user';
  RAISE NOTICE 'Login with: test@petpal.app / Test1234!';
END $$;
