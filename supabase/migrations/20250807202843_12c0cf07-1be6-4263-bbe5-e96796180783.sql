-- Add approval columns to profiles and tighten RLS so only admins can change approval
-- 1) Schema changes
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Approve existing admins by default
UPDATE public.profiles
SET is_approved = true,
    approved_at = NOW()
WHERE role = 'admin';

-- 2) RLS policies update
-- Drop the existing policy that allows users to update their own profile so we can recreate it with stricter checks
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can update their own profile (excluding role)'
  ) THEN
    EXECUTE 'DROP POLICY "Users can update their own profile (excluding role)" ON public.profiles;';
  END IF;
END$$;

-- Recreate the self-update policy but forbid changing role and is_approved fields by regular users
CREATE POLICY "Users can update their own profile (no role/approval change)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  AND is_approved = (SELECT p.is_approved FROM public.profiles p WHERE p.id = auth.uid())
);

-- Ensure admins retain full update rights (policy already exists per project state, but recreate defensively if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Admins can update all profiles'
  ) THEN
    CREATE POLICY "Admins can update all profiles"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (get_user_role(auth.uid()) = 'admin');
  END IF;
END$$;
