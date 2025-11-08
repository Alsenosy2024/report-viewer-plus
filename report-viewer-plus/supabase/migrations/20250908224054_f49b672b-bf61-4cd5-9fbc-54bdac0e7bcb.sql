-- Enable Row Level Security on social_users (if not already enabled)
ALTER TABLE public.social_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage all social users" ON public.social_users;
DROP POLICY IF EXISTS "Users can view social users if they have social_media_posts access" ON public.social_users;

-- Create policies for social_users access
CREATE POLICY "Admins can manage all social users" 
ON public.social_users 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can view social users if they have social_media_posts access" 
ON public.social_users 
FOR SELECT 
USING (
  (get_user_role(auth.uid()) = 'admin'::user_role) OR 
  can_access_section(auth.uid(), 'social_media_posts'::dashboard_section)
);

-- Insert the initial users if they don't exist
INSERT INTO public.social_users (name) 
SELECT * FROM (VALUES 
  ('د.احمد السنوسى'),
  ('فهد العتيبى'),
  ('محمد عبد الستار')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.social_users WHERE social_users.name = v.name
);