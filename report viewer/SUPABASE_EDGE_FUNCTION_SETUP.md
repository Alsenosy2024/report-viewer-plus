# 🔧 Supabase Edge Function Setup Guide

## ✅ Edge Function Downloaded

The `livekit-token` Edge Function has been successfully downloaded to:
```
D:\github\report viewer\supabase\functions\livekit-token\index.ts
```

---

## 📋 Step-by-Step Setup

### **Step 1: Check if Edge Function is Already Deployed**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `flojlnzqivsziumuebgy`
3. **Navigate to**: Edge Functions (in the left sidebar)
4. **Look for**: `livekit-token` function

**If you see it listed:**
- ✅ Function is deployed
- Skip to **Step 3** (Configure Environment Variables)

**If you DON'T see it:**
- ❌ Function not deployed yet
- Continue to **Step 2** (Deploy the function)

---

### **Step 2: Deploy the Edge Function**

#### **Option A: Deploy via Supabase Dashboard (Easiest)**

1. In Supabase Dashboard → **Edge Functions**
2. Click **"New Function"** or **"Deploy Function"**
3. **Function name**: `livekit-token`
4. **Copy and paste** the code from: `D:\github\report viewer\supabase\functions\livekit-token\index.ts`
5. Click **"Deploy"**

#### **Option B: Deploy via Supabase CLI**

If you prefer using the CLI:

**Install Supabase CLI:**
```bash
npm install -g supabase
```

**Deploy the function:**
```bash
cd "D:\github\report viewer"

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref flojlnzqivsziumuebgy

# Deploy the function
supabase functions deploy livekit-token
```

---

### **Step 3: Get LiveKit Credentials**

**Good news!** I noticed you already have **LiveKit CLI installed** on your system!

#### **Check if you have LiveKit credentials:**

1. **Go to**: https://cloud.livekit.io/
2. **Login** to your account
3. **Navigate to**: Settings → Keys (or Projects → Your Project → Settings)
4. **Copy these 3 values**:

```
LIVEKIT_URL:        wss://your-project.livekit.cloud
LIVEKIT_API_KEY:    APxxxxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### **If you don't have a LiveKit account:**

1. **Sign up** at: https://cloud.livekit.io/ (Free tier available)
2. **Create a new project**
3. **Get credentials** from Settings → Keys

---

### **Step 4: Add Environment Variables to Supabase**

**This is the CRITICAL step** - without these, the function can't generate tokens!

1. **In Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `flojlnzqivsziumuebgy`
3. **Go to**: Project Settings → Edge Functions → **Secrets** (or **Environment Variables**)
4. **Add these 3 secrets** one by one:

**Secret 1:**
```
Name:  LIVEKIT_URL
Value: wss://your-project.livekit.cloud
```

**Secret 2:**
```
Name:  LIVEKIT_API_KEY
Value: APxxxxxxxxxxxxxxxxxx
```

**Secret 3:**
```
Name:  LIVEKIT_API_SECRET
Value: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

5. **Click "Save"** for each one

**⚠️ Important Notes:**
- The URL should start with `wss://` (not `https://`)
- API Key typically starts with `AP`
- Keep the API Secret private!
- Wait 1-2 minutes after saving for Supabase to propagate the variables

---

### **Step 5: Verify the Setup**

#### **Test the Edge Function:**

1. **Open your browser console** (F12) on http://localhost:8080
2. **Make sure you're logged in** to the app
3. **Run this command**:

```javascript
// Test the token endpoint
supabase.functions.invoke('livekit-token', {
  body: {
    roomName: 'test-room',
    participantName: 'test-user'
  }
}).then(result => {
  console.log('✅ Function Response:', result);
  if (result.data && result.data.token) {
    console.log('🎉 SUCCESS! Token received:', result.data.token.substring(0, 50) + '...');
    console.log('📡 LiveKit URL:', result.data.url);
    console.log('🏠 Room Name:', result.data.roomName);
  } else if (result.error) {
    console.error('❌ ERROR:', result.error);
  }
});
```

#### **Expected Success Response:**
```javascript
✅ Function Response: {
  data: {
    token: "eyJhbGciOiJIUzI1NiIsInR...",
    url: "wss://your-project.livekit.cloud",
    roomName: "test-room"
  }
}
🎉 SUCCESS! Token received: eyJhbGciOiJIUzI1NiIsInR...
📡 LiveKit URL: wss://your-project.livekit.cloud
🏠 Room Name: test-room
```

#### **Possible Errors:**

**Error: "No authorization header"**
- → You're not logged in. Login to the app first.

**Error: "LiveKit credentials not configured"**
- → Environment variables not set in Supabase
- → Go back to Step 4 and add the secrets
- → Wait 1-2 minutes and try again

**Error: "Function not found"**
- → Edge Function not deployed
- → Go back to Step 2 and deploy it

**Error: "Invalid token signature" or "Unauthorized"**
- → Check your LiveKit API Key and Secret are correct
- → Verify no extra spaces in the environment variables

---

### **Step 6: Test Voice Assistant Connection**

Once the Edge Function test passes:

1. **Refresh your browser**: http://localhost:8080
2. **Click the microphone button** (bottom-right corner)
3. **Watch the console** - you should see:

```
[VoiceAssistant] Requesting token from Supabase Edge Function...
[VoiceAssistant] ✅ Token and URL received
[VoiceAssistant] ✅✅✅ Connected to LiveKit room!
[VoiceAssistant] ✅ Microphone track published!
```

4. **The modal should show**: Connection status indicator turns green

---

### **Step 7: Test Agent Navigation (Optional)**

If you want to test with the backend agent:

1. **Start the backend** (in a new terminal):
```bash
cd "D:\github\report viewer"
python tools.py dev
# or
python agent.py dev
```

2. **Speak to the agent**: "Show me the dashboard"
3. **Watch the magic happen!** 🎉

---

## 🔍 Troubleshooting

### **"Still can't connect after adding credentials"**

1. **Wait 2-3 minutes** - Supabase needs time to propagate environment variables
2. **Hard refresh** the browser (Ctrl + Shift + R)
3. **Clear localStorage**:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
4. **Check Supabase Edge Function logs**:
   - Dashboard → Edge Functions → livekit-token → Logs
   - Look for errors

### **"How do I know if environment variables are set?"**

Unfortunately, Supabase Dashboard doesn't show the values (for security).
But you can check if they're there:
- Dashboard → Project Settings → Edge Functions → Secrets
- You should see 3 entries (but values will be hidden)

### **"Function works in test but not in app"**

Check these:
1. **Are you logged in?** The function requires authentication
2. **Check browser console** for error messages
3. **Try logout and login** again
4. **Verify useLiveKitToken hook** is calling the function correctly

---

## 📊 Quick Reference

**Your Supabase Project:**
- Project ID: `flojlnzqivsziumuebgy`
- URL: `https://flojlnzqivsziumuebgy.supabase.co`
- Dashboard: https://supabase.com/dashboard

**Edge Function:**
- Name: `livekit-token`
- Local path: `D:\github\report viewer\supabase\functions\livekit-token\index.ts`
- Endpoint: `https://flojlnzqivsziumuebgy.supabase.co/functions/v1/livekit-token`

**Required Environment Variables:**
- ✅ `LIVEKIT_URL` (wss://...)
- ✅ `LIVEKIT_API_KEY` (APxxxx...)
- ✅ `LIVEKIT_API_SECRET` (xxxxxxxx...)

---

## ✨ Summary

1. ✅ Edge Function file downloaded
2. ⏳ Check if deployed in Dashboard
3. ⏳ Deploy if not already deployed
4. ⏳ Get LiveKit credentials (you may already have them!)
5. ⏳ Add 3 environment variables in Supabase
6. ⏳ Test with browser console command
7. ⏳ Test voice assistant connection
8. 🎉 Enjoy agent navigation!

---

**Next Step:** Go to https://supabase.com/dashboard and check if the function is deployed!

Let me know when you've added the environment variables and we'll test it together! 🚀
