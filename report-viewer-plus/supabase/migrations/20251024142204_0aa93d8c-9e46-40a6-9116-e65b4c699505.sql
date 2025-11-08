-- Ensure meeting-recordings bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-recordings', 'meeting-recordings', false)
ON CONFLICT (id) DO NOTHING;