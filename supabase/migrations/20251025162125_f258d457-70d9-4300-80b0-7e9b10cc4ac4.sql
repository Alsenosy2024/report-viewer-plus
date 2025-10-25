-- Add meeting_name column to meeting_summaries table
ALTER TABLE meeting_summaries 
ADD COLUMN meeting_name TEXT;

-- Add a default value based on meeting type and created date
UPDATE meeting_summaries 
SET meeting_name = CONCAT(
  INITCAP(meeting_type), 
  ' Meeting - ', 
  TO_CHAR(created_at, 'Mon DD, YYYY')
)
WHERE meeting_name IS NULL;