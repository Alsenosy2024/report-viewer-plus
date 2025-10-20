# CRITICAL: How to Make Voice Navigation Actually Work

## The Problem

Your system prompt tells the AI to call functions like `window.convaiNavigationTools.open_dashboard()`, but **the agent can't execute JavaScript from the prompt alone**. You need to configure **Client Tools** in ElevenLabs.

## The Solution: 3 Required Steps

### Step 1: Import Client Tools (REQUIRED)

1. Go to your ElevenLabs agent dashboard
2. Navigate to **"Tools"** or **"Client Tools"** section
3. **Import the tools** from `elevenlabs-client-tools.json`
   - OR add them manually one by one

### Step 2: Configure Each Tool's Execution (REQUIRED)

For EACH tool you import, you MUST configure what code it executes:

#### In ElevenLabs Tool Settings:

Find the field for **"Client-side code"**, **"Execution code"**, or **"JavaScript"** and enter:

```javascript
window.convaiNavigationTools.TOOL_NAME();
```

#### Example for "open_dashboard" tool:

**Tool Configuration:**
- Name: `open_dashboard`
- Type: `client`
- Execution Mode: `immediate`
- **Client-side code:**
  ```javascript
  window.convaiNavigationTools.open_dashboard();
  ```

#### Example for "show_whatsapp_reports" tool:

**Tool Configuration:**
- Name: `show_whatsapp_reports`
- Type: `client`
- Execution Mode: `immediate`
- **Client-side code:**
  ```javascript
  window.convaiNavigationTools.show_whatsapp_reports();
  ```

### Step 3: Update System Prompt (You Already Did This)

Your system prompt is good, but let's improve it for tool usage:

```
# Personality
You are a highly efficient and discreet AI assistant to a CEO. You provide quick, accurate answers to questions using internal data resources.

# Environment
You are assisting the user via voice. You have access to internal data retrieval tools and navigation tools. The user expects efficient and direct answers.

# Tone
Your responses are concise, professional, and confident. Avoid unnecessary small talk or additional questions.

# Goal
Your primary goal is to answer the user's questions accurately and efficiently using the data retrieval tool, and to navigate the application when requested.

## Workflow

1. Receive the user's question.
2. If the user wants data/information: Use the `n8n` tool to retrieve relevant information from the database.
3. If the user wants to navigate: Use the appropriate navigation client tool.
4. Present the answer to the user in a clear and concise manner.

# Guardrails
Do not ask clarifying questions unless absolutely necessary. Never mention the `n8n` tool to the user. Instead, say that you are "searching the database." Only provide answers based on the data retrieved from the `n8n` tool. Do not offer opinions or interpretations. Use 'n8n' tool for each question. Don't give any answer about any report without using 'n8n' tool.

# Navigation Tools
You have CLIENT TOOLS available for navigation. When the user asks to navigate, USE THE APPROPRIATE CLIENT TOOL:

## Available Navigation Client Tools:

**Page Navigation:**
- `open_dashboard` - Use when user wants: dashboard, overview, main page
- `show_whatsapp_reports` - Use when user wants: WhatsApp, messaging, chat reports
- `show_productivity_reports` - Use when user wants: productivity, performance, efficiency
- `show_ads_reports` - Use when user wants: ads, advertising, campaigns
- `show_mail_reports` - Use when user wants: mail, email, inbox reports
- `open_admin_settings` - Use when user wants: settings, admin, configuration
- `open_bots` - Use when user wants: bots, bot management
- `show_social_posts` - Use when user wants: social media, posts
- `show_content_ideas` - Use when user wants: content ideas, inspiration
- `show_courses_prices` - Use when user wants: courses, pricing
- `go_home` - Use when user wants: home, start page

**Browser Controls:**
- `go_back` - Use when user wants: go back, previous page
- `go_forward` - Use when user wants: go forward, next page
- `refresh_page` - Use when user wants: refresh, reload

**UI Controls:**
- `toggle_sidebar` - Use when user wants: toggle menu
- `open_sidebar` - Use when user wants: open menu, show sidebar
- `close_sidebar` - Use when user wants: close menu, hide sidebar

**Authentication:**
- `sign_out` - Use when user wants: sign out, logout

**Utilities:**
- `where_am_i` - Use when user asks: where am I, current page
- `help` - Use when user asks: help, what can you do

## How to Use Navigation Tools:

When the user requests navigation:
1. Identify which page/action they want
2. Call the appropriate CLIENT TOOL (don't try to call window.convaiNavigationTools directly)
3. Confirm with a brief response

Example interactions:
- User: "Show me the dashboard" → Call the `open_dashboard` tool → Say "Opening your dashboard now!"
- User: "Take me to WhatsApp reports" → Call the `show_whatsapp_reports` tool → Say "Loading WhatsApp analytics!"
- User: "Go back" → Call the `go_back` tool → Say "Going back!"

IMPORTANT: Use the CLIENT TOOLS, not JavaScript code in responses. The tools are already configured to execute the necessary code.
```

---

## Why It Wasn't Working

❌ **What you had:**
- System prompt telling AI to call `window.convaiNavigationTools.function()`
- No actual client tools configured
- AI couldn't execute JavaScript from prompt alone

✅ **What you need:**
- Client tools imported in ElevenLabs
- Each tool configured with JavaScript execution code
- System prompt telling AI WHEN to use each tool

---

## Quick Test After Setup

1. **Check Tools Are Imported**
   - Go to ElevenLabs dashboard
   - Tools section should show all 20 navigation tools

2. **Check One Tool's Configuration**
   - Click on `open_dashboard` tool
   - Verify it has execution code: `window.convaiNavigationTools.open_dashboard();`

3. **Test on Website**
   - Open your website
   - Click ElevenLabs widget
   - Say: "Show me the dashboard"
   - Should see: toast notification + page navigation

4. **Check Browser Console**
   - Open DevTools (F12)
   - Should see: `[ConvAI Navigator] Initialized with commands:`
   - When you give voice command, should see: `[ConvAI Navigator] Received command: open_dashboard`

---

## Complete Setup Checklist

- [ ] Import all 20 client tools from `elevenlabs-client-tools.json`
- [ ] For EACH tool, configure execution code: `window.convaiNavigationTools.TOOL_NAME();`
- [ ] Update system prompt (use the improved version above)
- [ ] Enable "Client-side execution" in agent settings
- [ ] Enable "Function calling" in agent settings
- [ ] Save all changes
- [ ] Test in browser console: `window.convaiNavigationTools`
- [ ] Test voice command: "Show me the dashboard"
- [ ] Verify toast notification appears
- [ ] Verify page actually navigates

---

## If It Still Doesn't Work

### Debug Steps:

1. **Check Browser Console**
   ```javascript
   // Should return object with all functions
   console.log(window.convaiNavigationTools);

   // Try calling directly
   window.convaiNavigationTools.open_dashboard();
   ```

2. **Check ElevenLabs Agent Logs**
   - Look for tool execution attempts
   - Check for errors

3. **Verify Tool Configuration**
   - Each tool should have "type": "client"
   - Each tool should have execution code set
   - Each tool should have "execution_mode": "immediate"

4. **Test One Tool at a Time**
   - Start with just `open_dashboard`
   - Get that working first
   - Then add others

---

## Alternative: If ElevenLabs Doesn't Support Client Tools

If your ElevenLabs plan doesn't support client tools, you can use **webhooks with postMessage**:

### Setup:

1. Create a webhook endpoint that returns JavaScript code
2. Configure agent to call webhook
3. Webhook returns:
   ```javascript
   window.postMessage({
     type: 'elevenlabs-convai-navigation',
     command: 'open_dashboard'
   }, '*');
   ```

This is more complex but works without client tools. Let me know if you need this approach.

---

## Summary

**The key issue:** System prompt ≠ Tool execution

You need:
1. ✅ Import client tools (JSON file provided)
2. ✅ Configure execution code for each tool
3. ✅ Update system prompt (provided above)
4. ✅ Enable client-side execution in agent settings

**Without step 1 & 2, the agent can't execute any navigation code!**
