-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Create dashboard sections enum  
CREATE TYPE public.dashboard_section AS ENUM ('whatsapp_reports', 'productivity_reports', 'ads_reports', 'mail_reports', 'bot_controls');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create section permissions table
CREATE TABLE public.section_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  section dashboard_section NOT NULL,
  can_access BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE(user_id, section)
);

-- Create reports storage table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  section dashboard_section NOT NULL,
  report_date DATE NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text', -- 'text' or 'html'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE(section, report_date)
);

-- Create bot status table
CREATE TABLE public.bot_status (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  bot_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id),
  PRIMARY KEY (id),
  UNIQUE(bot_name)
);

-- Insert default bot statuses
INSERT INTO public.bot_status (bot_name, is_active) VALUES 
('whatsapp_sales_bot', false),
('messenger_bot', false),
('instagram_bot', false);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_status ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Create function to check section access
CREATE OR REPLACE FUNCTION public.can_access_section(user_id UUID, section_name dashboard_section)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT can_access FROM public.section_permissions 
     WHERE user_id = $1 AND section = $2),
    false
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for section permissions
CREATE POLICY "Users can view their own permissions"
  ON public.section_permissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all permissions"
  ON public.section_permissions FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for reports
CREATE POLICY "Users can view reports for sections they have access to"
  ON public.reports FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'admin' OR
    public.can_access_section(auth.uid(), section)
  );

CREATE POLICY "Admins can manage all reports"
  ON public.reports FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for bot status
CREATE POLICY "Users can view bot status if they have bot_controls access"
  ON public.bot_status FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'admin' OR
    public.can_access_section(auth.uid(), 'bot_controls')
  );

CREATE POLICY "Admins can manage bot status"
  ON public.bot_status FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Create function to handle new user registration (for admin use)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();