-- Phase 1: Critical Security Fixes

-- 1. Enable RLS on n8n_chat_histories table (currently exposed to public)
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for n8n_chat_histories
CREATE POLICY "Only admins can access n8n chat histories" 
ON public.n8n_chat_histories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 2. Secure database functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id;
$function$;

CREATE OR REPLACE FUNCTION public.can_access_section(user_id uuid, section_name dashboard_section)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE(
    (SELECT can_access FROM public.section_permissions 
     WHERE user_id = $1 AND section = $2),
    false
  );
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.bot_status_set_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.last_updated := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$function$;

-- 3. Remove redundant/conflicting RLS policy on profiles table
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.profiles;

-- 4. Strengthen the user self-update policy to prevent privilege escalation
DROP POLICY IF EXISTS "Users can update their own profile (no role/approval change)" ON public.profiles;

CREATE POLICY "Users can update their own profile (no role/approval change)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  AND is_approved = (SELECT p.is_approved FROM public.profiles p WHERE p.id = auth.uid())
  AND approved_at = (SELECT p.approved_at FROM public.profiles p WHERE p.id = auth.uid())
  AND approved_by = (SELECT p.approved_by FROM public.profiles p WHERE p.id = auth.uid())
);