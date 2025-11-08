-- Create social_users table to store social media account users
CREATE TABLE public.social_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.social_users ENABLE ROW LEVEL SECURITY;

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

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_social_users_updated_at
BEFORE UPDATE ON public.social_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the initial users
INSERT INTO public.social_users (name) VALUES 
  ('د.احمد السنوسى'),
  ('فهد العتيبى'),
  ('محمد عبد الستار');