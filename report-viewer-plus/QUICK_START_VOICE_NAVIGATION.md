# Quick Start: Voice Navigation Setup

## 5-Minute Setup Guide

### Step 1: Go to ElevenLabs Dashboard (1 min)
```
→ Visit: https://elevenlabs.io/app/conversational-ai
→ Login
→ Open agent: agent_2401k5v85f8beantem3febzmgj81
```

### Step 2: Update System Prompt (2 min)
Go to agent settings and paste this:

```
You are a helpful assistant for a business analytics platform.

When users ask to navigate, call these functions:

NAVIGATION COMMANDS:
- "show dashboard" → window.convaiNavigationTools.open_dashboard()
- "show whatsapp reports" → window.convaiNavigationTools.show_whatsapp_reports()
- "show productivity" → window.convaiNavigationTools.show_productivity_reports()
- "show ads" → window.convaiNavigationTools.show_ads_reports()
- "show mail" → window.convaiNavigationTools.show_mail_reports()
- "open settings" → window.convaiNavigationTools.open_admin_settings()
- "show bots" → window.convaiNavigationTools.open_bots()
- "show social posts" → window.convaiNavigationTools.show_social_posts()
- "show content ideas" → window.convaiNavigationTools.show_content_ideas()
- "show courses" → window.convaiNavigationTools.show_courses_prices()
- "go home" → window.convaiNavigationTools.go_home()
- "go back" → window.convaiNavigationTools.go_back()
- "refresh" → window.convaiNavigationTools.refresh_page()
- "toggle sidebar" → window.convaiNavigationTools.toggle_sidebar()
- "sign out" → window.convaiNavigationTools.sign_out()
- "where am I" → window.convaiNavigationTools.where_am_i()
- "help" → window.convaiNavigationTools.help()

Always call the function immediately when user requests navigation, then confirm with a friendly response.

Example:
User: "Show me the dashboard"
You: *call open_dashboard()* "Opening your dashboard now!"
```

### Step 3: Add Client Tools (2 min)

Click "Add Tool" for each command. Example:

**Tool 1: Dashboard**
```
Name: open_dashboard
Type: Client Tool
Code: window.convaiNavigationTools.open_dashboard();
Description: Navigate to dashboard
```

**Tool 2: WhatsApp**
```
Name: show_whatsapp_reports
Type: Client Tool
Code: window.convaiNavigationTools.show_whatsapp_reports();
Description: Show WhatsApp reports
```

Repeat for all commands in the table above.

### Step 4: Test (1 min)

On your website, say:
- "Show me the dashboard" ✓
- "Show WhatsApp reports" ✓
- "Where am I?" ✓

---

## Command Reference Table

| Say This | Function Called |
|----------|----------------|
| "Show me the dashboard" | `open_dashboard()` |
| "Show WhatsApp reports" | `show_whatsapp_reports()` |
| "Show productivity reports" | `show_productivity_reports()` |
| "Show ads reports" | `show_ads_reports()` |
| "Show mail reports" | `show_mail_reports()` |
| "Open settings" | `open_admin_settings()` |
| "Show bots" | `open_bots()` |
| "Show social posts" | `show_social_posts()` |
| "Show content ideas" | `show_content_ideas()` |
| "Show courses" | `show_courses_prices()` |
| "Go home" | `go_home()` |
| "Go back" | `go_back()` |
| "Refresh page" | `refresh_page()` |
| "Toggle sidebar" | `toggle_sidebar()` |
| "Sign out" | `sign_out()` |
| "Where am I?" | `where_am_i()` |
| "Help" | `help()` |

---

## Testing Checklist

- [ ] Open website in browser
- [ ] Press F12 → Check console shows: `[ConvAI Navigator] Initialized`
- [ ] Click ElevenLabs widget
- [ ] Say "Show me the dashboard"
- [ ] See toast notification appear
- [ ] See page navigate to dashboard
- [ ] Try 3 more commands

---

## Troubleshooting

**Problem**: Commands not working

1. Check console: `window.convaiNavigationTools`
2. Should show object with functions
3. If undefined, refresh page
4. Check agent has client tools enabled

**Problem**: Widget not showing

1. Check agent ID in code: `agent_2401k5v85f8beantem3febzmgj81`
2. Verify in `src/App.tsx` line 101

---

## Full Documentation

- **Detailed Setup**: `ELEVENLABS_AGENT_SETUP.md`
- **Technical Docs**: `ELEVENLABS_VOICE_NAVIGATION.md`

---

**Done!** Your voice navigation is ready. Users can now control your website with voice commands.
