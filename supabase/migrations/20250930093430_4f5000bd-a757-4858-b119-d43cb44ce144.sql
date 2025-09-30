-- Enable real-time for posts table
ALTER TABLE public.posts REPLICA IDENTITY FULL;

-- Add posts table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;