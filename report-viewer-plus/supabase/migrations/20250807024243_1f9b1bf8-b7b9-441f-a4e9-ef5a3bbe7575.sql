-- Enable RLS on all public tables that don't have it
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.model_maker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mostafa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag ENABLE ROW LEVEL SECURITY;

-- Create admin-only policies for tables without user context
-- Documents table - admin only access
CREATE POLICY "Only admins can access documents"
ON public.documents
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

-- Messenger table - admin only access  
CREATE POLICY "Only admins can access messenger data"
ON public.messenger
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

-- Model maker table - admin only access
CREATE POLICY "Only admins can access model_maker data"
ON public.model_maker
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

-- Mostafa table - admin only access
CREATE POLICY "Only admins can access mostafa data"
ON public.mostafa
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

-- N8N chat histories - admin only access
CREATE POLICY "Only admins can access n8n chat histories"
ON public.n8n_chat_histories
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

-- RAG table - admin only access
CREATE POLICY "Only admins can access rag data"
ON public.rag
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

-- Fix emails and email2 tables if they exist
DO $$
BEGIN
  -- Check if emails table exists and enable RLS + create policy
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emails') THEN
    EXECUTE 'ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Only admins can access emails" ON public.emails FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()::text AND profiles.role = ''admin''))';
  END IF;
  
  -- Check if email2 table exists and enable RLS + create policy  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email2') THEN
    EXECUTE 'ALTER TABLE public.email2 ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Only admins can access email2" ON public.email2 FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid()::text AND profiles.role = ''admin''))';
  END IF;
END $$;

-- Fix the profiles table to prevent role escalation
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a secure policy that prevents users from changing their own role
CREATE POLICY "Users can update their own profile (excluding role)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Add a separate admin-only policy for role updates
CREATE POLICY "Only admins can update user roles"
ON public.profiles
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));