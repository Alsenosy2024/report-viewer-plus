# How to Import Client Tools to ElevenLabs

## Quick Import Method

If ElevenLabs supports bulk import:

1. **Go to Your Agent Dashboard**
   - Visit: https://elevenlabs.io/app/conversational-ai
   - Open agent: `agent_2401k5v85f8beantem3febzmgj81`

2. **Find Tools/Functions Section**
   - Look for "Tools", "Functions", or "Client Tools" menu

3. **Import JSON**
   - Look for "Import" or "Bulk Add" button
   - Upload the file: `elevenlabs-client-tools.json`
   - Confirm import

4. **Verify Import**
   - Check that all 20 tools are listed
   - Verify each tool has correct name and description

---

## Manual Import Method

If bulk import is not available, add tools one by one:

### Tool 1: open_dashboard
```json
{
  "type": "client",
  "name": "open_dashboard",
  "description": "Navigate to the main dashboard overview page. Use this when the user wants to see their dashboard, overview, main page, or general analytics.",
  "disable_interruptions": false,
  "force_pre_tool_speech": "auto",
  "assignments": [],
  "tool_call_sound": null,
  "tool_call_sound_behavior": "auto",
  "execution_mode": "immediate",
  "expects_response": true,
  "response_timeout_secs": 3,
  "parameters": [],
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

### Tool 2: show_whatsapp_reports
```json
{
  "type": "client",
  "name": "show_whatsapp_reports",
  "description": "Navigate to WhatsApp analytics and reports page. Use when the user wants to see WhatsApp data, messaging analytics, chat reports, or WhatsApp metrics.",
  "disable_interruptions": false,
  "force_pre_tool_speech": "auto",
  "assignments": [],
  "tool_call_sound": null,
  "tool_call_sound_behavior": "auto",
  "execution_mode": "immediate",
  "expects_response": true,
  "response_timeout_secs": 3,
  "parameters": [],
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

... *(continue for all 20 tools from the JSON file)*

---

## After Import: Configure Tool Execution

For each tool, you need to specify what JavaScript code to execute:

### Method 1: Direct Function Call (Recommended)

In the tool's execution settings, add:

```javascript
window.convaiNavigationTools.TOOL_NAME();
```

Replace `TOOL_NAME` with the actual tool name:

| Tool Name | Execution Code |
|-----------|----------------|
| `open_dashboard` | `window.convaiNavigationTools.open_dashboard();` |
| `show_whatsapp_reports` | `window.convaiNavigationTools.show_whatsapp_reports();` |
| `show_productivity_reports` | `window.convaiNavigationTools.show_productivity_reports();` |
| `show_ads_reports` | `window.convaiNavigationTools.show_ads_reports();` |
| `show_mail_reports` | `window.convaiNavigationTools.show_mail_reports();` |
| `open_admin_settings` | `window.convaiNavigationTools.open_admin_settings();` |
| `open_bots` | `window.convaiNavigationTools.open_bots();` |
| `show_social_posts` | `window.convaiNavigationTools.show_social_posts();` |
| `show_content_ideas` | `window.convaiNavigationTools.show_content_ideas();` |
| `show_courses_prices` | `window.convaiNavigationTools.show_courses_prices();` |
| `go_home` | `window.convaiNavigationTools.go_home();` |
| `go_back` | `window.convaiNavigationTools.go_back();` |
| `go_forward` | `window.convaiNavigationTools.go_forward();` |
| `refresh_page` | `window.convaiNavigationTools.refresh_page();` |
| `toggle_sidebar` | `window.convaiNavigationTools.toggle_sidebar();` |
| `open_sidebar` | `window.convaiNavigationTools.open_sidebar();` |
| `close_sidebar` | `window.convaiNavigationTools.close_sidebar();` |
| `sign_out` | `window.convaiNavigationTools.sign_out();` |
| `where_am_i` | `window.convaiNavigationTools.where_am_i();` |
| `help` | `window.convaiNavigationTools.help();` |

### Method 2: PostMessage (Alternative)

If your ElevenLabs setup uses postMessage:

```javascript
window.postMessage({
  type: 'elevenlabs-convai-navigation',
  command: 'TOOL_NAME'
}, '*');
```

---

## Tool Descriptions Explained

Each tool has a detailed description to help the AI understand when to use it:

1. **open_dashboard** - Main dashboard, overview, general analytics
2. **show_whatsapp_reports** - WhatsApp data, messaging, chat reports
3. **show_productivity_reports** - Productivity, performance, efficiency
4. **show_ads_reports** - Advertising, campaigns, ad analytics
5. **show_mail_reports** - Email metrics, mail analytics
6. **open_admin_settings** - Settings, admin panel, configuration
7. **open_bots** - Bot management, bot controls
8. **show_social_posts** - Social media posts, social content
9. **show_content_ideas** - Content suggestions, inspiration
10. **show_courses_prices** - Courses, pricing, course catalog
11. **go_home** - Home page, landing page, start
12. **go_back** - Previous page, navigate backwards
13. **go_forward** - Next page, navigate forwards
14. **refresh_page** - Reload, refresh, update page
15. **toggle_sidebar** - Toggle menu, switch sidebar state
16. **open_sidebar** - Open menu, show sidebar
17. **close_sidebar** - Close menu, hide sidebar
18. **sign_out** - Logout, end session
19. **where_am_i** - Current location, what page
20. **help** - Available commands, help info

---

## Testing After Import

1. **Verify in Dashboard**
   - Check all 20 tools appear in the tools list
   - Verify each has correct name and description

2. **Test in ElevenLabs Preview**
   - Use the preview/test feature
   - Try: "Show me the dashboard"
   - Check if tool gets called in logs

3. **Test on Website**
   - Open your website
   - Open browser console (F12)
   - Verify: `[ConvAI Navigator] Initialized`
   - Click ElevenLabs widget
   - Say: "Show me the dashboard"
   - Check: Page navigates + toast appears

---

## Troubleshooting Import

### Issue: Import fails

**Solutions:**
1. Check JSON is valid (use https://jsonlint.com)
2. Try importing smaller batches (5 tools at a time)
3. Check ElevenLabs API limits
4. Try manual import instead

### Issue: Tools imported but don't work

**Solutions:**
1. Verify execution code is set for each tool
2. Check tool names match exactly (case-sensitive)
3. Ensure client-side execution is enabled
4. Test functions directly in browser console

### Issue: Some tools work, others don't

**Solutions:**
1. Compare working vs non-working tools
2. Check execution code matches tool name
3. Verify descriptions are clear
4. Test each tool individually

---

## Alternative: Copy-Paste Method

If import doesn't work, here's a quick copy-paste template for each tool:

**Template:**
```
Name: [tool_name]
Type: Client Tool
Description: [tool_description]
Execution: window.convaiNavigationTools.[tool_name]();
```

**Example for dashboard:**
```
Name: open_dashboard
Type: Client Tool
Description: Navigate to the main dashboard overview page. Use this when the user wants to see their dashboard, overview, main page, or general analytics.
Execution: window.convaiNavigationTools.open_dashboard();
```

---

## Quick Checklist

After importing tools:

- [ ] All 20 tools visible in dashboard
- [ ] Each tool has correct name
- [ ] Each tool has description
- [ ] Execution code set for each tool
- [ ] Client-side execution enabled
- [ ] Function calling enabled
- [ ] Tested in preview mode
- [ ] Tested on actual website
- [ ] Console shows no errors
- [ ] Navigation works correctly

---

## Files Reference

- **JSON File**: `elevenlabs-client-tools.json` (all 20 tools)
- **Setup Guide**: `ELEVENLABS_AGENT_SETUP.md`
- **Quick Start**: `QUICK_START_VOICE_NAVIGATION.md`
- **Technical Docs**: `ELEVENLABS_VOICE_NAVIGATION.md`

---

**Need Help?**

1. Check browser console for errors
2. Verify `window.convaiNavigationTools` exists
3. Test functions directly in console
4. Review ElevenLabs agent logs
5. Check tool execution settings

---

Last Updated: 2025-10-20
