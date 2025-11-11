# Railway Backend Connection Guide

## Overview

This guide explains how to connect the frontend voice assistant to your Railway-hosted backend agent.

## Architecture

```
Frontend (report-viewer-plus) → Railway Backend (Flask server) → LiveKit Room ← Backend Agent
```

1. **Frontend** requests a token from Railway backend
2. **Railway Backend** generates LiveKit token using Flask server (`server.py`)
3. **Frontend** connects to LiveKit room with token
4. **Backend Agent** is already connected to the same LiveKit room
5. **Communication** happens through LiveKit's data channels and audio tracks

## Prerequisites

### 1. Railway Backend Setup

Your Railway backend should have:

- ✅ `agent.py` - Voice agent running
- ✅ `server.py` - Flask server for token generation
- ✅ Environment variables configured:
  - `LIVEKIT_URL` - Your LiveKit server URL
  - `LIVEKIT_API_KEY` - Your LiveKit API key
  - `LIVEKIT_API_SECRET` - Your LiveKit API secret
  - `OPENAI_API_KEY` - OpenAI API key
  - Other optional variables (MCP, etc.)

### 2. Railway Deployment

Make sure both services are running on Railway:

**Option A: Single Service (Recommended)**
- Deploy both agent and Flask server together
- Run agent with: `python agent.py dev` or `python agent.py start`
- Run Flask server separately or as part of the agent startup

**Option B: Separate Services**
- Deploy Flask server as one service
- Deploy agent as another service
- Both need access to the same LiveKit credentials

### 3. Flask Server Port

The Flask server runs on port **5001** by default. Make sure Railway exposes this port publicly.

## Frontend Configuration

### Step 1: Get Your Railway URLs

1. Go to your Railway dashboard
2. Find your deployed backend service
3. Copy the public URL (e.g., `https://your-app-name.up.railway.app`)

### Step 2: Get Your LiveKit URL

From your LiveKit Cloud dashboard or self-hosted server:
- WebSocket URL format: `wss://your-project.livekit.cloud`

### Step 3: Update Frontend Environment Variables

Edit `D:\livekit\temp_report_viewer_plus\.env`:

```env
# Existing Supabase config (keep as is)
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_key"
VITE_SUPABASE_URL="https://your-project.supabase.co"

# NEW: Add these for Railway connection
VITE_BACKEND_URL="https://your-railway-app.up.railway.app"
VITE_LIVEKIT_URL="wss://your-project.livekit.cloud"
```

**Important**: Replace the placeholder values with your actual URLs.

## Testing the Connection

### 1. Verify Backend is Running

Test the Flask server endpoint:

```bash
curl https://your-railway-app.up.railway.app/getToken?name=TestUser&room=test-room
```

You should receive a JWT token string.

### 2. Start Frontend

```bash
cd D:\livekit\temp_report_viewer_plus
npm run dev
```

### 3. Open Voice Assistant

1. Navigate to `http://localhost:5173`
2. Log in with your Supabase account
3. Click the floating microphone button (bottom-right corner)
4. Watch the console for connection logs

### 4. Expected Console Output

**Success:**
```
[LiveKit] Token generated successfully {roomName: "voice-assistant-...", userName: "...", backendUrl: "..."}
[VoiceAssistant] ✅✅✅ Connected to LiveKit room!
[VoiceAssistant] Room connected, enabling microphone...
[VoiceAssistant] ✅ Got microphone stream: [MediaStreamTrack]
[VoiceAssistant] ✅✅✅ MICROPHONE TRACK PUBLISHED!
```

**Failure:**
```
[LiveKit] Token generation error: VITE_BACKEND_URL not configured
```
or
```
[LiveKit] Token generation error: Token generation failed: 404 Not Found
```

## Troubleshooting

### Issue 1: "VITE_BACKEND_URL not configured"

**Problem**: Environment variables not loaded

**Solution**:
1. Verify `.env` file exists in `temp_report_viewer_plus/`
2. Check that variables start with `VITE_` prefix
3. Restart the dev server: `npm run dev`
4. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Issue 2: "Token generation failed: 404 Not Found"

**Problem**: Flask server not running or URL incorrect

**Solution**:
1. Check Railway dashboard - is the service running?
2. Verify the URL is correct (no trailing slash)
3. Test endpoint directly with curl (see step 1 above)
4. Check Railway logs for Flask server startup messages

### Issue 3: "Token generation failed: 500 Internal Server Error"

**Problem**: Backend missing environment variables

**Solution**:
1. Check Railway environment variables:
   - `LIVEKIT_API_KEY` must be set
   - `LIVEKIT_API_SECRET` must be set
2. Restart Railway service after adding variables
3. Check Railway logs for Python errors

### Issue 4: Frontend connects but agent doesn't respond

**Problem**: Agent not running or not in the same room

**Solution**:
1. Check that `agent.py` is running on Railway:
   ```bash
   python agent.py start
   ```
2. Verify agent connects to the same LiveKit URL
3. Check that room names match (both use `voice-assistant-{userId}`)
4. Look for agent connection logs in Railway

### Issue 5: CORS errors in browser console

**Problem**: Flask server CORS not configured properly

**Solution**:
- The Flask server should have `CORS(app, resources={r"/*": {"origins": "*"}})` enabled
- This is already configured in `server.py`
- If still having issues, check Railway network settings

### Issue 6: Microphone not working

**Problem**: Browser permissions or track not publishing

**Solution**:
1. Grant microphone permissions in browser
2. Check console for microphone-related errors
3. Verify `MicrophoneEnabler` is running
4. Look for "MICROPHONE TRACK PUBLISHED" log

## Railway Deployment Checklist

- [ ] Backend agent deployed and running
- [ ] Flask server deployed and accessible
- [ ] Port 5001 exposed publicly
- [ ] Environment variables configured (LiveKit credentials)
- [ ] Agent connects to LiveKit successfully
- [ ] Flask /getToken endpoint returns valid tokens
- [ ] CORS enabled on Flask server

## Frontend Checklist

- [ ] `.env` file created with VITE_BACKEND_URL
- [ ] `.env` file has VITE_LIVEKIT_URL
- [ ] Dev server restarted after env changes
- [ ] Browser refreshed (hard refresh)
- [ ] Console shows successful token generation
- [ ] Voice assistant modal opens
- [ ] Connection status shows green dot

## Advanced: Running Flask Server on Railway

### Option 1: Procfile

Create a `Procfile` in your backend root:

```
web: python server.py
agent: python agent.py start
```

Railway will run both processes.

### Option 2: Single Process

Modify `agent.py` to start Flask server alongside the agent:

```python
import threading
from server import app

def run_flask():
    app.run(host="0.0.0.0", port=5001)

if __name__ == "__main__":
    # Start Flask server in background thread
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    # Start agent
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
```

### Option 3: Separate Railway Services

1. Create two services in Railway:
   - **Service 1**: Flask server (`python server.py`)
   - **Service 2**: Agent (`python agent.py start`)
2. Both services share the same environment variables
3. Flask service URL is used in frontend

## Security Considerations

### Production Deployment

For production, consider:

1. **Restrict CORS Origins**:
   ```python
   CORS(app, resources={
       r"/*": {"origins": ["https://your-frontend-domain.com"]}
   })
   ```

2. **Add Authentication**:
   - Require API key or JWT token for /getToken endpoint
   - Validate user before generating tokens

3. **Rate Limiting**:
   - Limit token generation requests per user
   - Prevent abuse

4. **HTTPS Only**:
   - Railway provides HTTPS by default
   - Ensure all connections use HTTPS/WSS

## Next Steps

Once connected successfully:

1. Test voice commands: "افتح الداشبورد" or "Show WhatsApp reports"
2. Watch the visualizer animate when agent speaks
3. See real-time transcriptions appear
4. Try navigation and DOM interaction commands
5. Monitor Railway logs for agent activity

## Support

If you're still having connection issues:

1. Check Railway logs: `railway logs` or via dashboard
2. Check browser console: F12 → Console tab
3. Verify environment variables: `echo $VITE_BACKEND_URL` (Linux/Mac) or `echo %VITE_BACKEND_URL%` (Windows)
4. Test backend directly: `curl https://your-backend-url/getToken?name=test&room=test`

The connection flow is: Frontend → Railway Flask Server → LiveKit Room ← Railway Agent

All parts must be working for successful connection.
