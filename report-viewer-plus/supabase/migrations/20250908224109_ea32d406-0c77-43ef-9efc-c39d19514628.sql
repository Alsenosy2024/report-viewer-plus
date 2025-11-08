-- Add user_name column to posts table
ALTER TABLE public.posts 
ADD COLUMN user_name TEXT;

-- Update existing posts to have user_name from profiles table
UPDATE public.posts 
SET user_name = profiles.full_name 
FROM public.profiles 
WHERE posts.created_by = profiles.id AND posts.user_name IS NULL;