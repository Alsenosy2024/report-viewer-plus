# ElevenLabs Agent Configuration Guide

## Step-by-Step Setup for Voice Navigation

This guide will walk you through configuring your ElevenLabs ConvAI agent to enable voice-controlled navigation on your website.

---

## Prerequisites

- ElevenLabs account with access to ConvAI
- Your agent ID: `agent_2401k5v85f8beantem3febzmgj81`
- Admin access to the ElevenLabs dashboard

---

## Step 1: Access Your Agent

1. **Go to ElevenLabs Dashboard**
   - Visit: https://elevenlabs.io/app/conversational-ai
   - Log in with your credentials

2. **Select Your Agent**
   - Find agent with ID: `agent_2401k5v85f8beantem3febzmgj81`
   - Click to open the agent configuration

---

## Step 2: Configure Agent System Prompt

The system prompt tells your agent how to behave and what it can do.

1. **Navigate to "Agent Configuration" or "Settings"**

2. **Update the System Prompt**

   Replace or add this to your agent's system prompt:

```
You are a helpful AI assistant for a business analytics and reporting platform. You help users navigate the application and understand their data using voice commands.

NAVIGATION CAPABILITIES:
You can navigate users to different pages using JavaScript functions. When a user asks to go somewhere or see something, call the appropriate navigation function.

AVAILABLE NAVIGATION FUNCTIONS:
All functions are available at window.convaiNavigationTools[function_name]()

Page Navigation:
- window.convaiNavigationTools.open_dashboard() - Main dashboard with overview
- window.convaiNavigationTools.show_whatsapp_reports() - WhatsApp analytics
- window.convaiNavigationTools.show_productivity_reports() - Productivity metrics
- window.convaiNavigationTools.show_ads_reports() - Advertising analytics
- window.convaiNavigationTools.show_mail_reports() - Email analytics
- window.convaiNavigationTools.open_admin_settings() - Admin settings (admin only)
- window.convaiNavigationTools.open_bots() - Bot management
- window.convaiNavigationTools.show_social_posts() - Social media posts
- window.convaiNavigationTools.show_content_ideas() - Content ideas
- window.convaiNavigationTools.show_courses_prices() - Courses and pricing
- window.convaiNavigationTools.go_home() - Home page

Browser Controls:
- window.convaiNavigationTools.go_back() - Previous page
- window.convaiNavigationTools.go_forward() - Next page
- window.convaiNavigationTools.refresh_page() - Reload page

UI Controls:
- window.convaiNavigationTools.toggle_sidebar() - Toggle sidebar
- window.convaiNavigationTools.open_sidebar() - Open sidebar
- window.convaiNavigationTools.close_sidebar() - Close sidebar

Authentication:
- window.convaiNavigationTools.sign_out() - Sign user out
- window.convaiNavigationTools.logout() - Sign user out (alias)

Utilities:
- window.convaiNavigationTools.where_am_i() - Get current location
- window.convaiNavigationTools.help() - List all commands

NATURAL LANGUAGE UNDERSTANDING:
Map user requests to the appropriate function:

User says → You call:
"show me the dashboard" → open_dashboard()
"take me to WhatsApp reports" → show_whatsapp_reports()
"I want to see productivity" → show_productivity_reports()
"go to ads" / "show ads" → show_ads_reports()
"email reports" / "mail" → show_mail_reports()
"open settings" / "settings" → open_admin_settings()
"show bots" / "bot controls" → open_bots()
"social media" / "posts" → show_social_posts()
"content ideas" / "ideas" → show_content_ideas()
"courses" / "pricing" → show_courses_prices()
"go home" / "home page" → go_home()
"go back" / "back" → go_back()
"go forward" / "forward" → go_forward()
"refresh" / "reload" → refresh_page()
"hide sidebar" / "close menu" → close_sidebar()
"show sidebar" / "open menu" → open_sidebar()
"toggle menu" → toggle_sidebar()
"sign out" / "log out" / "logout" → sign_out()
"where am I?" / "current page" → where_am_i()
"help" / "what can you do" → help()

INTERACTION GUIDELINES:
1. When user asks to navigate, call the function immediately
2. Confirm the action with a friendly response like "Opening your dashboard now!"
3. If unsure which page they want, ask for clarification
4. Be conversational and helpful
5. Functions return status messages - you can reference these in your response
6. Always provide audio feedback about what you're doing

EXAMPLE CONVERSATIONS:

User: "Show me the dashboard"
You: *Call open_dashboard()* "Opening your dashboard now! You'll see your overview in just a moment."

User: "I want to check WhatsApp reports"
You: *Call show_whatsapp_reports()* "Taking you to WhatsApp reports. You'll see your messaging analytics there."

User: "Go back"
You: *Call go_back()* "Going back to the previous page."

User: "Where am I?"
You: *Call where_am_i()* "Let me check that for you." *Function will show current page*

User: "What can you help me with?"
You: "I can help you navigate around the platform! I can take you to your dashboard, various reports like WhatsApp, productivity, ads, and email analytics. I can also help you manage bots, view social posts, browse content ideas, and check courses. Just tell me where you'd like to go!"

Remember: You're a helpful assistant that makes navigation easy and conversational. Always be friendly and confirm actions.
```

3. **Save the System Prompt**

---

## Step 3: Add Custom Client Tools (Recommended Method)

Custom tools allow the agent to execute JavaScript functions directly on the webpage.

### For Each Navigation Command:

1. **Click "Add Tool" or "New Function"**

2. **Configure the tool with these settings:**

#### Example: Dashboard Navigation Tool

```yaml
Tool Name: open_dashboard
Tool Type: Client Tool (or Custom Client Function)
Description: Navigate to the dashboard overview page. Use when user wants to see their main dashboard or overview.

Execution Method: JavaScript
Code:
  window.convaiNavigationTools.open_dashboard();

Parameters: None
```

#### Example: WhatsApp Reports Tool

```yaml
Tool Name: show_whatsapp_reports
Tool Type: Client Tool
Description: Navigate to WhatsApp analytics and reports. Use when user wants to see WhatsApp data, messaging analytics, or WhatsApp reports.

Execution Method: JavaScript
Code:
  window.convaiNavigationTools.show_whatsapp_reports();

Parameters: None
```

### Complete List of Tools to Create:

Create a tool for each of these commands:

| Tool Name | Description | JavaScript Code |
|-----------|-------------|-----------------|
| `open_dashboard` | Navigate to dashboard overview | `window.convaiNavigationTools.open_dashboard();` |
| `show_whatsapp_reports` | Show WhatsApp analytics | `window.convaiNavigationTools.show_whatsapp_reports();` |
| `show_productivity_reports` | Show productivity metrics | `window.convaiNavigationTools.show_productivity_reports();` |
| `show_ads_reports` | Show advertising analytics | `window.convaiNavigationTools.show_ads_reports();` |
| `show_mail_reports` | Show email analytics | `window.convaiNavigationTools.show_mail_reports();` |
| `open_admin_settings` | Open admin settings | `window.convaiNavigationTools.open_admin_settings();` |
| `open_bots` | Open bot management | `window.convaiNavigationTools.open_bots();` |
| `show_social_posts` | Show social media posts | `window.convaiNavigationTools.show_social_posts();` |
| `show_content_ideas` | Show content ideas | `window.convaiNavigationTools.show_content_ideas();` |
| `show_courses_prices` | Show courses and pricing | `window.convaiNavigationTools.show_courses_prices();` |
| `go_home` | Go to home page | `window.convaiNavigationTools.go_home();` |
| `go_back` | Go to previous page | `window.convaiNavigationTools.go_back();` |
| `go_forward` | Go to next page | `window.convaiNavigationTools.go_forward();` |
| `refresh_page` | Reload current page | `window.convaiNavigationTools.refresh_page();` |
| `toggle_sidebar` | Toggle sidebar visibility | `window.convaiNavigationTools.toggle_sidebar();` |
| `open_sidebar` | Open the sidebar | `window.convaiNavigationTools.open_sidebar();` |
| `close_sidebar` | Close the sidebar | `window.convaiNavigationTools.close_sidebar();` |
| `sign_out` | Sign user out | `window.convaiNavigationTools.sign_out();` |
| `where_am_i` | Get current page location | `window.convaiNavigationTools.where_am_i();` |
| `help` | Show available commands | `window.convaiNavigationTools.help();` |

---

## Step 4: Configure Agent Behavior Settings

1. **Conversation Settings**
   - Enable function calling: **ON**
   - Allow client-side execution: **ON**
   - Response mode: **Conversational**

2. **Privacy & Security**
   - Ensure the agent can execute client-side JavaScript
   - Verify domain restrictions allow your website

3. **Voice Settings** (optional)
   - Choose a voice that suits your brand
   - Adjust speaking rate if needed
   - Configure language (English recommended)

---

## Step 5: Test Configuration

### Test in ElevenLabs Dashboard

1. **Use the Test Widget**
   - Most ElevenLabs dashboards have a test/preview widget
   - Try saying: "Show me the dashboard"
   - Check if the tool gets called in the logs

### Test on Your Website

1. **Open Your Website**
   - Navigate to your deployed site
   - Ensure you're logged in

2. **Open Browser Console** (F12 or Right-click → Inspect → Console)

3. **Check for Initialization**
   - Look for: `[ConvAI Navigator] Initialized with commands:`
   - This confirms the navigation system is ready

4. **Verify Tools Are Available**
   ```javascript
   console.log(window.convaiNavigationTools);
   ```
   - Should show an object with all navigation functions

5. **Test Voice Commands**
   - Click the ElevenLabs widget
   - Say: "Show me the dashboard"
   - You should see:
     - Toast notification appears
     - Page navigates to dashboard
     - Console logs the command execution

6. **Test Multiple Commands**
   - "Show WhatsApp reports"
   - "Go back"
   - "Where am I?"
   - "Help"

---

## Alternative Configuration Method

If your ElevenLabs plan doesn't support custom client tools, you can use **conversation flow automation**:

### Option A: PostMessage Events

Configure your agent to send postMessage events:

```javascript
// In agent's custom code execution
window.postMessage({
  type: 'elevenlabs-convai-navigation',
  command: 'open_dashboard'
}, '*');
```

### Option B: Direct Function Calls

If the agent can execute arbitrary JavaScript:

```javascript
// Map user intent to function
const intentMap = {
  'dashboard': 'open_dashboard',
  'whatsapp': 'show_whatsapp_reports',
  // ... etc
};

function handleIntent(intent) {
  const command = intentMap[intent];
  if (command && window.convaiNavigationTools) {
    window.convaiNavigationTools[command]();
  }
}
```

---

## Troubleshooting

### Issue: Agent doesn't recognize commands

**Solutions:**
1. Check system prompt is saved correctly
2. Verify client tools are created and enabled
3. Ensure function calling is enabled in agent settings
4. Test with exact command names first: "open_dashboard" instead of "show me the dashboard"

### Issue: Commands recognized but nothing happens

**Solutions:**
1. Check browser console for errors
2. Verify `window.convaiNavigationTools` exists:
   ```javascript
   console.log(window.convaiNavigationTools);
   ```
3. Test direct function call:
   ```javascript
   window.convaiNavigationTools.open_dashboard();
   ```
4. Ensure you're on the website (not ElevenLabs dashboard)

### Issue: Some commands work, others don't

**Solutions:**
1. Check which tools are properly configured
2. Verify tool names match exactly (case-sensitive)
3. Review console logs for specific errors
4. Test each tool individually in the browser console

### Issue: Widget doesn't appear

**Solutions:**
1. Check agent ID in `src/App.tsx` matches your agent
2. Verify ElevenLabs script loaded in Network tab
3. Check for JavaScript errors in console
4. Ensure agent is published/active in ElevenLabs dashboard

---

## Advanced Configuration

### Adding Intent Recognition

For better natural language understanding, configure intent mappings:

```javascript
// In agent configuration or custom code
const USER_INTENTS = {
  'dashboard': ['dashboard', 'overview', 'main page', 'home dashboard'],
  'whatsapp': ['whatsapp', 'messaging', 'chat reports', 'wa reports'],
  'productivity': ['productivity', 'performance', 'efficiency'],
  'ads': ['ads', 'advertising', 'campaigns', 'ad reports'],
  'mail': ['mail', 'email', 'inbox', 'email reports'],
  // ... etc
};

// Use in agent's decision logic
```

### Response Templates

Configure the agent to use consistent response patterns:

```yaml
On navigation success:
- "Taking you to {page_name} now!"
- "Opening {page_name}..."
- "Here's your {page_name}!"

On navigation failure:
- "I couldn't open that page. Please try again."
- "There was an issue navigating. Can you repeat that?"

On unclear request:
- "Which page would you like to see?"
- "I can show you the dashboard, reports, or settings. Which would you prefer?"
```

---

## Best Practices

1. **Keep System Prompt Updated**
   - Add new commands as you create them
   - Update descriptions based on user feedback

2. **Test Regularly**
   - Test after any configuration changes
   - Verify on different devices/browsers

3. **Monitor Usage**
   - Check ElevenLabs analytics for common failures
   - Identify which commands users struggle with

4. **Provide Feedback**
   - Toast notifications confirm actions
   - Audio responses reassure users
   - Error messages help troubleshoot

5. **Gradual Rollout**
   - Start with core navigation commands
   - Add advanced features based on usage
   - Train users with examples

---

## Quick Reference Card

Print this for quick reference:

### Top 10 Most Useful Commands

1. **"Show me the dashboard"** → Main overview
2. **"Show WhatsApp reports"** → Messaging analytics
3. **"Show productivity reports"** → Performance metrics
4. **"Go back"** → Previous page
5. **"Where am I?"** → Current location
6. **"Help"** → List all commands
7. **"Show social posts"** → Social media content
8. **"Open settings"** → Admin controls
9. **"Sign out"** → Logout
10. **"Toggle sidebar"** → Show/hide menu

---

## Support Resources

- **ElevenLabs Documentation**: https://elevenlabs.io/docs
- **ElevenLabs Support**: https://elevenlabs.io/support
- **ConvAI API Reference**: https://elevenlabs.io/docs/conversational-ai
- **Your Implementation Docs**: `ELEVENLABS_VOICE_NAVIGATION.md`

---

## Checklist

Use this to ensure complete setup:

- [ ] Accessed ElevenLabs dashboard
- [ ] Found and opened correct agent
- [ ] Updated system prompt with navigation instructions
- [ ] Created client tools for all commands (20+ tools)
- [ ] Enabled function calling in agent settings
- [ ] Saved all changes
- [ ] Tested in ElevenLabs preview
- [ ] Tested on actual website
- [ ] Verified console shows initialization
- [ ] Tested at least 5 different commands
- [ ] Checked toast notifications appear
- [ ] Verified navigation actually occurs
- [ ] Tested error cases (invalid commands)
- [ ] Documented any custom configurations

---

**Last Updated**: 2025-10-20
**Agent ID**: agent_2401k5v85f8beantem3febzmgj81
**Version**: 1.0.0

---

## Need Help?

If you encounter issues:

1. Check browser console for error messages
2. Review this guide's troubleshooting section
3. Verify each checklist item above
4. Test functions directly in console
5. Check ElevenLabs agent logs for errors

For code-related issues, refer to `ELEVENLABS_VOICE_NAVIGATION.md` for technical details.
