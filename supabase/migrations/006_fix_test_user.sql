-- =============================================
-- Fix Test User - Add Identity
-- Migration: 006_fix_test_user
-- Date: 2026-01-09
-- =============================================

-- Add identity record for the test user (required for email login)
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get the test user ID
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@petpal.app';
  
  IF test_user_id IS NOT NULL THEN
    -- Check if identity already exists
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = test_user_id AND provider = 'email') THEN
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
        test_user_id,
        test_user_id::text,
        'email',
        jsonb_build_object(
          'sub', test_user_id::text,
          'email', 'test@petpal.app',
          'email_verified', true,
          'phone_verified', false
        ),
        NOW(),
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created identity for test user';
    ELSE
      RAISE NOTICE 'Identity already exists for test user';
    END IF;
  ELSE
    RAISE NOTICE 'Test user not found!';
  END IF;
END $$;
