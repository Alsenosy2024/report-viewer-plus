-- Create table to store weekly analyses
CREATE TABLE public.weekly_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start date NOT NULL UNIQUE,
  analysis_data jsonb NOT NULL,
  reports_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all weekly analyses" 
ON public.weekly_analyses 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can view weekly analyses if they have access to any section" 
ON public.weekly_analyses 
FOR SELECT 
USING (
  (get_user_role(auth.uid()) = 'admin'::user_role) OR 
  (EXISTS (
    SELECT 1 FROM public.section_permissions 
    WHERE user_id = auth.uid() AND can_access = true
  ))
);

-- Add trigger for timestamps
CREATE TRIGGER update_weekly_analyses_updated_at
BEFORE UPDATE ON public.weekly_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();