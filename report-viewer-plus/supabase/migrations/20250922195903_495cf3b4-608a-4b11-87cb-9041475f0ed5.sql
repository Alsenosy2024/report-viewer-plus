-- Create table for smart dashboards
CREATE TABLE IF NOT EXISTS public.smart_dashboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_generated DATE NOT NULL,
  html_content TEXT NOT NULL,
  analysis_data JSONB NOT NULL DEFAULT '{}',
  reports_analyzed INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.smart_dashboards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all smart dashboards" 
ON public.smart_dashboards 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can view smart dashboards if they have access to any section" 
ON public.smart_dashboards 
FOR SELECT 
USING ((get_user_role(auth.uid()) = 'admin'::user_role) OR (EXISTS ( 
  SELECT 1
  FROM section_permissions
  WHERE ((section_permissions.user_id = auth.uid()) AND (section_permissions.can_access = true))
)));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_smart_dashboards_updated_at
BEFORE UPDATE ON public.smart_dashboards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_smart_dashboards_date ON public.smart_dashboards(date_generated DESC);