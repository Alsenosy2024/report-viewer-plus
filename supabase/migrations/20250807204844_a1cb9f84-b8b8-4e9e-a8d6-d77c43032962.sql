-- Add webhook URL for each bot and audit triggers
ALTER TABLE public.bot_status
ADD COLUMN IF NOT EXISTS webhook_url text;

-- Ensure bot names are unique for easier management
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bot_status_unique_name'
  ) THEN
    ALTER TABLE public.bot_status
    ADD CONSTRAINT bot_status_unique_name UNIQUE (bot_name);
  END IF;
END $$;

-- Create or replace trigger function to maintain last_updated and updated_by
CREATE OR REPLACE FUNCTION public.bot_status_set_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_updated := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

-- Create triggers for INSERT and UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'bot_status_set_audit_ins'
  ) THEN
    CREATE TRIGGER bot_status_set_audit_ins
    BEFORE INSERT ON public.bot_status
    FOR EACH ROW
    EXECUTE FUNCTION public.bot_status_set_audit();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'bot_status_set_audit_upd'
  ) THEN
    CREATE TRIGGER bot_status_set_audit_upd
    BEFORE UPDATE ON public.bot_status
    FOR EACH ROW
    EXECUTE FUNCTION public.bot_status_set_audit();
  END IF;
END $$;