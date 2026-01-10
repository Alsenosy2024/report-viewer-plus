"""
Custom function tools for the LiveKit voice agent.

This module contains all custom tools that the agent can use, including:
- Website navigation tools
- DOM interaction tools (click elements, view reports by date)
"""

from livekit.agents import function_tool, RunContext
import logging
import json
import os

logger = logging.getLogger("agent-tools")

# Frontend base URL for navigation (from environment)
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "https://report-viewer-plus.lovable.app")


# ==================== NAVIGATION HELPER ====================

async def send_navigation_url(agent_instance, context: RunContext, url: str):
    """
    Helper function to send navigation URL to frontend via LiveKit data channel.

    Args:
        agent_instance: The agent instance (needed to access room)
        context: RunContext from the function tool
        url: URL or pathname to navigate to

    Returns:
        bool: True if navigation message was sent successfully
    """
    try:
        # Extract pathname from URL if it's a full URL
        if url.startswith('http://') or url.startswith('https://'):
            from urllib.parse import urlparse
            parsed = urlparse(url)
            pathname = parsed.path or '/'
        else:
            pathname = url if url.startswith('/') else f'/{url}'

        # Normalize pathname
        if pathname != '/' and pathname.endswith('/'):
            pathname = pathname.rstrip('/')
        if not pathname.startswith('/'):
            pathname = '/' + pathname

        logger.info(f"🔍 Normalized pathname: '{url}' -> '{pathname}'")

        # Validate inputs
        if not isinstance(pathname, str) or len(pathname) == 0:
            logger.error(f"❌ Invalid pathname: {pathname}")
            return False
        if not isinstance(url, str) or len(url) == 0:
            logger.error(f"❌ Invalid URL: {url}")
            return False

        # Clean invalid characters
        import re
        pathname = re.sub(r'[^\x20-\x7E\u0600-\u06FF/]', '', pathname)
        url = re.sub(r'[^\x20-\x7E\u0600-\u06FF/:.]', '', url)

        # Create navigation message
        message = {
            "type": "agent-navigation-url",
            "url": url,
            "pathname": pathname
        }

        message_json = json.dumps(message)
        message_bytes = message_json.encode('utf-8')

        # Validate message size
        if len(message_bytes) == 0:
            logger.error("❌ Navigation message bytes is empty")
            return False
        if len(message_bytes) > 64 * 1024:
            logger.error(f"❌ Message too large: {len(message_bytes)} bytes")
            return False

        logger.info(f"📤 Sending navigation: {url} -> {pathname}")

        # Get room from agent instance
        room = getattr(agent_instance, '_room', None)
        if not room:
            logger.error("❌ No room reference available")
            return False

        # Send via data channel
        import asyncio
        await asyncio.sleep(0.1)  # Small delay for room readiness

        try:
            topic_name = "agent-navigation"
            await room.local_participant.publish_data(
                message_bytes,
                reliable=True,
                topic=topic_name
            )
            logger.info(f"✅ Sent navigation via data channel: {pathname}")

            # Also send via metadata as fallback
            try:
                metadata_dict = {
                    "navigate": pathname,
                    "url": url,
                    "type": "navigation",
                    "pathname": pathname
                }
                metadata_json = json.dumps(metadata_dict)
                await room.local_participant.set_metadata(metadata_json)
                logger.info(f"✅ Set metadata with navigation: {pathname}")
            except Exception as e:
                logger.warning(f"Could not set metadata: {e}")

            return True

        except Exception as e:
            logger.error(f"❌ Failed to send navigation: {e}")
            return False

    except Exception as e:
        logger.error(f"❌ Navigation error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


async def send_dom_action(agent_instance, context: RunContext, action_type: str, target: dict, value: str = None):
    """
    Helper function to send DOM action to frontend via LiveKit data channel.

    Args:
        agent_instance: The agent instance (needed to access room)
        context: RunContext from the function tool
        action_type: Type of action (click, fill, read, focus, scroll)
        target: Target selector (dict with selector, index, id, text, role, date)
        value: Value for fill actions

    Returns:
        bool: True if action was sent successfully
    """
    try:
        import uuid
        action_id = str(uuid.uuid4())

        message = {
            "type": "dom-action",
            "actionId": action_id,
            "action": {
                "type": action_type,
                "target": target,
                "value": value
            }
        }

        message_json = json.dumps(message)
        message_bytes = message_json.encode('utf-8')

        # Validate message
        if len(message_bytes) == 0 or len(message_bytes) > 64 * 1024:
            logger.error(f"❌ Invalid message size: {len(message_bytes)} bytes")
            return False

        logger.info(f"📤 Sending DOM action: {action_type} on {target}")

        # Get room
        room = getattr(agent_instance, '_room', None)
        if not room:
            logger.error("❌ No room reference")
            return False

        # Send action
        topic_name = "dom-action"
        await room.local_participant.publish_data(
            message_bytes,
            reliable=True,
            topic=topic_name
        )
        logger.info(f"✅ Sent DOM action: {action_type}")
        return True

    except Exception as e:
        logger.error(f"❌ DOM action error: {e}")
        return False


# ==================== NAVIGATION TOOLS ====================

@function_tool
async def open_dashboard(context: RunContext):
    """Navigate to the main dashboard page.
    Use when user asks to:
    - Go to dashboard
    - Navigate to dashboard
    - Show dashboard
    - Open dashboard
    - Open main page
    - See overview/main page
    - Arabic: "عايز اروح على الداشبورد", "افتح الداشبورد", "وريني الداشبورد", "روح على الداشبورد", "عايز صفحة الداشبورد"
    """
    logger.info("🎯 open_dashboard called")
    agent = context.agent
    url = f"{FRONTEND_BASE_URL}/dashboard"
    await send_navigation_url(agent, context, url)
    return "NAVIGATE:/dashboard جاري فتح الداشبورد... Opening the dashboard..."


@function_tool
async def show_whatsapp_reports(context: RunContext):
    """Navigate to WhatsApp reports page.
    Use when user asks to:
    - Go to WhatsApp reports
    - Navigate to WhatsApp page
    - Show WhatsApp reports
    - Open WhatsApp reports
    - Show WhatsApp data/analytics
    - Arabic: "عايز اروح على تقارير الواتساب", "افتح تقارير الواتساب", "وريني تقارير الواتساب"
    """
    logger.info("🎯 show_whatsapp_reports called")
    agent = context.agent
    url = f"{FRONTEND_BASE_URL}/whatsapp-reports"
    await send_navigation_url(agent, context, url)
    return "NAVIGATE:/whatsapp-reports جاري فتح تقارير الواتساب... Opening WhatsApp reports..."


@function_tool
async def show_productivity_reports(context: RunContext):
    """Navigate to productivity reports page.

    Use when user asks to:
    - Go to productivity reports
    - Navigate to productivity page
    - Show productivity reports
    - Redirect to productivity reports
    - Arabic: "عايز اروح على صفحة الإنتاجية", "افتح تقارير الإنتاجية", "وريني صفحة الإنتاجية", "روح على تقارير الإنتاجية"

    **CRITICAL**: If user mentions a SPECIFIC DATE (e.g., "productivity report of 2 nov 2025", "عايز تقرير الإنتاجية بتاع 2 نوفمبر"),
    you MUST use view_report_by_date() function instead! DO NOT use this function when a date is mentioned.
    """
    logger.info("🎯 show_productivity_reports called")
    agent = context.agent
    url = f"{FRONTEND_BASE_URL}/productivity-reports"
    await send_navigation_url(agent, context, url)
    return "NAVIGATE:/productivity-reports جاري فتح تقارير الإنتاجية... Opening productivity reports..."


@function_tool
async def show_ads_reports(context: RunContext):
    """Navigate to advertising reports page.
    Use when user asks to:
    - Go to ads/advertising reports
    - Navigate to ads page
    - Show ads reports
    - Open advertising reports
    - Arabic: "عايز اروح على تقارير الإعلانات", "افتح تقارير الإعلانات"
    """
    logger.info("🎯 show_ads_reports called")
    agent = context.agent
    url = f"{FRONTEND_BASE_URL}/ads-reports"
    await send_navigation_url(agent, context, url)
    return "NAVIGATE:/ads-reports جاري فتح تقارير الإعلانات... Opening ads reports..."


@function_tool
async def show_mail_reports(context: RunContext):
    """Navigate to email reports page.
    Use when user asks to:
    - Go to email/mail reports page
    - Navigate to email reports
    - Show mail reports
    - Open email reports
    - Arabic: "عايز اروح على تقارير الإيميلات", "افتح تقارير البريد"
    """
    logger.info("🎯 show_mail_reports called")
    agent = context.agent
    url = f"{FRONTEND_BASE_URL}/mail-reports"
    await send_navigation_url(agent, context, url)
    return "NAVIGATE:/mail-reports جاري فتح تقارير الإيميلات... Opening mail reports..."


@function_tool
async def open_bots(context: RunContext):
    """Navigate to bot controls page.
    Use when user asks to:
    - Go to bots/bot controls
    - Navigate to bots page
    - Show bots
    - Open bot controls
    - Arabic: "عايز اروح على البوتات", "افتح صفحة البوتات"
    """
    logger.info("🎯 open_bots called")
    agent = context.agent
    url = f"{FRONTEND_BASE_URL}/bots"
    await send_navigation_url(agent, context, url)
    return "NAVIGATE:/bots جاري فتح صفحة البوتات... Opening bots page..."


@function_tool
async def show_social_posts(context: RunContext):
    """Navigate to social media posts page.
    Use when user asks to:
    - Go to social posts/social media
    - Navigate to social posts page
    - Show social posts
    - Open social media posts
    - Arabic: "عايز اروح على البوستات", "افتح صفحة السوشيال ميديا"
    """
    logger.info("🎯 show_social_posts called")
    agent = context.agent
    url = f"{FRONTEND_BASE_URL}/social-posts"
    await send_navigation_url(agent, context, url)
    return "NAVIGATE:/social-posts جاري فتح صفحة البوستات... Opening social posts..."


@function_tool
async def show_content_ideas(context: RunContext):
    """Navigate to content ideas page.
    Use when user asks to:
    - Go to content ideas
    - Navigate to content ideas page
    - Show content ideas
    - Open content ideas
    - Arabic: "عايز اروح على الأفكار", "افتح أفكار المحتوى"
    """
    logger.info("🎯 show_content_ideas called")
    agent = context.agent
    url = f"{FRONTEND_BASE_URL}/content-ideas"
    await send_navigation_url(agent, context, url)
    return "NAVIGATE:/content-ideas جاري فتح صفحة الأفكار... Opening content ideas..."


@function_tool
async def show_meeting_summary(context: RunContext):
    """Navigate to meeting summary page.
    Use when user asks to:
    - Go to meeting summary
    - Navigate to meetings page
    - Show meetings
    - Open meeting notes
    - Arabic: "عايز اروح على الاجتماعات", "افتح ملخص الاجتماعات"
    """
    logger.info("🎯 show_meeting_summary called")
    agent = context.agent
    url = f"{FRONTEND_BASE_URL}/meeting-summary"
    await send_navigation_url(agent, context, url)
    return "NAVIGATE:/meeting-summary جاري فتح صفحة الاجتماعات... Opening meeting summary..."


@function_tool
async def show_courses_prices(context: RunContext):
    """Navigate to courses and pricing page.
    Use when user asks to:
    - Go to courses/courses prices
    - Navigate to courses page
    - Show courses
    - Open course pricing
    - Arabic: "عايز اروح على الكورسات", "افتح صفحة أسعار الكورسات"
    """
    logger.info("🎯 show_courses_prices called")
    agent = context.agent
    url = f"{FRONTEND_BASE_URL}/courses-prices"
    await send_navigation_url(agent, context, url)
    return "NAVIGATE:/courses-prices جاري فتح صفحة الكورسات... Opening courses and prices..."


@function_tool
async def go_home(context: RunContext):
    """Navigate to home page.
    Use when user asks to:
    - Go home
    - Navigate to home
    - Show home page
    - Go to homepage
    - Arabic: "عايز اروح على الصفحة الرئيسية", "افتح الهوم"
    """
    logger.info("🎯 go_home called")
    agent = context.agent
    url = f"{FRONTEND_BASE_URL}/"
    await send_navigation_url(agent, context, url)
    return "NAVIGATE:/ جاري فتح الصفحة الرئيسية... Opening home page..."


@function_tool
async def where_am_i(context: RunContext):
    """Ask the frontend to tell user their current page location. This does NOT navigate - it just shows current location."""
    return "I can see you're currently on the page. To help you navigate, just tell me where you'd like to go - like 'show me the dashboard' or 'open WhatsApp reports'."


@function_tool
async def open_admin_settings(context: RunContext):
    """Navigate to admin settings page.
    Use when user asks to:
    - Go to admin settings/settings
    - Navigate to settings
    - Show settings
    - Open admin panel
    - Arabic: "عايز اروح على الإعدادات", "افتح صفحة الأدمن"
    """
    logger.info("🎯 open_admin_settings called")
    agent = context.agent
    url = f"{FRONTEND_BASE_URL}/admin/settings"
    await send_navigation_url(agent, context, url)
    return "NAVIGATE:/admin/settings جاري فتح صفحة الإعدادات... Opening admin settings..."


@function_tool
async def show_awaiting_approval(context: RunContext):
    """Navigate to awaiting approval page.
    Use when user asks to:
    - Go to awaiting approval
    - Navigate to approval page
    - Show pending approvals
    - Open awaiting approval
    - Arabic: "عايز اروح على الموافقات", "افتح الموافقات المعلقة"
    """
    logger.info("🎯 show_awaiting_approval called")
    agent = context.agent
    url = f"{FRONTEND_BASE_URL}/awaiting-approval"
    await send_navigation_url(agent, context, url)
    return "NAVIGATE:/awaiting-approval جاري فتح الموافقات... Opening awaiting approval page..."


# ==================== DOM INTERACTION TOOLS ====================

@function_tool
async def click_element(context: RunContext, element_text: str = None, element_id: str = None, element_index: int = None):
    """Click a button or interactive element on the current page.

    Use when user asks to:
    - Click a button
    - Press a button
    - Select an option
    - Arabic: "اضغط على...", "اضغط الزر...", "اختر...", "اعمل كليك على..."

    Args:
        element_text: Text content of the element to click (e.g., "Submit", "Send", "Save", "View Report")
        element_id: ID of the element to click
        element_index: Index of the element if multiple matches (0-based)
    """
    logger.info(f"🔧 click_element called")
    logger.info(f"   element_text: {element_text}")
    logger.info(f"   element_id: {element_id}")
    logger.info(f"   element_index: {element_index}")

    agent = context.agent
    target = {}
    if element_id:
        target["id"] = element_id
    if element_text:
        target["text"] = element_text
    if element_index is not None:
        target["index"] = element_index

    success = await send_dom_action(agent, context, "click", target)

    if success:
        return f"Clicked element: {element_text or element_id or 'element'}"
    else:
        return f"Failed to click element: {element_text or element_id or 'element'}"


@function_tool
async def view_report_by_date(context: RunContext, report_type: str = None, date: str = None):
    """View a specific report by date on the report card page.

    **CRITICAL**: Use this function when user asks for a SPECIFIC report with a DATE mentioned.

    Examples when to use this function:
    - "Get me productivity report of 2 nov 2025" → use this function
    - "I need productivity report of 2 november 2025" → use this function
    - "عايز تقرير الإنتاجية بتاع 2 نوفمبر" → use this function
    - "Show me report for January 15, 2025" → use this function
    - "I need specific report" + mentions date → use this function

    **DO NOT use show_*_reports() functions when a date is mentioned - ALWAYS use this function instead.**

    This function will:
    1. Navigate to the appropriate report page
    2. Wait for page to load
    3. Find the report card with the matching date
    4. Click the "View Report" button

    Args:
        report_type: Type of report - "whatsapp", "productivity", "ads", "mail" (optional, will detect from context)
        date: Date in various formats (e.g., "2 nov 2025", "2 november 2025", "November 2, 2025", "2025-11-02", "2/11/2025")
    """
    logger.info(f"🔧 view_report_by_date called")
    logger.info(f"   report_type: {report_type}")
    logger.info(f"   date: {date}")

    agent = context.agent

    # Determine report type
    if not report_type:
        report_type = "whatsapp"  # Default
        logger.info(f"   Using default report_type: {report_type}")

    # Map report types to URLs
    report_urls = {
        "whatsapp": "/whatsapp-reports",
        "productivity": "/productivity-reports",
        "ads": "/ads-reports",
        "mail": "/mail-reports",
        "email": "/mail-reports"
    }

    report_url = report_urls.get(report_type.lower(), "/whatsapp-reports")

    # Step 1: Navigate to the report page
    logger.info(f"   Step 1: Navigating to: {report_url}")
    await send_navigation_url(agent, context, f"{FRONTEND_BASE_URL}{report_url}")

    # Step 2: Wait for page to load
    import asyncio
    logger.info(f"   Step 2: Waiting 3 seconds for page to load...")
    await asyncio.sleep(3)

    # Step 3: Send DOM action to find card by date and click View Report button
    target = {
        "text": "View Report",
        "date": date or ""
    }

    logger.info(f"   Step 3: Searching for report with date: {date}")
    success = await send_dom_action(agent, context, "click", target)

    if success:
        logger.info(f"✅ Successfully sent command to view report for date: {date}")
        return f"Opening report for {date} on {report_type} reports page..."
    else:
        logger.error(f"❌ Failed to send command to view report")
        return f"Failed to open report for {date}. Please try navigating to {report_type} reports page manually."


# ==================== TOOL EXPORTS ====================

# List of all navigation tools to be registered with the agent
NAVIGATION_TOOLS = [
    open_dashboard,
    show_whatsapp_reports,
    show_productivity_reports,
    show_ads_reports,
    show_mail_reports,
    open_bots,
    show_social_posts,
    show_content_ideas,
    show_meeting_summary,
    show_courses_prices,
    go_home,
    where_am_i,
    open_admin_settings,
    show_awaiting_approval,
]

# List of DOM interaction tools
DOM_TOOLS = [
    click_element,
    view_report_by_date,
]

# All tools combined
ALL_TOOLS = NAVIGATION_TOOLS + DOM_TOOLS
