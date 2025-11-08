-- Create or replace policies for social_users access (simplified version)
DROP POLICY IF EXISTS "Admins can manage all social users" ON public.social_users;
DROP POLICY IF EXISTS "Users can view social users" ON public.social_users;

-- Create policies for social_users access (simplified)
CREATE POLICY "Admins can manage all social users" 
ON public.social_users 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can view social users" 
ON public.social_users 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Insert the initial users if they don't exist
INSERT INTO public.social_users (name) 
SELECT unnest(ARRAY['د.احمد السنوسى', 'فهد العتيبى', 'محمد عبد الستار'])
WHERE NOT EXISTS (SELECT 1 FROM public.social_users LIMIT 1);