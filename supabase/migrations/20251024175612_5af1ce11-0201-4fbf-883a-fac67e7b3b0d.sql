-- Enable realtime for meeting_summaries table
ALTER TABLE meeting_summaries REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_summaries;