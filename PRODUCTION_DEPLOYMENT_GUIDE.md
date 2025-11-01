# Production Deployment Guide

## 🎉 Code Successfully Pushed to GitHub!

Both repositories have been updated:
- ✅ **report-viewer-plus**: https://github.com/Alsenosy2024/report-viewer-plus
- ✅ **PE-live-ai-agent**: https://github.com/karem505/PE-live-ai-agent

Now let's deploy everything to production!

---

## 📋 Deployment Checklist

Follow these steps in order:

### ✅ Step 1: Deploy Database Migration (Supabase) - 5 minutes

### ✅ Step 2: Deploy Edge Function (Supabase) - 5 minutes

### ✅ Step 3: Deploy Agent (Railway) - 10 minutes

### ✅ Step 4: Frontend Auto-Deploys (Lovable) - Automatic

### ✅ Step 5: Verify Deployment - 10 minutes

**Total Time**: ~30 minutes

---

## Step 1: Deploy Database Migration to Supabase

### 1.1 Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/flojlnzqivsziumuebgy/editor
2. Click **"New query"** button

### 1.2 Copy Migration SQL

Open this file on your computer:
```
D:\report-viewer-plus\supabase\migrations\20251101_create_voice_conversations.sql
```

Or copy from here:
```sql
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
```

### 1.3 Run Migration

1. Paste the SQL into the editor
2. Click **"Run"** button (or press Ctrl+Enter)
3. You should see: **"Success. No rows returned"**
4. Verify table created:
   - Go to Table Editor: https://supabase.com/dashboard/project/flojlnzqivsziumuebgy/editor
   - You should see **"voice_conversations"** table

---

## Step 2: Deploy Edge Function to Supabase

### 2.1 Open Edge Functions

1. Go to: https://supabase.com/dashboard/project/flojlnzqivsziumuebgy/functions
2. Click **"Create a new function"** button

### 2.2 Create Function

1. **Function name**: `livekit-token`
2. Click **"Create function"**

### 2.3 Add Function Code

Open this file on your computer:
```
D:\report-viewer-plus\supabase\functions\livekit-token\index.ts
```

Or copy the code from here: https://github.com/Alsenosy2024/report-viewer-plus/blob/main/supabase/functions/livekit-token/index.ts

1. Delete the template code
2. Paste the LiveKit token function code
3. Click **"Deploy function"**

### 2.4 Set Environment Variables

1. Go to: https://supabase.com/dashboard/project/flojlnzqivsziumuebgy/settings/functions
2. Click **"Add environment variable"**
3. Add these three variables:

| Name | Value |
|------|-------|
| `LIVEKIT_URL` | Your LiveKit URL (e.g., `wss://your-project.livekit.cloud`) |
| `LIVEKIT_API_KEY` | Your LiveKit API Key |
| `LIVEKIT_API_SECRET` | Your LiveKit API Secret |

4. Click **"Save"** for each variable

### 2.5 Test Function

1. Go back to Functions: https://supabase.com/dashboard/project/flojlnzqivsziumuebgy/functions
2. Click on **"livekit-token"** function
3. Click **"Invoke function"** button
4. Use this test payload:
```json
{
  "roomName": "test-room",
  "participantName": "test-user"
}
```
5. You should get a response with a `token` field

---

## Step 3: Deploy Agent to Railway

### 3.1 Create Railway Account (if needed)

1. Go to: https://railway.app/
2. Sign up with GitHub (recommended)

### 3.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose: **karem505/PE-live-ai-agent**
4. Railway will auto-detect Python and start building

### 3.3 Configure Environment Variables

1. Click on your deployed service
2. Go to **"Variables"** tab
3. Click **"New Variable"** and add these:

| Variable | Value |
|----------|-------|
| `LIVEKIT_URL` | Your LiveKit WebSocket URL from cloud.livekit.io |
| `LIVEKIT_API_KEY` | Your LiveKit API key |
| `LIVEKIT_API_SECRET` | Your LiveKit API secret |
| `OPENAI_API_KEY` | Your OpenAI API key (starts with sk-proj-...) |
| `DEEPGRAM_API_KEY` | Your Deepgram API key (optional) |
| `TAVUS_API_KEY` | Your Tavus API key (optional for video avatar) |
| `TAVUS_REPLICA_ID` | Your Tavus replica ID (optional) |
| `TAVUS_PERSONA_ID` | Your Tavus persona ID (optional) |
| `MCP_SERVER_URL` | Your MCP database server URL |
| `MCP_SERVER_NAME` | `My Database` |
| `AGENT_NAME` | `Voice AI Agent` |

**Note:** Get your actual credentials from:
- LiveKit: https://cloud.livekit.io/
- OpenAI: https://platform.openai.com/api-keys
- Deepgram: https://console.deepgram.com/
- Tavus: https://tavus.io/ (optional - for video avatar)
- MCP Server: Your database MCP server URL

### 3.4 Configure Start Command

1. Go to **"Settings"** tab
2. Find **"Start Command"**
3. Set it to: `python agent.py start`
4. Click **"Save"**

### 3.5 Deploy

1. Railway will automatically redeploy with new variables
2. Wait for deployment to complete (green checkmark)
3. Agent will start running automatically
4. Check logs to verify it's working:
   - Go to **"Deployments"** tab
   - Click on latest deployment
   - View logs - should see "Voice agent session started successfully"

---

## Step 4: Frontend Deployment (Automatic)

### Lovable Auto-Deploy

Your frontend is hosted on Lovable and will automatically deploy when you push to GitHub!

1. Go to: https://lovable.dev/ (or your Lovable dashboard)
2. Find your **"report-viewer-plus"** project
3. Check deployment status
4. Lovable should detect the new commits and auto-deploy
5. Wait for deployment to complete (~2-5 minutes)

**Frontend URL**: Check your Lovable dashboard for the production URL

### If Auto-Deploy Doesn't Work

1. Go to Lovable dashboard
2. Click **"Deploy"** manually
3. Or use **"Share → Publish"** option

---

## Step 5: Verify Production Deployment

### 5.1 Test Frontend

1. Open your production URL (from Lovable)
2. Log in to your account
3. You should see:
   - ✅ Floating microphone button (bottom-right corner)
   - ✅ No console errors (press F12 → Console tab)

### 5.2 Test Voice Assistant

1. Click the floating microphone button
2. Modal should open showing "Connecting to assistant..."
3. Wait 2-5 seconds
4. You should see:
   - ✅ "Connected" status or video avatar
   - ✅ No error messages

### 5.3 Test Voice Interaction

1. Click microphone and speak: **"Hello"** or **"مرحباً"**
2. Agent should respond with voice
3. Transcript should show in conversation history
4. Test language switch:
   - Click globe icon
   - Say: "What's today's date?"
   - Agent should respond in English

### 5.4 Test MCP Database Queries

Try these voice commands:
1. **"Show me today's WhatsApp reports"**
   - Should query MCP database
   - Should display results in Arabic or English

2. **"What's the team productivity?"**
   - Should query performance tool
   - Should show metrics

3. **"Open dashboard"**
   - Should acknowledge navigation request
   - (Frontend navigation handled separately)

### 5.5 Test Conversation History

1. Have a conversation with agent
2. Click **"End Call"** button
3. Check Supabase:
   - Go to: https://supabase.com/dashboard/project/flojlnzqivsziumuebgy/editor
   - Open **voice_conversations** table
   - You should see your conversation saved with:
     - user_id
     - transcript (JSON)
     - language
     - timestamps

---

## 🎯 Success Criteria

All these should work:

- [x] Database table created with RLS policies
- [x] Edge Function deployed and returns tokens
- [x] Agent running on Railway (check logs)
- [x] Frontend deployed on Lovable
- [x] Floating button appears
- [x] Can connect to voice assistant
- [x] Voice input/output works
- [x] Avatar video displays (if Tavus is working)
- [x] MCP database queries work
- [x] Language switching works
- [x] Conversations save to database
- [x] No console errors

---

## 🔧 Troubleshooting

### Frontend doesn't show floating button

**Check:**
1. Hard refresh: Ctrl+F5
2. Clear browser cache
3. Check console for errors (F12 → Console)
4. Verify deployment completed on Lovable

### "Failed to connect to voice assistant"

**Check:**
1. Edge Function deployed correctly
2. Environment variables set in Supabase
3. Test Edge Function directly (Step 2.5)

### Agent doesn't respond

**Check:**
1. Railway deployment status (green checkmark)
2. Agent logs in Railway (should show "connected")
3. Environment variables set correctly
4. MCP_SERVER_URL is accessible

### No video avatar

**Check:**
1. Tavus credentials correct
2. Agent is running (Railway logs)
3. Wait 5-10 seconds for avatar to load
4. Avatar may not appear in console mode

### Database queries don't work

**Check:**
1. MCP_SERVER_URL is accessible
2. Agent logs show "MCP tools registered successfully"
3. Database MCP server is running

---

## 📊 Monitoring

### Check Agent Status (Railway)

1. Go to Railway dashboard
2. Click on PE-live-ai-agent service
3. View **"Metrics"** tab:
   - CPU usage
   - Memory usage
   - Request count

### Check Supabase Usage

1. Go to: https://supabase.com/dashboard/project/flojlnzqivsziumuebgy
2. Check **"Database"** → Usage
3. Check **"Functions"** → Invocations

### Check LiveKit Usage

1. Go to: https://cloud.livekit.io/
2. Check active rooms
3. Check participant count
4. Monitor bandwidth usage

---

## 🎉 Deployment Complete!

Once all checks pass, your production deployment is complete!

**Your users can now:**
- Click floating button from any page
- Have voice conversations with AI agent
- Get data from MCP database
- Switch between Arabic and English
- Save conversation history

**Next Steps:**
1. Monitor usage and performance
2. Collect user feedback
3. Iterate and improve
4. Scale as needed

---

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Railway Docs**: https://docs.railway.app/
- **LiveKit Docs**: https://docs.livekit.io/
- **Integration Guide**: See `LIVEKIT_INTEGRATION.md`

---

**Deployment Status**: Ready for production! 🚀
