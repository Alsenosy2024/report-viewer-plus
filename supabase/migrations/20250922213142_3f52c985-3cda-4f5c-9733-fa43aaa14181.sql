-- Create n8n_dashboards table for storing HTML dashboards from n8n workflows
CREATE TABLE public.n8n_dashboards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_name text NOT NULL DEFAULT 'Smart Dashboard',
  html_content text NOT NULL,
  workflow_id text,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_by_workflow text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.n8n_dashboards ENABLE ROW LEVEL SECURITY;

-- Create policies for dashboard access
CREATE POLICY "Admins can manage all n8n dashboards" 
ON public.n8n_dashboards 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Users can view n8n dashboards if they have access to any section" 
ON public.n8n_dashboards 
FOR SELECT 
USING (
  (get_user_role(auth.uid()) = 'admin'::user_role) OR 
  (EXISTS (
    SELECT 1 FROM section_permissions 
    WHERE section_permissions.user_id = auth.uid() 
    AND section_permissions.can_access = true
  ))
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_n8n_dashboards_updated_at
BEFORE UPDATE ON public.n8n_dashboards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_n8n_dashboards_active ON public.n8n_dashboards(is_active, created_at DESC);
CREATE INDEX idx_n8n_dashboards_workflow ON public.n8n_dashboards(workflow_id);