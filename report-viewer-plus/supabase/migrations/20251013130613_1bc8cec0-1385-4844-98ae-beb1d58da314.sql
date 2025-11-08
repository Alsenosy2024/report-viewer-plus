-- Create content table for social media post ideas
CREATE TABLE public.content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  summary text NOT NULL,
  is_posted boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all content"
ON public.content
FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Users can view their own content
CREATE POLICY "Users can view their own content"
ON public.content
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Users can create their own content
CREATE POLICY "Users can create their own content"
ON public.content
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Users can update their own content
CREATE POLICY "Users can update their own content"
ON public.content
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Users can delete their own content
CREATE POLICY "Users can delete their own content"
ON public.content
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Create trigger for updated_at
CREATE TRIGGER update_content_updated_at
BEFORE UPDATE ON public.content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.content;