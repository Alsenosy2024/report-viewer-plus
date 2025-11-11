# Using Supabase Edge Function Instead of Railway Backend

## Overview

You have two options for token generation:

1. **Railway Backend** (Current setup) - Flask server on Railway
2. **Supabase Edge Function** (Alternative) - Serverless function on Supabase

## Current Supabase Edge Function

Your existing edge function is located in Supabase Dashboard:
- Function Name: `livekit-token`
- Language: TypeScript (Deno runtime)
- Purpose: Generate LiveKit JWT tokens

### Function Code Review

The current function:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AccessToken } from "npm:livekit-server-sdk@2.7.0";
```

**Features:**
- ✅ CORS handling
- ✅ User authentication check
- ✅ LiveKit token generation
- ✅ Room permissions (join, publish, subscribe, publishData)

**Requirements:**
- User must be authenticated (requires auth header)
- Environment variables: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET

## How to Edit the Edge Function

### Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/flojlnzqivsziumuebgy/functions
2. Click on `livekit-token` function
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

# Edit the file
# File location: supabase/functions/livekit-token/index.ts

# Deploy changes
supabase functions deploy livekit-token
```

## Switching from Railway to Supabase Edge Function

If you want to use the Edge Function instead of Railway backend:

### Step 1: Revert Frontend Token Hook

Edit `src/hooks/useLiveKitToken.ts` back to the original Supabase version:

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LiveKitTokenResponse {
  token: string;
  url: string;
  roomName: string;
}

export const useLiveKitToken = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const getToken = useCallback(async (
    participantName?: string
  ): Promise<LiveKitTokenResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session - please log in');
      }

      // Generate unique room name based on user ID
      const uniqueRoomName = `voice-assistant-${session.user.id}`;

      // Call Supabase Edge Function to generate token
      const { data, error: functionError } = await supabase.functions.invoke(
        'livekit-token',
        {
          body: {
            roomName: uniqueRoomName,
            participantName: participantName || session.user.email,
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (!data || !data.token) {
        throw new Error('Invalid response from token service');
      }

      console.log('[LiveKit] Token generated via Supabase Edge Function', {
        roomName: uniqueRoomName,
        userName: participantName || session.user.email
      });

      setIsLoading(false);
      return data as LiveKitTokenResponse;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);

      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to connect to voice assistant',
        variant: 'destructive',
      });

      console.error('[LiveKit] Token generation error:', error);

      return null;
    }
  }, [toast]);

  return {
    getToken,
    isLoading,
    error,
  };
};
```

### Step 2: Configure Supabase Environment Variables

In Supabase Dashboard → Settings → Edge Functions:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

### Step 3: Remove Railway Environment Variables

Remove from frontend `.env`:
```env
# Remove these if using Supabase Edge Function
VITE_BACKEND_URL=...
VITE_LIVEKIT_URL=...
```

## Comparison: Railway vs Supabase Edge Function

### Railway Backend (Current Setup)

**Pros:**
- ✅ Direct connection to agent
- ✅ No Supabase Edge Function needed
- ✅ Works without Supabase authentication
- ✅ Guest support
- ✅ Full control over server
- ✅ Can run alongside agent

**Cons:**
- ❌ Requires separate Flask server
- ❌ Need to manage Railway deployment
- ❌ Two environment variable configs (frontend + backend)

**Architecture:**
```
Frontend → Railway Flask Server → LiveKit Room ← Railway Agent
```

### Supabase Edge Function (Alternative)

**Pros:**
- ✅ Serverless (no server management)
- ✅ Auto-scaling
- ✅ Integrated with Supabase auth
- ✅ No Flask server needed
- ✅ Free tier available

**Cons:**
- ❌ Requires user authentication
- ❌ No guest support
- ❌ Cold start delays
- ❌ Separate from agent deployment
- ❌ Limited debugging

**Architecture:**
```
Frontend → Supabase Edge Function → LiveKit Room ← Railway Agent
```

## Recommendation

**Stick with Railway Backend** because:

1. **Simpler Architecture**: Everything in one place
2. **Guest Support**: Works without login
3. **Better Integration**: Agent and token server together
4. **Easier Debugging**: Full control and logs

## When to Use Supabase Edge Function

Use Supabase Edge Function if:

- ✅ You want serverless architecture
- ✅ All users are authenticated (no guests)
- ✅ You don't want to manage Flask server
- ✅ You're already using Supabase heavily
- ✅ Agent is deployed separately anyway

## Improving the Supabase Edge Function

If you decide to use the Edge Function, here are improvements:

### Enhancement 1: Remove Authentication Requirement (Optional)

Allow guests to connect:

```typescript
// Get the user (but don't require it)
const { data: { user } } = await supabaseClient.auth.getUser();

// Use user ID if available, otherwise generate random ID
const identity = user?.id || `guest-${Date.now()}`;
const displayName = user?.email || participantName || 'Guest';
```

### Enhancement 2: Better Error Messages

```typescript
catch (error) {
  console.error('[LiveKit Token] Error:', error);

  return new Response(JSON.stringify({
    error: error.message,
    details: 'Check Supabase Edge Function logs for more info'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 400
  });
}
```

### Enhancement 3: Add Logging

```typescript
console.log('[LiveKit Token] Generating token for:', {
  identity: participantName || user.id,
  roomName: roomName || 'voice-assistant',
  timestamp: new Date().toISOString()
});
```

## Testing the Edge Function

### Via Supabase Dashboard

1. Go to Edge Functions → livekit-token
2. Click **Invoke**
3. Add test payload:
   ```json
   {
     "roomName": "test-room",
     "participantName": "Test User"
   }
   ```
4. Click **Run**
5. Check response

### Via Frontend

1. Log in to your app
2. Open voice assistant
3. Check browser console for logs
4. Should see token generation messages

### Via curl

```bash
# Get your auth token from browser (Application → Storage → Supabase)
curl -X POST \
  https://flojlnzqivsziumuebgy.supabase.co/functions/v1/livekit-token \
  -H "Authorization: Bearer YOUR_SUPABASE_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "test-room",
    "participantName": "Test User"
  }'
```

## Final Recommendation

**Continue using Railway backend** - it's simpler and more flexible for your use case. Only switch to Supabase Edge Function if you have a specific reason (e.g., want fully serverless architecture).
