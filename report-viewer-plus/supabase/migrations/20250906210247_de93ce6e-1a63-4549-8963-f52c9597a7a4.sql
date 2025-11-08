-- Create posts table for social media content management
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID NULL,
  approved_at TIMESTAMP WITH TIME ZONE NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policies for posts access
CREATE POLICY "Users can view posts they created" 
ON public.posts 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own pending posts" 
ON public.posts 
FOR UPDATE 
USING (auth.uid() = created_by AND status = 'pending');

CREATE POLICY "Admins can view all posts" 
ON public.posts 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update post status" 
ON public.posts 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete posts" 
ON public.posts 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();