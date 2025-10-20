# ElevenLabs Tool Configuration - Visual Guide

## Critical Understanding: How Client Tools Work

### ❌ What DOESN'T Work:
Telling the AI in the system prompt to call `window.convaiNavigationTools.function()`

The AI **CANNOT** execute JavaScript from the prompt text.

### ✅ What DOES Work:
Creating **Client Tools** in ElevenLabs that execute JavaScript when the AI invokes them.

---

## Step-by-Step: Configuring ONE Tool (open_dashboard)

Follow this exact process for the `open_dashboard` tool, then repeat for all 20 tools.

### 1. Create New Client Tool

In ElevenLabs dashboard, click **"Add Tool"** or **"New Client Tool"**

### 2. Fill in Tool Details

```yaml
Tool Type: Client Tool
Tool Name: open_dashboard
Description: Navigate to the main dashboard overview page. Use this when the user wants to see their dashboard, overview, main page, or general analytics.
```

### 3. Configure Execution Settings

```yaml
Execution Mode: immediate
Disable Interruptions: false
Force Pre-Tool Speech: auto
Expects Response: true
Response Timeout: 3 seconds
Tool Call Sound: null
Tool Call Sound Behavior: auto
```

### 4. Set Client-Side Code (MOST IMPORTANT!)

In the **"Client-side code"** or **"JavaScript execution"** field, enter:

```javascript
window.convaiNavigationTools.open_dashboard();
```

This is the ACTUAL code that runs when the tool is invoked.

### 5. Parameters (Leave Empty)

```yaml
Parameters: []
Dynamic Variables: {}
```

Navigation tools don't need parameters.

### 6. Save the Tool

Click **"Save"** or **"Create Tool"**

---

## Visual Comparison: What Gets Configured Where

### In System Prompt (Tells AI WHEN to use tool):
```
When user says "show me the dashboard", use the open_dashboard tool
```

### In Client Tool Configuration (Tells tool WHAT to do):
```javascript
window.convaiNavigationTools.open_dashboard();
```

### How They Work Together:
```
User says: "Show me the dashboard"
    ↓
AI reads system prompt: "Use open_dashboard tool for dashboard requests"
    ↓
AI invokes: open_dashboard client tool
    ↓
ElevenLabs executes: window.convaiNavigationTools.open_dashboard();
    ↓
Your website's ConvAINavigator receives the call
    ↓
Page navigates to dashboard
```

---

## Complete Tool Configuration Template

Use this template for EACH of the 20 tools:

### Tool 1: open_dashboard
```yaml
Name: open_dashboard
Type: Client Tool
Description: Navigate to the main dashboard overview page. Use this when the user wants to see their dashboard, overview, main page, or general analytics.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.open_dashboard();
```

### Tool 2: show_whatsapp_reports
```yaml
Name: show_whatsapp_reports
Type: Client Tool
Description: Navigate to WhatsApp analytics and reports page. Use when the user wants to see WhatsApp data, messaging analytics, chat reports, or WhatsApp metrics.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.show_whatsapp_reports();
```

### Tool 3: show_productivity_reports
```yaml
Name: show_productivity_reports
Type: Client Tool
Description: Navigate to productivity reports and metrics page. Use when the user wants to see productivity data, performance metrics, efficiency reports, or team productivity.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.show_productivity_reports();
```

### Tool 4: show_ads_reports
```yaml
Name: show_ads_reports
Type: Client Tool
Description: Navigate to advertising analytics and ads reports page. Use when the user wants to see ad performance, advertising metrics, campaign data, or ad analytics.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.show_ads_reports();
```

### Tool 5: show_mail_reports
```yaml
Name: show_mail_reports
Type: Client Tool
Description: Navigate to email and mail analytics reports page. Use when the user wants to see email metrics, mail analytics, inbox reports, or email performance data.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.show_mail_reports();
```

### Tool 6: open_admin_settings
```yaml
Name: open_admin_settings
Type: Client Tool
Description: Navigate to admin settings and configuration page. Use when the user wants to access settings, admin panel, configuration, or management controls. Admin access required.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.open_admin_settings();
```

### Tool 7: open_bots
```yaml
Name: open_bots
Type: Client Tool
Description: Navigate to bot management and controls page. Use when the user wants to manage bots, configure bot settings, view bot status, or access bot controls.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.open_bots();
```

### Tool 8: show_social_posts
```yaml
Name: show_social_posts
Type: Client Tool
Description: Navigate to social media posts and content page. Use when the user wants to see social posts, social media content, published posts, or social media management.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.show_social_posts();
```

### Tool 9: show_content_ideas
```yaml
Name: show_content_ideas
Type: Client Tool
Description: Navigate to content ideas and suggestions page. Use when the user wants to see content ideas, get inspiration, view content suggestions, or browse content recommendations.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.show_content_ideas();
```

### Tool 10: show_courses_prices
```yaml
Name: show_courses_prices
Type: Client Tool
Description: Navigate to courses and pricing information page. Use when the user wants to see courses, view pricing, check course catalog, or browse course offerings.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.show_courses_prices();
```

### Tool 11: go_home
```yaml
Name: go_home
Type: Client Tool
Description: Navigate to the home page or landing page. Use when the user wants to go home, return to start, or go to the main landing page.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.go_home();
```

### Tool 12: go_back
```yaml
Name: go_back
Type: Client Tool
Description: Navigate to the previous page in browser history. Use when the user wants to go back, return to previous page, or navigate backwards.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.go_back();
```

### Tool 13: go_forward
```yaml
Name: go_forward
Type: Client Tool
Description: Navigate to the next page in browser history. Use when the user wants to go forward, return to next page, or navigate forwards after going back.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.go_forward();
```

### Tool 14: refresh_page
```yaml
Name: refresh_page
Type: Client Tool
Description: Reload or refresh the current page. Use when the user wants to refresh, reload, update the page, or get latest data.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.refresh_page();
```

### Tool 15: toggle_sidebar
```yaml
Name: toggle_sidebar
Type: Client Tool
Description: Toggle the sidebar menu visibility (open/close). Use when the user wants to toggle the menu, switch sidebar state, or show/hide navigation.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.toggle_sidebar();
```

### Tool 16: open_sidebar
```yaml
Name: open_sidebar
Type: Client Tool
Description: Open the sidebar navigation menu. Use when the user wants to open the menu, show the sidebar, or display navigation options.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.open_sidebar();
```

### Tool 17: close_sidebar
```yaml
Name: close_sidebar
Type: Client Tool
Description: Close the sidebar navigation menu. Use when the user wants to close the menu, hide the sidebar, or dismiss navigation options.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.close_sidebar();
```

### Tool 18: sign_out
```yaml
Name: sign_out
Type: Client Tool
Description: Sign out or log out the current user from the application. Use when the user wants to sign out, log out, logout, or end their session.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.sign_out();
```

### Tool 19: where_am_i
```yaml
Name: where_am_i
Type: Client Tool
Description: Get information about the current page location. Use when the user asks where they are, what page they're on, current location, or wants to know their position in the app.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.where_am_i();
```

### Tool 20: help
```yaml
Name: help
Type: Client Tool
Description: Display all available voice commands and help information. Use when the user asks for help, wants to know available commands, or asks what they can do.
Execution Mode: immediate
Client-side Code: window.convaiNavigationTools.help();
```

---

## After Creating All Tools: Test Checklist

### 1. Verify Tools Exist
In ElevenLabs dashboard, you should see all 20 tools listed.

### 2. Check One Tool's Configuration
Click on `open_dashboard` and verify:
- ✅ Name is exactly: `open_dashboard`
- ✅ Type is: `client` or `Client Tool`
- ✅ Client-side code is: `window.convaiNavigationTools.open_dashboard();`
- ✅ Execution mode is: `immediate`

### 3. Test on Website
1. Open your website
2. Open browser console (F12)
3. Verify you see: `[ConvAI Navigator] Initialized with commands:`
4. Click ElevenLabs widget
5. Say: "Show me the dashboard"
6. Watch for:
   - ✅ Console logs: `[ConvAI Navigator] Received command: open_dashboard`
   - ✅ Toast notification appears
   - ✅ Page navigates to dashboard

### 4. Test Multiple Commands
- "Show WhatsApp reports" → Should navigate to WhatsApp page
- "Go back" → Should return to previous page
- "Where am I?" → Should show current location

---

## Common Mistakes

### ❌ Mistake 1: Only updating system prompt
**Problem:** System prompt alone can't execute code
**Solution:** Must create actual client tools

### ❌ Mistake 2: Not setting client-side code
**Problem:** Tool exists but has no execution code
**Solution:** Set the `window.convaiNavigationTools.TOOL_NAME();` code for each tool

### ❌ Mistake 3: Wrong tool name
**Problem:** Tool named `dashboard` instead of `open_dashboard`
**Solution:** Tool name must match exactly: `open_dashboard`

### ❌ Mistake 4: Wrong execution code
**Problem:** Code says `open_dashboard()` instead of `window.convaiNavigationTools.open_dashboard();`
**Solution:** Must include full path: `window.convaiNavigationTools.TOOL_NAME();`

---

## Screenshot Checklist

If you can share screenshots, I can help verify your setup. Take screenshots of:

1. **Tools List** - Shows all 20 tools
2. **One Tool's Configuration** - Shows the full config of `open_dashboard`
3. **Client-Side Code Field** - Shows the JavaScript code
4. **Browser Console** - Shows `window.convaiNavigationTools` object

---

## Final Verification

Before testing with voice:

```javascript
// In browser console on your website:

// 1. Check navigation tools are loaded
console.log(window.convaiNavigationTools);
// Should show object with 20 functions

// 2. Test one function directly
window.convaiNavigationTools.open_dashboard();
// Should navigate to dashboard and show toast

// 3. Check for errors
// Console should show no errors
```

If the manual test works but voice doesn't:
- Problem is in ElevenLabs tool configuration
- Tools aren't being invoked properly
- Check tool names match exactly
- Check client-side code is set

---

## Need Help?

If it still doesn't work:

1. Verify all 20 tools are created in ElevenLabs
2. Check ONE tool's full configuration
3. Test the function manually in console
4. Check ElevenLabs agent logs for tool invocation attempts
5. Share screenshots of your tool configuration

The key is: **Client tools must be configured with the JavaScript execution code, not just mentioned in the prompt.**
