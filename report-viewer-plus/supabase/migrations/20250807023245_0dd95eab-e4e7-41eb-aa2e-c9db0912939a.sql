-- Enable RLS on all public tables that don't have it
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_maker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mostafa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documents table
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid()::text = user_id OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

CREATE POLICY "Users can create their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid()::text = user_id OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid()::text = user_id OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

-- Create RLS policies for n8n_chat_histories table
CREATE POLICY "Users can view their own chat histories" 
ON public.n8n_chat_histories 
FOR SELECT 
USING (auth.uid()::text = user_id OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

CREATE POLICY "Users can create their own chat histories" 
ON public.n8n_chat_histories 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own chat histories" 
ON public.n8n_chat_histories 
FOR UPDATE 
USING (auth.uid()::text = user_id OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

-- Create RLS policies for rag table  
CREATE POLICY "Users can view their own rag data" 
ON public.rag 
FOR SELECT 
USING (auth.uid()::text = user_id OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

CREATE POLICY "Users can create their own rag data" 
ON public.rag 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own rag data" 
ON public.rag 
FOR UPDATE 
USING (auth.uid()::text = user_id OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

-- Create admin-only policies for other tables
CREATE POLICY "Only admins can access messenger data" 
ON public.messenger 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

CREATE POLICY "Only admins can access model_maker data" 
ON public.model_maker 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

CREATE POLICY "Only admins can access mostafa data" 
ON public.mostafa 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));

-- Fix the profiles table to prevent role escalation
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile (excluding role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Only admins can update user roles" 
ON public.profiles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid()::text 
  AND profiles.role = 'admin'
));