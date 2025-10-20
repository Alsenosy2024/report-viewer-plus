# ElevenLabs Voice Navigation Setup Guide

This guide explains how to configure your ElevenLabs ConvAI agent to enable voice-based navigation throughout your website.

## Overview

The website includes a comprehensive voice navigation system that allows users to navigate pages, control the UI, and manage their session using voice commands through the ElevenLabs ConvAI agent.

## Architecture

### Components

1. **ConvAINavigator Component** (`src/components/ConvAINavigator.tsx`)
   - Registers navigation functions globally on `window.convaiNavigationTools`
   - Listens for postMessage events from the ElevenLabs widget
   - Handles all navigation, UI controls, and browser actions

2. **TypeScript Types** (`src/types/elevenlabs.ts`)
   - Provides type safety for the voice command integration
   - Defines message structure and available commands

3. **ElevenLabs Widget** (loaded in `index.html`)
   - CDN script: `https://unpkg.com/@elevenlabs/convai-widget-embed`
   - Agent ID: `agent_2401k5v85f8beantem3febzmgj81`

## Available Voice Commands

### Page Navigation
- `open_dashboard` - Navigate to dashboard overview
- `show_whatsapp_reports` - Open WhatsApp analytics
- `show_productivity_reports` - Open productivity metrics
- `show_ads_reports` - Open advertising analytics
- `show_mail_reports` - Open email analytics
- `open_admin_settings` - Open admin settings (admin only)
- `open_bots` - Open bot management
- `show_social_posts` - Open social media posts
- `show_content_ideas` - Open content suggestions
- `show_courses_prices` - Open courses and pricing
- `go_home` - Navigate to home page

### Browser Controls
- `go_back` - Navigate to previous page
- `go_forward` - Navigate to next page
- `refresh_page` - Reload current page

### UI Controls
- `toggle_sidebar` - Toggle sidebar visibility
- `open_sidebar` - Open the navigation sidebar
- `close_sidebar` - Close the navigation sidebar

### Authentication
- `sign_out` - Sign out the user
- `logout` - Alias for sign_out

### Utility Commands
- `where_am_i` - Get current page location
- `help` - Display all available commands

## Configuring the ElevenLabs Agent

### Method 1: Using Custom Client Tools (Recommended)

Configure your ElevenLabs agent to use custom client tools that trigger the navigation functions:

1. **Log into ElevenLabs Dashboard**
   - Go to https://elevenlabs.io/app/conversational-ai
   - Select your agent (`agent_2401k5v85f8beantem3febzmgj81`)

2. **Add Custom Client Tools**
   - Navigate to "Tools" or "Functions" section
   - Create a new client-side tool for each navigation command
   - Example configuration for dashboard navigation:

```json
{
  "type": "client",
  "name": "open_dashboard",
  "description": "Navigate to the dashboard overview page. Use this when the user asks to see their dashboard, overview, or main page.",
  "parameters": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

3. **Configure the Client Tool Execution**
   - Set execution method to call `window.convaiNavigationTools.open_dashboard()`
   - Alternatively, use postMessage:
   ```javascript
   window.postMessage({
     type: 'elevenlabs-convai-navigation',
     command: 'open_dashboard'
   }, '*');
   ```

### Method 2: Using Agent Conversation Context

Add this to your agent's system prompt:

```
You are a helpful assistant that can navigate a web application using voice commands.

When the user asks to navigate to different pages or perform actions, use the appropriate navigation function by calling window.convaiNavigationTools[command_name]().

Available navigation commands:
- open_dashboard: Navigate to the dashboard
- show_whatsapp_reports: Show WhatsApp analytics
- show_productivity_reports: Show productivity metrics
- show_ads_reports: Show advertising reports
- show_mail_reports: Show email reports
- open_admin_settings: Open admin settings (for admins)
- open_bots: Open bot management
- show_social_posts: Show social media posts
- show_content_ideas: Show content ideas
- show_courses_prices: Show courses and pricing
- go_home: Go to home page
- go_back: Go to previous page
- go_forward: Go to next page
- refresh_page: Reload the page
- toggle_sidebar: Toggle the sidebar
- sign_out: Sign the user out
- where_am_i: Tell user their current location
- help: List all commands

Examples of user requests and appropriate responses:
- User: "Show me the dashboard" → Call open_dashboard()
- User: "Go back" → Call go_back()
- User: "What page am I on?" → Call where_am_i()
- User: "Sign me out" → Call sign_out()
```

### Method 3: Function Calling with PostMessage

If your ElevenLabs agent supports custom JavaScript execution, configure it to send postMessage events:

```javascript
// In your agent's custom code
function navigateTo(command) {
  window.postMessage({
    type: 'elevenlabs-convai-navigation',
    command: command
  }, '*');
}

// Map user intents to commands
const intentToCommand = {
  'show_dashboard': 'open_dashboard',
  'open_reports': 'show_whatsapp_reports',
  'go_back': 'go_back',
  // ... etc
};
```

## Natural Language Processing

The ElevenLabs agent should be configured to understand natural language variations of commands:

| User Says | Command to Execute |
|-----------|-------------------|
| "Show me the dashboard" | `open_dashboard` |
| "Take me to WhatsApp reports" | `show_whatsapp_reports` |
| "I want to see my productivity" | `show_productivity_reports` |
| "Go to ads" | `show_ads_reports` |
| "Open email reports" | `show_mail_reports` |
| "Take me to settings" | `open_admin_settings` |
| "Show bots" | `open_bots` |
| "Social media posts please" | `show_social_posts` |
| "Give me content ideas" | `show_content_ideas` |
| "Show courses" | `show_courses_prices` |
| "Take me home" | `go_home` |
| "Go back" | `go_back` |
| "Navigate forward" | `go_forward` |
| "Refresh this" | `refresh_page` |
| "Hide the sidebar" | `close_sidebar` |
| "Show the menu" | `open_sidebar` |
| "Log me out" | `sign_out` |
| "Where am I?" | `where_am_i` |

## Testing Your Configuration

### 1. Check Console Logs
Open browser DevTools console and look for:
```
[ConvAI Navigator] Initialized with commands: [array of command names]
```

### 2. Test Direct Function Calls
In the browser console, test commands directly:
```javascript
// Test navigation
window.convaiNavigationTools.open_dashboard();

// Test utility commands
window.convaiNavigationTools.where_am_i();

// Test browser controls
window.convaiNavigationTools.go_back();
```

### 3. Test PostMessage Events
In the browser console:
```javascript
window.postMessage({
  type: 'elevenlabs-convai-navigation',
  command: 'open_dashboard'
}, '*');
```

### 4. Test Voice Commands
1. Click on the ElevenLabs widget
2. Say a command (e.g., "Show me the dashboard")
3. Check for:
   - Toast notification appearing
   - Page navigation occurring
   - Console log showing command execution

## Troubleshooting

### Commands Not Working

**Issue**: Voice commands are not triggering navigation

**Solutions**:
1. Check browser console for errors
2. Verify `window.convaiNavigationTools` is defined:
   ```javascript
   console.log(window.convaiNavigationTools);
   ```
3. Ensure ConvAINavigator component is mounted
4. Check that ElevenLabs widget loaded successfully
5. Verify agent configuration includes client tools

### Widget Not Loading

**Issue**: ElevenLabs widget doesn't appear

**Solutions**:
1. Check network tab for script loading errors
2. Verify agent ID is correct in `App.tsx`
3. Check for Content Security Policy issues
4. Ensure the script URL is accessible:
   ```
   https://unpkg.com/@elevenlabs/convai-widget-embed
   ```

### Sidebar Controls Not Working

**Issue**: Sidebar toggle/open/close commands fail

**Solutions**:
1. Verify ConvAINavigator is inside SidebarProvider (in `App.tsx`)
2. Check that sidebar context is available
3. Try toggling sidebar manually first to ensure it works

### Authentication Commands Failing

**Issue**: Sign out / logout commands not working

**Solutions**:
1. Check that user is authenticated
2. Verify auth context is available
3. Check console for sign out errors
4. Test sign out manually through UI first

## Advanced Customization

### Adding New Navigation Commands

1. **Add to TypeScript types** (`src/types/elevenlabs.ts`):
```typescript
export type VoiceCommand =
  // ... existing commands
  | 'your_new_command';
```

2. **Add to navigationTools** (`src/components/ConvAINavigator.tsx`):
```typescript
const navigationTools: NavigationTools = {
  // ... existing tools
  your_new_command: () => {
    navigate('/your-new-route');
    toast({ title: "Your Title", description: "Your description" });
    return "Success message for voice feedback";
  },
};
```

3. **Update help command** to include the new command

4. **Configure in ElevenLabs agent** to recognize the new command

### Customizing Toast Notifications

Modify the toast calls in ConvAINavigator.tsx:
```typescript
toast({
  title: "Custom Title",
  description: "Custom description",
  duration: 3000, // milliseconds
  variant: "default" // or "destructive"
});
```

### Adding Command Parameters

For commands that need parameters (e.g., "navigate to page 5"):

1. Update the ElevenLabsConvAIMessage type:
```typescript
export interface ElevenLabsConvAIMessage {
  type: 'elevenlabs-convai-navigation' | 'elevenlabs-convai-command';
  command: string;
  params?: {
    page?: number;
    filter?: string;
    // ... other params
  };
}
```

2. Update command handler to accept params:
```typescript
navigate_to_page: (params?: { page: number }) => {
  const page = params?.page || 1;
  navigate(\`/reports?page=\${page}\`);
  return \`Navigated to page \${page}\`;
},
```

## Security Considerations

1. **Origin Validation**: Consider adding origin validation to postMessage handler:
```typescript
const handleConvAIMessage = (event: MessageEvent<ElevenLabsConvAIMessage>) => {
  // Validate origin if needed
  // if (!event.origin.includes('elevenlabs.io')) return;

  // ... rest of handler
};
```

2. **Command Validation**: All commands are validated before execution
3. **Error Handling**: Wrapped in try-catch blocks to prevent crashes
4. **User Authentication**: Protected routes still require authentication
5. **Admin Commands**: Admin-only commands still respect role permissions

## Best Practices

1. **Clear Voice Commands**: Train your agent to confirm actions before executing
2. **User Feedback**: Always provide visual (toast) and audio feedback
3. **Error Messages**: Provide helpful error messages when commands fail
4. **Command Aliases**: Support multiple ways to say the same thing
5. **Context Awareness**: Agent should understand current page context
6. **Graceful Degradation**: App works fine even if voice commands fail

## Support

For issues with:
- **Navigation logic**: Check `src/components/ConvAINavigator.tsx`
- **ElevenLabs agent config**: Visit https://elevenlabs.io/docs
- **Widget integration**: Check `src/App.tsx` and `index.html`

## Example Agent Prompts

### Basic Navigation Agent
```
You are a navigation assistant for a business analytics dashboard. When users ask to navigate:

1. Identify their intent (which page they want)
2. Call the appropriate navigation function from window.convaiNavigationTools
3. Confirm the action with a friendly response

Example: User says "show me whatsapp reports"
- Call: window.convaiNavigationTools.show_whatsapp_reports()
- Respond: "Opening your WhatsApp reports now!"
```

### Advanced Conversational Agent
```
You are a helpful AI assistant for a business analytics platform. You can:
- Navigate to different report pages
- Answer questions about the data you see
- Help users understand their metrics
- Provide insights and recommendations

When users want to navigate, use the voice navigation commands.
When they ask questions, analyze the current page context and help them understand their data.

Available navigation functions are in window.convaiNavigationTools.
Current page can be checked with window.location.pathname.
```

## FAQ

**Q: Can I use this with a different voice agent?**
A: Yes! The navigation system works with any system that can call JavaScript functions or send postMessage events.

**Q: How do I change the agent ID?**
A: Update the agent-id in `src/App.tsx` line 101.

**Q: Can users navigate with keyboard only?**
A: Yes, the standard navigation still works. Voice is an additional option.

**Q: Does this work on mobile?**
A: Yes, all commands including sidebar controls are mobile-responsive.

**Q: Can I disable voice navigation?**
A: Yes, simply remove the `<ConvAINavigator />` component from `App.tsx`.

---

Last Updated: 2025-10-20
Version: 1.0.0
