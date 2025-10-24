-- Create storage bucket for meeting recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-recordings', 'meeting-recordings', false);

-- Create meeting summaries table
CREATE TABLE IF NOT EXISTS public.meeting_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  meeting_type text NOT NULL CHECK (meeting_type IN ('online', 'offline')),
  recording_url text,
  summary_html text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own meeting summaries"
ON public.meeting_summaries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meeting summaries"
ON public.meeting_summaries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meeting summaries"
ON public.meeting_summaries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meeting summaries"
ON public.meeting_summaries
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all meeting summaries"
ON public.meeting_summaries
FOR SELECT
USING (get_user_role(auth.uid()) = 'admin');

-- Storage policies
CREATE POLICY "Users can upload their own recordings"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'meeting-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own recordings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'meeting-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own recordings"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'meeting-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create trigger for updated_at
CREATE TRIGGER update_meeting_summaries_updated_at
BEFORE UPDATE ON public.meeting_summaries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();