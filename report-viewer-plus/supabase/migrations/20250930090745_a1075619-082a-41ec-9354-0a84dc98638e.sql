-- Create enum for posting status
CREATE TYPE posting_status_enum AS ENUM ('not_posted', 'posting', 'posted', 'failed');

-- Add new columns to posts table
ALTER TABLE public.posts
ADD COLUMN posting_status posting_status_enum NOT NULL DEFAULT 'not_posted',
ADD COLUMN posted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN posting_error TEXT,
ADD COLUMN external_post_id TEXT;

-- Create index for faster queries on posting_status
CREATE INDEX idx_posts_posting_status ON public.posts(posting_status);

-- Add comment for documentation
COMMENT ON COLUMN public.posts.posting_status IS 'Tracks whether the post has been published to the social media platform';
COMMENT ON COLUMN public.posts.posted_at IS 'Timestamp when the post was successfully published';
COMMENT ON COLUMN public.posts.posting_error IS 'Error message if posting failed';
COMMENT ON COLUMN public.posts.external_post_id IS 'Platform-specific post ID for reference';