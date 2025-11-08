-- Promote specified user to admin and approve access
DO $$
DECLARE
  v_uid uuid;
  v_email text := 'karm92000@gmail.com';
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = v_email LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'User with email % not found in auth.users', v_email;
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid) THEN
    UPDATE public.profiles
      SET role = 'admin'::user_role,
          is_approved = true,
          approved_at = now(),
          updated_at = now()
    WHERE id = v_uid;
  ELSE
    INSERT INTO public.profiles (id, email, full_name, role, is_approved, approved_at)
    VALUES (v_uid, v_email, v_email, 'admin'::user_role, true, now());
  END IF;
END $$;