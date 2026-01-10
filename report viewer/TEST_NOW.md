# 🧪 Test Your Setup Now!

## ✅ Status Check

- ✅ Frontend code: Complete
- ✅ Edge Function: Deployed and ready
- ✅ LiveKit credentials: **Just configured!**
- ✅ Environment variables: Added to Supabase

**Everything is ready!** Just needs 1-2 minutes for Supabase to propagate the variables.

---

## 🧪 Test 1: Browser Console Test

**Step 1:** Open http://localhost:8080 in your browser

**Step 2:** Make sure you're **logged in** to the app

**Step 3:** Open browser console (Press F12)

**Step 4:** Paste this test command:

```javascript
// Test the Edge Function
supabase.functions.invoke('livekit-token', {
  body: {
    participantName: 'test-user'
  }
}).then(result => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 FULL RESULT:', result);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (result.data && result.data.token) {
    console.log('🎉🎉🎉 SUCCESS! TOKEN RECEIVED! 🎉🎉🎉');
    console.log('');
    console.log('📡 LiveKit URL:', result.data.url);
    console.log('🏠 Room Name:', result.data.roomName);
    console.log('🔑 Token (first 50 chars):', result.data.token.substring(0, 50) + '...');
    console.log('');
    console.log('✅ All systems are GO! Voice assistant is ready!');
    console.log('');
  } else if (result.error) {
    console.error('❌ ERROR DETECTED:', result.error);
    console.error('');
    if (result.error.message === 'LiveKit credentials not configured') {
      console.log('⚠️ Credentials not propagated yet. Wait 1-2 more minutes and try again.');
    } else {
      console.log('⚠️ Check error message above for details.');
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
```

---

## 📊 Expected Results

### ✅ **SUCCESS (What you WANT to see):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 FULL RESULT: {data: {...}, error: null}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉🎉🎉 SUCCESS! TOKEN RECEIVED! 🎉🎉🎉

📡 LiveKit URL: wss://your-project.livekit.cloud
🏠 Room Name: voice-1731759123456-abc123
🔑 Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAi...

✅ All systems are GO! Voice assistant is ready!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### ⏳ **WAIT (Variables not propagated yet):**
```
❌ ERROR DETECTED: LiveKit credentials not configured
⚠️ Credentials not propagated yet. Wait 1-2 more minutes and try again.
```
→ **Action:** Wait 2 minutes and run the test again

### ❌ **ERROR (Wrong credentials):**
```
❌ ERROR DETECTED: Invalid API key or secret
```
→ **Action:** Double-check the credentials in Supabase Dashboard

---

## 🧪 Test 2: Voice Assistant Connection

**Only run this AFTER Test 1 succeeds!**

**Step 1:** Refresh the browser page (Ctrl + R or F5)

**Step 2:** Click the **microphone button** (bottom-right corner, blue circle)

**Step 3:** Watch the console logs - you should see:

```
[VoiceAssistant] Modal opened, checking connection state...
[VoiceAssistant] 🚀 Starting connection process...
[VoiceAssistant] 📡 Requesting token from Supabase Edge Function...
[VoiceAssistant] ⏱️ Token received in XXXms
[VoiceAssistant] ✅ Token and URL received
[VoiceAssistant] ✅✅✅ Connection setup complete
[VoiceAssistant] ✅✅✅ Connected to LiveKit room!
[VoiceAssistant] Room connected, enabling microphone...
[VoiceAssistant] ✅ Got microphone stream
[VoiceAssistant] ✅✅✅ MICROPHONE TRACK PUBLISHED!
```

**Step 4:** The microphone modal should show:
- 🟢 **Green connection indicator** (top-left)
- 🎤 **Microphone button** (unmuted)
- 📞 **End call button**

---

## 🧪 Test 3: Agent Navigation

**Step 1:** Keep the voice assistant connected

**Step 2:** In browser console, test navigation directly:

```javascript
// Test navigation to dashboard
window.testNav('/dashboard')
```

**Expected result:**
- ✅ Browser navigates to dashboard page
- ✅ Console shows: `[Agent Navigation] ✅✅✅ NAVIGATION VERIFIED`
- ✅ Toast notification appears: "Opening Dashboard"

**Step 3:** Test more pages:

```javascript
window.testNav('/whatsapp-reports')
window.testNav('/productivity-reports')
window.testNav('/ads-reports')
```

---

## 🎯 Full Integration Test (With Backend Agent)

**Only if you have the backend agent running!**

**Step 1:** Start backend agent (in new terminal):
```bash
cd "D:\github\report viewer"
python tools.py dev
# or
python agent.py dev
```

**Step 2:** Connect voice assistant (microphone button)

**Step 3:** Speak: **"Show me the dashboard"**

**Expected:**
- ✅ Agent recognizes voice command
- ✅ Agent sends navigation message via data channel
- ✅ Frontend navigates to /dashboard
- ✅ Console shows: `[Agent Navigation] 🎯🎯🎯 NAVIGATION FROM useDataChannel!`

---

## 🐛 Troubleshooting

### **Test 1 Still Fails After 5 Minutes**

**Check environment variable names (case-sensitive!):**
- Must be exactly: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- Not: `LiveKit_URL` or `livekit_url` ❌

**Verify in Supabase Dashboard:**
1. Project Settings → Edge Functions → Secrets
2. You should see 3 entries
3. Names must match exactly

**Check for typos in values:**
- URL must start with `wss://` (not `https://`)
- No extra spaces before/after values
- API Key should start with `AP`

### **Test 2: Voice Assistant Won't Connect**

1. **Make sure Test 1 passed first!**
2. **Hard refresh browser** (Ctrl + Shift + R)
3. **Clear browser cache**:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```
4. **Check you're logged in** - try logout/login

### **Test 3: Navigation Works But No Voice**

This is actually **GOOD**! It means:
- ✅ Frontend navigation is working
- ✅ Code is all correct
- ⏳ Just need to connect the backend agent

**To add voice:**
1. Make sure voice assistant is connected (Test 2 passes)
2. Start backend agent: `python tools.py dev`
3. Agent will join the same LiveKit room
4. Speak commands and they'll trigger navigation!

---

## ✅ Success Criteria

**Minimal Success (Frontend Working):**
- ✅ Test 1 passes (token received)
- ✅ Test 2 passes (voice assistant connects)
- ✅ Test 3 passes (manual navigation works)

**Full Success (With Voice):**
- ✅ All above tests pass
- ✅ Backend agent running
- ✅ Voice commands trigger navigation
- ✅ All navigation tools work

---

## 📝 Summary

**You're at:** Configuration complete! ✅

**Next step:** Run Test 1 in browser console

**Time estimate:**
- Test 1: 30 seconds
- Test 2: 1 minute
- Test 3: 1 minute
- **Total: < 3 minutes** to confirm everything works!

---

**Ready to test?**

1. Wait 1-2 minutes (for Supabase to propagate variables)
2. Open http://localhost:8080
3. Login to the app
4. Open console (F12)
5. Run Test 1 command!

Let me know what you see! 🚀
