# ElevenLabs Agent Navigation Setup

## Client Tools Configuration

In your ElevenLabs agent dashboard, configure these exact client tools:

### Navigation Tools

1. **navigate_to_dashboard**
   - Description: "Navigate to the main analytics dashboard"
   - Parameters: None
   - Returns: Success message

2. **navigate_to_home**
   - Description: "Navigate to the home page"
   - Parameters: None
   - Returns: Success message

3. **open_whatsapp_reports**
   - Description: "Open WhatsApp analytics reports page"
   - Parameters: None
   - Returns: Success message

4. **open_productivity_reports**
   - Description: "Open productivity analytics reports page"
   - Parameters: None
   - Returns: Success message

5. **open_ads_reports**
   - Description: "Open advertisement analytics reports page"
   - Parameters: None
   - Returns: Success message

6. **open_mail_reports**
   - Description: "Open email analytics reports page"
   - Parameters: None
   - Returns: Success message

7. **open_admin_settings**
   - Description: "Open admin settings page (admin only)"
   - Parameters: None
   - Returns: Success message

8. **open_bot_controls**
   - Description: "Open bot management and controls page"
   - Parameters: None
   - Returns: Success message

9. **open_social_posts**
   - Description: "Open social media posts management page"
   - Parameters: None
   - Returns: Success message

10. **open_courses_prices**
    - Description: "Open courses and pricing management page"
    - Parameters: None
    - Returns: Success message

### Dashboard Actions

11. **refresh_dashboard**
    - Description: "Refresh the dashboard data (starts 5-minute timer)"
    - Parameters: None
    - Returns: Success or error message

### Utility Tools

12. **scroll_to_top**
    - Description: "Scroll to the top of the current page"
    - Parameters: None
    - Returns: Success message

13. **get_current_page**
    - Description: "Get information about the current page"
    - Parameters: None
    - Returns: Current page information

14. **list_available_pages**
    - Description: "List all available pages the user can navigate to"
    - Parameters: None
    - Returns: List of available pages

## Agent Prompt Suggestions

Add this to your agent's system prompt:

```
You can help users navigate through the Professional Engineers Dashboard. You have access to client tools that can:

- Navigate to different pages (dashboard, reports, settings, etc.)
- Refresh the dashboard when needed
- Scroll to top of pages
- Get current page information

When users ask to go somewhere or open a page, use the appropriate navigation tool. For example:
- "Go to dashboard" → use navigate_to_dashboard
- "Open WhatsApp reports" → use open_whatsapp_reports
- "Refresh the dashboard" → use refresh_dashboard
- "Show me productivity reports" → use open_productivity_reports

Always confirm the navigation action to the user after executing it.
```

## Testing

1. Open browser developer console
2. You should see: "Navigation tools registered globally: [list of tool names]"
3. Test by asking the agent: "Go to the dashboard" or "Open WhatsApp reports"
4. The agent should execute the action and confirm it worked

## Troubleshooting

- Make sure all tool names in ElevenLabs match exactly (case-sensitive)
- Check browser console for any JavaScript errors
- Verify the agent has the tools configured in the dashboard
- Test individual tools by calling them manually: `window.navigate_to_dashboard()`