# 🔧 Quick Fix: Configure LiveKit for Agent Navigation

## The Problem
Your voice assistant is trying to connect but **can't get a LiveKit token** because the Supabase Edge Function doesn't have LiveKit credentials configured.

Console shows:
```
[VoiceAssistant] Requesting token from Supabase Edge Function...
(stuck here - no token returned)
```

---

## ✅ Solution: Configure LiveKit Credentials in Supabase

### Step 1: Get LiveKit Credentials

1. **Go to LiveKit Cloud**: https://cloud.livekit.io/
2. **Sign up or Login**
3. **Create a new project** (or use existing)
4. **Go to Settings → Keys**
5. **Copy these 3 values**:
   - **WebSocket URL**: `wss://your-project.livekit.cloud`
   - **API Key**: `APxxxxxxxxx`
   - **API Secret**: `xxxxxxxxxx`

### Step 2: Add Credentials to Supabase

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `flojlnzqivsziumuebgy`
3. **Go to**: Project Settings → Edge Functions → Secrets (or Environment Variables)
4. **Add these 3 secrets**:

```bash
Name: LIVEKIT_URL
Value: wss://your-project.livekit.cloud

Name: LIVEKIT_API_KEY
Value: APxxxxxxxxx

Name: LIVEKIT_API_SECRET
Value: xxxxxxxxxx
```

5. **Click Save**

### Step 3: Verify Edge Function is Deployed

The function `livekit-token` needs to be deployed. Check:

**In Supabase Dashboard:**
- Go to: Edge Functions
- Look for: `livekit-token`
- Status should be: ✅ Deployed

**If NOT deployed**, deploy it:
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref flojlnzqivsziumuebgy

# Deploy function
supabase functions deploy livekit-token
```

### Step 4: Test the Connection

1. **Refresh your browser**: http://localhost:8080
2. **Click the microphone button** (bottom-right)
3. **Check console** - should now show:
   ```
   [VoiceAssistant] ✅ Token and URL received
   [VoiceAssistant] ✅✅✅ Connected to LiveKit room!
   ```

---

## 🎯 Expected Behavior After Fix

**Before (current):**
- ❌ Stuck at "Requesting token..."
- ❌ No connection established
- ❌ Agent navigation won't work

**After configuration:**
- ✅ Token received successfully
- ✅ Connected to LiveKit room
- ✅ Microphone enabled
- ✅ Agent can navigate pages via voice commands

---

## 🐛 Troubleshooting

### "Still not working after adding credentials"
1. **Wait 1-2 minutes** - Supabase needs to propagate environment variables
2. **Restart the frontend**: Stop server (Ctrl+C) and run `npm run dev` again
3. **Clear browser cache** and refresh
4. **Check Edge Function logs** in Supabase Dashboard

### "Don't have LiveKit account"
**Free tier available!**
- Go to https://cloud.livekit.io/
- Sign up (free)
- Free tier includes: 50GB/month of traffic (plenty for testing)

### "Edge Function not deployed"
Check if the function exists at:
`D:\github\report viewer\supabase\functions\livekit-token\index.ts`

If it doesn't exist, you need to download it from GitHub:
```bash
curl -s "https://raw.githubusercontent.com/Alsenosy2024/report-viewer-plus/d281f306ef1af80a348cdb9074ff2733b0c393c7/supabase/functions/livekit-token/index.ts" > supabase/functions/livekit-token/index.ts
```

---

## 📊 Quick Check

Run in browser console to test token endpoint:
```javascript
supabase.functions.invoke('livekit-token', {
  body: { roomName: 'test', participantName: 'test' }
}).then(r => console.log(r))
```

**Expected response:**
```javascript
{ data: { token: "eyJ...", url: "wss://...", roomName: "test" } }
```

---

## ⚡ Alternative: Use Test Mode (Without Backend Agent)

If you just want to test the **frontend navigation** without voice:

**Open browser console and run:**
```javascript
// Test navigation directly
window.testNav('/dashboard')
window.testNav('/whatsapp-reports')

// Simulate agent sending navigation message
window.testNavMessage({
  type: 'agent-navigation-url',
  pathname: '/dashboard'
})
```

This will trigger the navigation without needing the voice assistant connection.

---

## 📝 Summary

**Root Cause**: Supabase Edge Function missing LiveKit credentials

**Fix**: Add 3 environment variables in Supabase Dashboard
- LIVEKIT_URL
- LIVEKIT_API_KEY
- LIVEKIT_API_SECRET

**Time**: 5-10 minutes to set up LiveKit account and configure

**Cost**: Free tier available

---

**Need help?** Check the console for specific error messages and let me know!
