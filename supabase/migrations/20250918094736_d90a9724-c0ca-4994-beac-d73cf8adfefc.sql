-- Enable Row Level Security on courses prices table
ALTER TABLE public."courses prices" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all courses
CREATE POLICY "Anyone can view courses" 
ON public."courses prices" 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert courses
CREATE POLICY "Authenticated users can create courses" 
ON public."courses prices" 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update courses
CREATE POLICY "Authenticated users can update courses" 
ON public."courses prices" 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete courses
CREATE POLICY "Authenticated users can delete courses" 
ON public."courses prices" 
FOR DELETE 
USING (auth.uid() IS NOT NULL);