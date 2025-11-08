# Backend Voice Agent Navigation Setup Guide

This guide explains how to enable your LiveKit voice agent (backend) to navigate the website via voice commands.

## Overview

This feature allows your backend Python voice agent (`agent.py`) to control the frontend website navigation. When a user speaks to the agent (e.g., "show me the dashboard"), the agent can navigate the browser to the appropriate page.

## Architecture

### How It Works

1. **Backend Agent** (`agent.py`): Has function tools that send navigation commands
2. **LiveKit Data Channel**: Commands are sent as data messages through LiveKit
3. **Frontend Listener** (`AgentNavigationListener.tsx`): Receives commands and executes navigation
4. **React Router**: Performs the actual page navigation

```
User speaks → Agent processes → Function tool called →
Data message sent via LiveKit → Frontend receives →
Navigation executed → Toast notification shown
```

## Setup Instructions

### Step 1: Install Frontend Dependencies

Navigate to the frontend directory and install LiveKit SDK:

```bash
cd report-viewer-plus
npm install livekit-client @livekit/components-react
```

### Step 2: Configure Frontend Environment

Edit `report-viewer-plus/.env`:

```bash
# Enable agent navigation
VITE_ENABLE_AGENT_NAVIGATION=true

# LiveKit connection details
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
VITE_LIVEKIT_TOKEN=your-token-here
```

**Getting LiveKit Token:**

Option 1 - Use a permanent room token (for testing):
1. Go to LiveKit Cloud dashboard
2. Settings → Keys
3. Generate a token for your room
4. Note: For production, implement server-side token generation

Option 2 - Use LiveKit token generator:
```bash
# Install LiveKit CLI
npm install -g livekit-cli

# Generate token
livekit-cli token create \
  --api-key <your-api-key> \
  --api-secret <your-api-secret> \
  --room <room-name> \
  --identity web-client \
  --valid-for 24h
```

### Step 3: Configure Backend Agent

The backend is already configured with navigation tools in `agent.py`. No additional changes needed.

### Step 4: Start the Services

**Terminal 1 - Start Backend Agent:**
```bash
# From project root
python agent.py dev
```

**Terminal 2 - Start Frontend:**
```bash
# From report-viewer-plus directory
npm run dev
```

### Step 5: Test the Integration

1. Open browser to `http://localhost:5173`
2. Agent should auto-connect (check console for "[Agent Navigation] Connected to LiveKit room")
3. Speak to the agent: "Show me the dashboard"
4. Agent should navigate the page and show a toast notification

## Available Voice Commands

The agent can understand and execute these commands:

### Page Navigation
- "Show me the dashboard" / "Open dashboard" → Navigates to dashboard
- "Show WhatsApp reports" → Opens WhatsApp analytics
- "Show productivity reports" → Opens productivity metrics
- "Show ads reports" / "Show advertising" → Opens ads analytics
- "Show email reports" / "Show mail reports" → Opens email analytics
- "Open bot controls" / "Show bots" → Opens bot management
- "Show social posts" → Opens social media content
- "Show content ideas" → Opens content suggestions
- "Show meeting summary" → Opens meeting recorder
- "Show courses and pricing" → Opens courses page
- "Go home" / "Take me home" → Goes to homepage

### Utility Commands
- "Where am I?" → Shows current page location

## How Agent Processes Commands

Example conversation flow:

```
User: "Show me the WhatsApp reports"
Agent: *calls show_whatsapp_reports() function tool*
        ↓
        Sends data message: { type: "agent-navigation", command: "show_whatsapp_reports" }
        ↓
Frontend: Receives message → Navigates to /whatsapp-reports → Shows toast
Agent: "Opening WhatsApp reports"
```

## Customization

### Adding New Navigation Commands

**1. Add function tool to backend** (`agent.py`):

```python
@function_tool
async def show_custom_page(self, context: RunContext):
    """Navigate to custom page. Use when user asks about custom features."""
    self._send_navigation_command(context, "show_custom_page")
    return "Opening custom page"
```

**2. Add route handler to frontend** (`AgentNavigationListener.tsx`):

```typescript
case 'show_custom_page':
  navigate('/custom-page');
  toast({ title: "Voice Agent", description: "Opening Custom Page" });
  break;
```

**3. Update agent instructions** (`prompts/agent_instructions.txt`):

```
You can navigate to the following pages:
- Custom page: When users ask about custom features, use show_custom_page()
```

## Troubleshooting

### Frontend Not Connecting

**Issue**: Console shows "Not enabled or missing credentials"

**Solutions**:
1. Check `VITE_ENABLE_AGENT_NAVIGATION=true` in `.env`
2. Verify `VITE_LIVEKIT_URL` and `VITE_LIVEKIT_TOKEN` are set
3. Ensure `.env` file is in `report-viewer-plus/` directory
4. Restart dev server after changing `.env`

### Navigation Commands Not Working

**Issue**: Agent responds but page doesn't navigate

**Solutions**:
1. Check browser console for `[Agent Navigation]` messages
2. Verify AgentNavigationListener is receiving data messages
3. Check network tab for WebSocket connection to LiveKit
4. Ensure both backend and frontend are connected to same LiveKit room
5. Verify token has permissions for data publishing

### Token Expired

**Issue**: "Connection Error" toast appears

**Solutions**:
1. Generate a new token with longer expiry
2. Implement server-side token generation for production
3. Add token refresh logic to frontend

### Backend Agent Can't Send Messages

**Issue**: Backend logs show "Failed to send navigation command"

**Solutions**:
1. Check `context.room.local_participant` is available
2. Verify agent is connected to room
3. Check agent has permissions to publish data
4. Look for Python errors in backend console

## Production Considerations

### Security

1. **Token Generation**:
   - Never expose API secrets in frontend
   - Implement server-side token generation
   - Use short-lived tokens (1-24 hours)

2. **Room Access**:
   - Limit room access to authenticated users
   - Validate user permissions before generating tokens

### Token Generation API

Example server-side token generation:

```typescript
// api/livekit-token.ts
import { AccessToken } from 'livekit-server-sdk';

export async function generateToken(roomName: string, userId: string) {
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: userId,
      ttl: '1h',
    }
  );

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });

  return token.toJwt();
}
```

### Scalability

- Use LiveKit Cloud for production (handles scaling automatically)
- Consider room naming strategy (per-user vs shared rooms)
- Monitor data message volume and rate limits

## Advanced Features

### Voice Command Confirmation

Add confirmation before navigation:

```python
@function_tool
async def show_dashboard(self, context: RunContext, confirm: bool = True):
    """Navigate to dashboard. Set confirm=False to skip confirmation."""
    if confirm:
        # Agent could ask: "Would you like me to open the dashboard?"
        # This requires implementing conversation state management
        pass

    self._send_navigation_command(context, "open_dashboard")
    return "Opening the dashboard now"
```

### Multi-User Coordination

Handle multiple users in same room:

```python
def _send_navigation_command(self, context: RunContext, command: str, target_user: str = None):
    """Send navigation command to specific user or all users"""
    message = {
        "type": "agent-navigation",
        "command": command,
        "target": target_user  # None = all users
    }
    # ... send logic
```

### Navigation History

Track what pages users visit:

```typescript
// In AgentNavigationListener.tsx
const navigationHistory = useRef<string[]>([]);

const executeNavigationCommand = (command: string) => {
  // ... navigation logic
  navigationHistory.current.push(command);

  // Send history back to agent for context
  room.localParticipant.publishData(
    JSON.stringify({ type: 'navigation-history', history: navigationHistory.current })
  );
};
```

## Testing

### Manual Testing Checklist

- [ ] Backend agent starts without errors
- [ ] Frontend connects to LiveKit (check console logs)
- [ ] Toast notification shows "Voice Agent Connected"
- [ ] Voice command triggers navigation
- [ ] Page actually changes
- [ ] Toast notification shows navigation action
- [ ] All 11 navigation commands work
- [ ] "Where am I?" shows current page correctly

### Automated Testing

```typescript
// Test navigation command execution
describe('AgentNavigationListener', () => {
  it('should navigate to dashboard on command', () => {
    const navigate = jest.fn();
    // ... setup

    executeNavigationCommand('open_dashboard');

    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });
});
```

## FAQ

**Q: Can I use this with the ElevenLabs ConvAI widget?**
A: Yes! Both can coexist. ElevenLabs provides UI-based voice navigation, while this provides agent-based navigation.

**Q: Do I need to be authenticated to use agent navigation?**
A: The AgentNavigationListener doesn't require auth, but protected routes still require authentication.

**Q: Can the agent navigate to external URLs?**
A: Currently, only internal routes are supported. You can extend this by adding `window.location.href` for external URLs.

**Q: How do I disable agent navigation?**
A: Set `VITE_ENABLE_AGENT_NAVIGATION=false` in `.env` and restart frontend.

**Q: Can I use this in production?**
A: Yes, but implement server-side token generation and proper security measures.

## Resources

- LiveKit Documentation: https://docs.livekit.io/
- LiveKit Token Generation: https://docs.livekit.io/home/get-started/authentication/
- Agent Starter Example: https://github.com/livekit-examples/agent-starter-python
- LiveKit React Components: https://github.com/livekit/components-js

## Support

For issues or questions:
1. Check console logs for error messages
2. Verify all environment variables are set correctly
3. Test with LiveKit's example apps to isolate issues
4. Check LiveKit Cloud dashboard for connection logs

---

Last Updated: 2025-11-02
Version: 1.0.0
