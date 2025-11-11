# Supabase Edge Function Setup Guide

## Your Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Lovable   │────────▶│ Supabase Edge    │────────▶│   LiveKit    │
│  (Frontend) │         │   Function       │         │     Room     │
└─────────────┘         │ (livekit-token)  │         └──────────────┘
                        └──────────────────┘                │
                                                            │
                        ┌──────────────────┐                │
                        │    Railway       │◀───────────────┘
                        │   (Agent.py)     │
                        └──────────────────┘
```

**Component Roles:**
- **Lovable**: Hosts your React frontend (UI)
- **Supabase**: Backend services (auth, database, Edge Functions)
- **Railway**: Runs your Python voice agent
- **LiveKit**: Communication layer (audio/data channels)

## Current Issue

Your voice assistant can't connect because the **Supabase Edge Function needs LiveKit credentials**.

## Step-by-Step Setup

### Step 1: Get Your LiveKit Credentials

1. Go to **LiveKit Cloud Dashboard**: https://cloud.livekit.io/
2. Select your project or create a new one
3. Go to **Settings** → **Keys**
4. Copy these values:
   - `WebSocket URL` (e.g., `wss://your-project.livekit.cloud`)
   - `API Key` (e.g., `APIxxxxxxxxxx`)
   - `API Secret` (long secret key)

### Step 2: Configure Supabase Edge Function

1. **Go to Supabase Dashboard**:
   - URL: https://supabase.com/dashboard/project/flojlnzqivsziumuebgy

2. **Navigate to Edge Functions**:
   - Click **Edge Functions** in the left sidebar
   - Find your `livekit-token` function

3. **Set Environment Variables**:
   - Click **Settings** or **Configuration**
   - Add these environment variables:

   ```env
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=APIxxxxxxxxxx
   LIVEKIT_API_SECRET=your_secret_key_here
   ```

   **Important**: Use the exact values from LiveKit Cloud (Step 1)

4. **Save and Redeploy**:
   - Click **Save**
   - The function will automatically redeploy
   - Wait for deployment to complete (usually 10-30 seconds)

### Step 3: Verify Edge Function Code

Your Edge Function should look like this:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AccessToken } from "npm:livekit-server-sdk@2.7.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { roomName, participantName } = await req.json();

    // Get LiveKit credentials from environment
    const livekitUrl = Deno.env.get('LIVEKIT_URL');
    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');

    if (!livekitUrl || !apiKey || !apiSecret) {
      console.error('[LiveKit] Missing credentials:', {
        hasUrl: !!livekitUrl,
        hasKey: !!apiKey,
        hasSecret: !!apiSecret
      });
      throw new Error('LiveKit credentials not configured');
    }

    console.log('[LiveKit] Generating token for:', {
      identity: participantName || user.id,
      roomName: roomName || 'voice-assistant'
    });

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName || user.id,
      name: participantName || user.email || 'User'
    });

    // Grant permissions
    at.addGrant({
      roomJoin: true,
      room: roomName || 'voice-assistant',
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    // Generate JWT token
    const token = await at.toJwt();

    return new Response(JSON.stringify({
      token,
      url: livekitUrl,
      roomName: roomName || 'voice-assistant'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('[LiveKit] Error:', error);

    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
```

### Step 4: Configure Railway Agent

Make sure your Railway agent can connect to the **same LiveKit server**:

1. **Go to Railway Dashboard**: https://railway.app/
2. **Select your agent project**
3. **Add Environment Variables**:

   ```env
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=APIxxxxxxxxxx
   LIVEKIT_API_SECRET=your_secret_key_here
   OPENAI_API_KEY=sk-...
   ```

   **Important**: Use the **exact same** LiveKit credentials as Supabase

4. **Redeploy if needed**

### Step 5: Test the Connection

1. **Test Edge Function Directly** (via Supabase Dashboard):
   - Go to Edge Functions → livekit-token
   - Click **Invoke** button
   - Add test payload:
     ```json
     {
       "roomName": "test-room",
       "participantName": "Test User"
     }
     ```
   - Click **Run**
   - Should return: `{ "token": "...", "url": "wss://...", "roomName": "test-room" }`

2. **Test from Frontend**:
   - Open your Lovable app
   - Log in with Supabase auth
   - Click the voice assistant button (floating mic icon)
   - Check browser console (F12)
   - Should see:
     ```
     [LiveKit] Requesting token from Supabase Edge Function
     [LiveKit] ✅ Token generated successfully
     [VoiceAssistant] ✅✅✅ Connected to LiveKit room!
     ```

3. **Verify Agent Connection** (via Railway Logs):
   - Go to Railway dashboard
   - Click on your agent service
   - View **Logs**
   - Should see agent connected to LiveKit room
   - Should see the same room name as frontend

## Troubleshooting

### Issue 1: "LiveKit credentials not configured"

**Problem**: Edge Function can't find environment variables

**Solution**:
1. Check Supabase Dashboard → Edge Functions → Settings
2. Verify all three variables are set:
   - `LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
3. Values must not have quotes or spaces
4. Redeploy the function after adding variables

**How to check**:
- Go to Edge Functions → livekit-token
- Click **Invoke** button
- If it fails with this error, variables are missing

### Issue 2: "Unauthorized"

**Problem**: User not logged in or invalid auth token

**Solution**:
1. Make sure you're logged in to the frontend
2. Check Supabase auth session is active
3. Clear browser cookies and log in again
4. Check console for auth errors

**How to check**:
- Open browser console (F12)
- Look for: `[LiveKit] Edge Function error: Unauthorized`

### Issue 3: "Failed to connect to voice assistant"

**Problem**: Multiple possible causes

**Solution**:
1. **Check Edge Function Logs**:
   - Supabase Dashboard → Edge Functions → livekit-token
   - Click **Logs** tab
   - Look for error messages

2. **Check Frontend Console**:
   - Open browser console (F12)
   - Look for errors starting with `[LiveKit]`
   - Common errors:
     - Missing credentials
     - Invalid token
     - Network issues

3. **Verify Room Names Match**:
   - Frontend: `voice-assistant-{userId}`
   - Agent: Should connect to same room
   - Check Railway logs for room name

### Issue 4: Agent not responding

**Problem**: Agent not in the same LiveKit room

**Solution**:
1. **Check Railway Agent Logs**:
   - Look for: "Connected to room: voice-assistant-..."
   - Room name must match frontend room

2. **Verify LiveKit Credentials Match**:
   - Supabase Edge Function and Railway must use **same** credentials
   - Check URL, API key, and secret match exactly

3. **Check Agent Status**:
   - Railway logs should show agent is running
   - Look for: "Agent started" or similar message

### Issue 5: "Invalid response from token service"

**Problem**: Edge Function returns wrong format

**Solution**:
1. Test Edge Function directly in Supabase Dashboard
2. Response should be:
   ```json
   {
     "token": "eyJ...",
     "url": "wss://...",
     "roomName": "..."
   }
   ```
3. If different format, check Edge Function code

## Testing Checklist

- [ ] LiveKit credentials obtained from LiveKit Cloud
- [ ] Supabase Edge Function environment variables configured
- [ ] Edge Function redeployed successfully
- [ ] Edge Function test in dashboard returns token
- [ ] Railway agent has same LiveKit credentials
- [ ] Railway agent is running (check logs)
- [ ] Frontend user is logged in
- [ ] Frontend voice assistant button appears
- [ ] Browser console shows token generation success
- [ ] Browser console shows LiveKit room connection
- [ ] Agent logs show same room name as frontend
- [ ] Can speak and see visualizer animate
- [ ] Transcriptions appear in real-time

## Environment Variables Reference

### Supabase Edge Function (Required)

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxx
LIVEKIT_API_SECRET=your_secret_key_here
```

**Where to configure**: Supabase Dashboard → Edge Functions → Settings

### Railway Agent (Required)

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxx
LIVEKIT_API_SECRET=your_secret_key_here
OPENAI_API_KEY=sk-...
```

**Where to configure**: Railway Dashboard → Your Service → Variables

### Frontend (Already configured via Supabase)

```env
VITE_SUPABASE_PROJECT_ID=flojlnzqivsziumuebgy
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_URL=https://flojlnzqivsziumuebgy.supabase.co
```

**Where to configure**: Lovable project settings or `.env` file

## How to Edit the Edge Function

### Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/flojlnzqivsziumuebgy/functions
2. Click on `livekit-token`
3. Click **Edit** button
4. Make changes in the editor
5. Click **Deploy** to save

### Via Supabase CLI

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref flojlnzqivsziumuebgy

# Pull the function
supabase functions pull livekit-token

# Edit locally
# File: supabase/functions/livekit-token/index.ts

# Deploy changes
supabase functions deploy livekit-token
```

## Next Steps

1. **Configure Supabase Edge Function** (Step 2 above)
2. **Test Edge Function** (Step 5.1 above)
3. **Verify Railway Agent** (Step 4 above)
4. **Test Full Flow** (Step 5.2 and 5.3 above)

Once all steps are complete, your voice assistant will connect successfully!

## Support

If you're still having issues:

1. **Check Edge Function Logs**: Supabase Dashboard → Edge Functions → livekit-token → Logs
2. **Check Railway Agent Logs**: Railway Dashboard → Your Service → Logs
3. **Check Browser Console**: F12 → Console tab → Look for [LiveKit] messages
4. **Verify Credentials Match**: Both Supabase and Railway must use exact same LiveKit credentials

The most common issue is **missing or incorrect LiveKit credentials** in the Supabase Edge Function environment variables.
