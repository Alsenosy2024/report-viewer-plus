-- Make meeting-recordings bucket public so recordings can be viewed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'meeting-recordings';