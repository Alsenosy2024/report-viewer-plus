-- Create voice_conversations table for storing AI assistant conversation history
CREATE TABLE IF NOT EXISTS voice_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    room_name TEXT NOT NULL,
    participant_name TEXT,
    transcript JSONB DEFAULT '[]'::jsonb,
    language TEXT DEFAULT 'ar',
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX idx_voice_conversations_user_id ON voice_conversations(user_id);

-- Create index on created_at for sorting
CREATE INDEX idx_voice_conversations_created_at ON voice_conversations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE voice_conversations ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
    ON voice_conversations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy: Users can insert their own conversations
CREATE POLICY "Users can insert own conversations"
    ON voice_conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own conversations
CREATE POLICY "Users can update own conversations"
    ON voice_conversations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy: Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
    ON voice_conversations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_voice_conversations_updated_at
    BEFORE UPDATE ON voice_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
