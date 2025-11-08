"""
LiveKit Voice AI Agent
A modern voice assistant implementation using LiveKit Agents framework
Based on: https://github.com/livekit-examples/agent-starter-python
"""

import logging
import json
from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    WorkerOptions,
    cli,
    metrics,
    stt,
    function_tool,
    RunContext,
)

# Import plugins at module level (required for proper plugin registration)
# Using OpenAI for LLM/TTS, Deepgram for streaming STT with Arabic support, and Tavus for video avatar
from livekit.plugins import openai, deepgram, tavus
import os

# Initialize logger first (needed for MCP import error handling)
logger = logging.getLogger("voice-agent")

# Import MCP (Model Context Protocol) support for external tool integration
# Make imports optional - agent works without MCP if not installed
try:
    from mcp_client import MCPServerSse
    from mcp_client.agent_tools import MCPToolsIntegration
    MCP_AVAILABLE = True
except ImportError:
    logger.warning("MCP client not available - agent will run without MCP tools")
    MCPServerSse = None
    MCPToolsIntegration = None
    MCP_AVAILABLE = False

# Load environment variables from .env or .env.local
load_dotenv(".env.local")
load_dotenv()

# Frontend base URL for navigation (from environment)
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "https://report-viewer-plus.lovable.app")


class VoiceAssistant(Agent):
    """
    A helpful voice AI assistant that can interact with users through voice in Egyptian Arabic
    """
    
    def __init__(self, instructions_file: str = "prompts/agent_instructions.txt") -> None:
        # Load instructions from external file for easier prompt management
        try:
            with open(instructions_file, "r", encoding="utf-8") as f:
                instructions = f.read()
        except FileNotFoundError:
            logger.warning(f"Instructions file '{instructions_file}' not found, using default")
            instructions = "You are a helpful AI assistant."

        super().__init__(instructions=instructions)
        # Store room reference when it becomes available
        self._room = None
    
    def set_room(self, room):
        """Store reference to the LiveKit room for use in function tools"""
        self._room = room
        logger.info(f"Room reference stored in agent instance")
    
    @property
    def room(self):
        """Get the stored room reference"""
        return self._room

    # Navigation function tools - allow agent to navigate the website
    async def _send_navigation_url(self, context: RunContext, url: str):
        """Send a navigation URL to the frontend via LiveKit data channel"""
        try:
            # Extract pathname from URL if it's a full URL, or use as-is if it's already a path
            if url.startswith('http://') or url.startswith('https://'):
                from urllib.parse import urlparse
                parsed = urlparse(url)
                pathname = parsed.path or '/'
            else:
                pathname = url if url.startswith('/') else f'/{url}'
            
            # Normalize pathname: remove trailing slash except for root
            if pathname != '/' and pathname.endswith('/'):
                pathname = pathname.rstrip('/')
            
            # Ensure pathname starts with /
            if not pathname.startswith('/'):
                pathname = '/' + pathname
            
            logger.info(f"🔍 Normalized pathname: '{url}' -> '{pathname}'")
            
            # Send both full URL and pathname for compatibility
            message = {
                "type": "agent-navigation-url",
                "url": url,  # Full URL for logging
                "pathname": pathname  # Normalized relative path for navigation
            }
            
            message_json = json.dumps(message)
            message_bytes = message_json.encode('utf-8')
            
            logger.info(f"Preparing to send navigation: {url} -> {pathname}")
            logger.info(f"Message JSON: {message_json}")
            logger.info(f"Message size: {len(message_bytes)} bytes")
            
            # Access room - try multiple methods
            room = None
            try:
                # Method 1: Try self._room (stored when agent starts)
                if self._room:
                    room = self._room
                    logger.info(f"Found room via self._room")
                # Method 2: Try context.agent.room (property accessor)
                elif hasattr(context, 'agent') and hasattr(context.agent, 'room'):
                    room = context.agent.room
                    logger.info(f"Found room via context.agent.room")
                # Method 3: Try context.agent._room (direct access)
                elif hasattr(context, 'agent') and hasattr(context.agent, '_room'):
                    room = context.agent._room
                    logger.info(f"Found room via context.agent._room")
                # Method 4: Try getting room from session's room_io or other attributes
                elif hasattr(context, 'agent') and hasattr(context.agent, 'session'):
                    session = context.agent.session
                    # Session might have room_io or other way to access room
                    if hasattr(session, 'room_io') and hasattr(session.room_io, 'room'):
                        room = session.room_io.room
                        logger.info(f"Found room via context.agent.session.room_io.room")
                    elif hasattr(session, '_room'):
                        room = session._room
                        logger.info(f"Found room via context.agent.session._room")
                    else:
                        logger.info(f"Session attributes: {[a for a in dir(session) if not a.startswith('__')]}")
                # Method 5: Try context.room directly
                elif hasattr(context, 'room'):
                    room = context.room
                    logger.info(f"Found room via context.room")
                else:
                    logger.error("Cannot find room. Context attributes: " + str([a for a in dir(context) if not a.startswith('__')]))
                    if hasattr(context, 'agent'):
                        logger.error("Agent attributes: " + str([a for a in dir(context.agent) if not a.startswith('__')]))
                    return False
            except Exception as e:
                logger.error(f"Error accessing room: {e}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                return False
            
            if not room:
                logger.error("Room is None!")
                return False
                
            logger.info(f"Room participants: {len(room.remote_participants)}")
            
            # Send data message to all remote participants
            # Try multiple methods to ensure it works
            sent = False
            
            logger.info(f"📤 Attempting to send navigation data: {pathname}")
            logger.info(f"   Message bytes: {len(message_bytes)} bytes")
            logger.info(f"   Remote participants: {len(room.remote_participants)}")
            logger.info(f"   Message content: {message_json}")
            logger.info(f"   Room name: {room.name}")
            logger.info(f"   Room state: {room.state if hasattr(room, 'state') else 'unknown'}")
            logger.info(f"   Local participant identity: {room.local_participant.identity if hasattr(room.local_participant, 'identity') else 'unknown'}")
            
            # Send multiple times to ensure delivery (with small delays)
            max_attempts = 3
            sent_count = 0
            for attempt in range(max_attempts):
                try:
                    # Method 1: Try with topic "agent-navigation" (matches useDataChannel hook)
                    import inspect
                    sig = inspect.signature(room.local_participant.publish_data)
                    logger.info(f"   publish_data signature: {sig}")
                    
                    if 'topic' in sig.parameters:
                        logger.info(f"   ✅ Topic parameter supported, sending with topic 'agent-navigation'")
                        await room.local_participant.publish_data(
                            message_bytes,
                            reliable=True,
                            topic="agent-navigation"  # This topic matches the useDataChannel hook
                        )
                        sent_count += 1
                        logger.info(f"✅✅✅ Attempt {attempt + 1}/{max_attempts}: SUCCESSFULLY sent navigation URL via data channel with topic 'agent-navigation': {url} -> {pathname} ✅✅✅")
                        sent = True
                    else:
                        # Topic not supported, try without topic
                        logger.info(f"   ⚠️ Topic parameter NOT supported, sending without topic")
                        await room.local_participant.publish_data(
                            message_bytes,
                            reliable=True
                        )
                        sent_count += 1
                        logger.info(f"✅✅✅ Attempt {attempt + 1}/{max_attempts}: SUCCESSFULLY sent navigation URL via data channel (no topic): {url} -> {pathname} ✅✅✅")
                        sent = True
                    
                    # Small delay between attempts (except last)
                    if attempt < max_attempts - 1:
                        import asyncio
                        await asyncio.sleep(0.2)  # 200ms delay between sends
                        
                except Exception as e:
                    logger.error(f"❌❌❌ Attempt {attempt + 1}/{max_attempts} FAILED: {e} ❌❌❌")
                    import traceback
                    logger.error(f"Traceback: {traceback.format_exc()}")
                    if attempt < max_attempts - 1:
                        import asyncio
                        await asyncio.sleep(0.2)  # Wait before retry
                    else:
                        logger.error(f"❌❌❌ All {max_attempts} attempts failed to send data channel message ❌❌❌")
            
            logger.info(f"📊 FINAL RESULT: Sent {sent_count}/{max_attempts} data channel messages successfully")
            
            # Log remote participants for debugging
            if len(room.remote_participants) == 0:
                logger.warning("⚠️ No remote participants found! Data may not be delivered.")
            else:
                logger.info(f"📡 Remote participants that should receive data:")
                for pid, participant in room.remote_participants.items():
                    logger.info(f"   - {participant.identity} (sid: {pid})")
            
            # FALLBACK: Use participant metadata to send navigation command
            # This is more reliable than data channel in some LiveKit configurations
            # Always send metadata as backup/alternative method
            try:
                # Set agent's metadata with navigation command
                # Frontend will listen for metadata changes
                metadata = json.dumps({
                    "navigate": pathname,
                    "url": url,
                    "type": "navigation",
                    "pathname": pathname  # Explicit pathname for frontend
                })
                await room.local_participant.set_metadata(metadata)
                logger.info(f"✅ Set metadata with navigation: {pathname}")
            except Exception as e:
                logger.error(f"Failed to set metadata: {e}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
            
            if not sent:
                logger.warning("⚠️ Could not send navigation data via data channel!")
                logger.info(f"✅ But navigation command is in response text and metadata")
            
            # Always return True so the function completes, even if data channel fails
            # The response text will still be spoken
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send navigation URL: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False

    @function_tool
    async def open_dashboard(self, context: RunContext):
        """Navigate to the main dashboard page.
        Use when user asks to:
        - Go to dashboard
        - Navigate to dashboard
        - Show dashboard
        - Redirect to dashboard
        - Open dashboard
        - See overview/main page
        - Arabic: "عايز اروح على الداشبورد", "افتح الداشبورد", "وريني الداشبورد", "روح على الداشبورد", "عايز صفحة الداشبورد"
        """
        logger.info("🎯🎯🎯 open_dashboard FUNCTION CALLED! 🎯🎯🎯")
        # Send relative path to avoid origin issues
        url = f"{FRONTEND_BASE_URL}/dashboard"
        logger.info(f"Calling _send_navigation_url with: {url}")
        result = await self._send_navigation_url(context, url)
        logger.info(f"_send_navigation_url returned: {result}")
        return "NAVIGATE:/dashboard جاري فتح الداشبورد... Opening the dashboard..."

    @function_tool
    async def show_whatsapp_reports(self, context: RunContext):
        """Navigate to WhatsApp reports page.
        Use when user asks to:
        - Go to WhatsApp reports
        - Navigate to WhatsApp page
        - Show WhatsApp reports
        - Redirect to WhatsApp reports
        - Open WhatsApp reports
        - Arabic: "عايز اروح على صفحة الواتساب", "افتح تقارير الواتساب", "وريني صفحة الواتساب", "روح على تقارير الواتساب"
        """
        logger.info("🎯🎯🎯 show_whatsapp_reports FUNCTION CALLED! 🎯🎯🎯")
        url = f"{FRONTEND_BASE_URL}/whatsapp-reports"
        logger.info(f"Calling _send_navigation_url with: {url}")
        await self._send_navigation_url(context, url)
        logger.info("_send_navigation_url completed, returning response")
        # Include navigation marker in response for fallback parsing
        # Frontend will parse "NAVIGATE:/whatsapp-reports" from the response
        return "NAVIGATE:/whatsapp-reports جاري فتح تقارير الواتساب... Opening WhatsApp reports..."

    @function_tool
    async def show_productivity_reports(self, context: RunContext):
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
        logger.info("🎯🎯🎯 show_productivity_reports FUNCTION CALLED! 🎯🎯🎯")
        url = f"{FRONTEND_BASE_URL}/productivity-reports"
        await self._send_navigation_url(context, url)
        return "NAVIGATE:/productivity-reports جاري فتح تقارير الإنتاجية... Opening productivity reports..."

    @function_tool
    async def show_ads_reports(self, context: RunContext):
        """Navigate to advertising reports page.
        Use when user asks to:
        - Go to ads/advertising reports
        - Navigate to ads page
        - Show ads reports
        - Redirect to ads reports
        - Arabic: "عايز اروح على صفحة الإعلانات", "افتح تقارير الإعلانات", "وريني صفحة الإعلانات", "روح على تقارير الإعلانات"
        """
        url = f"{FRONTEND_BASE_URL}/ads-reports"
        await self._send_navigation_url(context, url)
        return "NAVIGATE:/ads-reports جاري فتح تقارير الإعلانات... Opening advertising reports..."

    @function_tool
    async def show_mail_reports(self, context: RunContext):
        """Navigate to email reports page. 
        Use when user asks to:
        - Go to email/mail reports page
        - Navigate to email reports
        - Show email reports
        - Redirect to mail reports
        - Open mail/email page
        - Arabic: "عايز اروح على صفحة الايميلات", "افتح تقارير الايميل", "عايز صفحة البريد", "روح على صفحة الايميلات", "وريني صفحة الايميلات"
        """
        url = f"{FRONTEND_BASE_URL}/mail-reports"
        await self._send_navigation_url(context, url)
        return "NAVIGATE:/mail-reports جاري فتح تقارير الإيميلات... Opening email reports..."

    @function_tool
    async def open_bots(self, context: RunContext):
        """Navigate to bot controls page.
        Use when user asks to:
        - Go to bots/bot controls
        - Navigate to bots page
        - Show bot controls
        - Redirect to bots
        - Arabic: "عايز اروح على صفحة البوتات", "افتح البوتات", "وريني صفحة البوتات", "روح على البوتات"
        """
        url = f"{FRONTEND_BASE_URL}/bots"
        await self._send_navigation_url(context, url)
        return "NAVIGATE:/bots جاري فتح البوتات... Opening bot controls..."

    @function_tool
    async def show_social_posts(self, context: RunContext):
        """Navigate to social media posts page.
        Use when user asks to:
        - Go to social posts/social media
        - Navigate to social posts page
        - Show social posts
        - Redirect to social posts
        - Arabic: "عايز اروح على صفحة السوشيال", "افتح منشورات السوشيال ميديا", "وريني صفحة السوشيال", "روح على صفحة السوشيال"
        """
        url = f"{FRONTEND_BASE_URL}/social-posts"
        await self._send_navigation_url(context, url)
        return "NAVIGATE:/social-posts جاري فتح منشورات السوشيال... Opening social media posts..."

    @function_tool
    async def show_content_ideas(self, context: RunContext):
        """Navigate to content ideas page.
        Use when user asks to:
        - Go to content ideas
        - Navigate to content ideas page
        - Show content ideas
        - Redirect to content ideas
        - Arabic: "عايز اروح على صفحة أفكار المحتوى", "افتح أفكار المحتوى", "وريني صفحة أفكار المحتوى", "روح على أفكار المحتوى"
        """
        url = f"{FRONTEND_BASE_URL}/content-ideas"
        await self._send_navigation_url(context, url)
        return "NAVIGATE:/content-ideas جاري فتح أفكار المحتوى... Opening content ideas..."

    @function_tool
    async def show_meeting_summary(self, context: RunContext):
        """Navigate to meeting summary page.
        Use when user asks to:
        - Go to meeting summary
        - Navigate to meetings page
        - Show meeting summary
        - Redirect to meeting summary
        - Arabic: "عايز اروح على صفحة ملخص الاجتماعات", "افتح ملخص الاجتماعات", "وريني صفحة الاجتماعات", "روح على ملخص الاجتماعات"
        """
        url = f"{FRONTEND_BASE_URL}/meeting-summary"
        await self._send_navigation_url(context, url)
        return "NAVIGATE:/meeting-summary جاري فتح ملخص الاجتماعات... Opening meeting summary..."

    @function_tool
    async def show_courses_prices(self, context: RunContext):
        """Navigate to courses and pricing page.
        Use when user asks to:
        - Go to courses/courses prices
        - Navigate to courses page
        - Show courses and prices
        - Redirect to courses
        - Arabic: "عايز اروح على صفحة الكورسات", "افتح الكورسات والأسعار", "وريني صفحة الكورسات", "روح على الكورسات"
        """
        url = f"{FRONTEND_BASE_URL}/courses-prices"
        await self._send_navigation_url(context, url)
        return "NAVIGATE:/courses-prices جاري فتح الكورسات والأسعار... Opening courses and pricing..."

    @function_tool
    async def go_home(self, context: RunContext):
        """Navigate to home page.
        Use when user asks to:
        - Go home
        - Navigate to home
        - Go to home page
        - Redirect to home
        - Arabic: "عايز اروح على الصفحة الرئيسية", "افتح الصفحة الرئيسية", "روح على البيت", "وريني الصفحة الرئيسية"
        """
        url = f"{FRONTEND_BASE_URL}/"
        await self._send_navigation_url(context, url)
        return "NAVIGATE:/ جاري فتح الصفحة الرئيسية... Going to home page..."

    @function_tool
    async def where_am_i(self, context: RunContext):
        """Ask the frontend to tell user their current page location. This does NOT navigate - it just shows current location."""
        # This tool doesn't navigate - it's informational only
        # The frontend can show current URL via window.location.pathname
        return "I can see you're currently on the page. To help you navigate, just tell me where you'd like to go - like 'show me the dashboard' or 'open WhatsApp reports'."

    @function_tool
    async def open_admin_settings(self, context: RunContext):
        """Navigate to admin settings page.
        Use when user asks to:
        - Go to admin settings/settings
        - Navigate to settings
        - Show settings page
        - Redirect to admin settings
        - Arabic: "عايز اروح على الإعدادات", "افتح الإعدادات", "وريني صفحة الإعدادات", "روح على الإعدادات"
        """
        url = f"{FRONTEND_BASE_URL}/admin/settings"
        await self._send_navigation_url(context, url)
        return "NAVIGATE:/admin/settings جاري فتح الإعدادات... Opening admin settings..."

    @function_tool
    async def show_awaiting_approval(self, context: RunContext):
        """Navigate to awaiting approval page.
        Use when user asks to:
        - Go to awaiting approval
        - Navigate to approval page
        - Show pending approvals
        - Redirect to awaiting approval
        - Arabic: "عايز اروح على صفحة الموافقات", "افتح الموافقات المعلقة", "وريني صفحة الموافقات", "روح على الموافقات"
        """
        url = f"{FRONTEND_BASE_URL}/awaiting-approval"
        await self._send_navigation_url(context, url)
        return "NAVIGATE:/awaiting-approval جاري فتح الموافقات... Opening awaiting approval page..."

    # DOM Interaction tools - allow agent to interact with page elements
    async def _send_dom_action(self, context: RunContext, action_type: str, target: dict, value: str = None, action_id: str = None):
        """Send a DOM interaction command to the frontend via LiveKit data channel"""
        try:
            import uuid
            action_id = action_id or str(uuid.uuid4())
            
            message = {
                "type": "dom-action",
                "actionId": action_id,
                "action": {
                    "type": action_type,  # click, fill, read, focus, scroll
                    "target": target,  # {selector, index, id, text, role, date}
                    "value": value  # For fill actions
                }
            }
            
            message_json = json.dumps(message)
            message_bytes = message_json.encode('utf-8')
            
            logger.info(f"📤 Sending DOM action: {action_type} on {target}")
            
            room = self._room
            if not room:
                logger.error("Room not available for DOM action")
                return False
            
            try:
                await room.local_participant.publish_data(
                    message_bytes,
                    reliable=True,
                    topic="dom-action"
                )
                logger.info(f"✅ Sent DOM action via data channel: {action_type}")
                return True
            except Exception as e:
                logger.error(f"Failed to send DOM action: {e}")
                return False
        except Exception as e:
            logger.error(f"❌ Failed to send DOM action: {e}")
            return False

    @function_tool
    async def click_element(self, context: RunContext, element_text: str = None, element_id: str = None, element_index: int = None):
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
        logger.info(f"🔧 click_element FUNCTION CALLED!")
        logger.info(f"   element_text: {element_text}")
        logger.info(f"   element_id: {element_id}")
        logger.info(f"   element_index: {element_index}")
        
        target = {}
        if element_id:
            target["id"] = element_id
        if element_text:
            target["text"] = element_text
        if element_index is not None:
            target["index"] = element_index
        
        success = await self._send_dom_action(context, "click", target)
        
        if success:
            return f"Clicked element: {element_text or element_id or 'element'}"
        else:
            return f"Failed to click element: {element_text or element_id or 'element'}"

    @function_tool
    async def view_report_by_date(self, context: RunContext, report_type: str = None, date: str = None):
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
        from datetime import datetime
        
        logger.info(f"🔧🔧🔧 view_report_by_date FUNCTION CALLED! 🔧🔧🔧")
        logger.info(f"   report_type: {report_type}")
        logger.info(f"   date: {date}")
        
        # Determine report type from context if not provided
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
        await self._send_navigation_url(context, f"{FRONTEND_BASE_URL}{report_url}")
        
        # Step 2: Wait a bit for page to load, then send DOM action to find and click the "View Report" button for the date
        import asyncio
        logger.info(f"   Step 2: Waiting 3 seconds for page to load...")
        await asyncio.sleep(3)  # Wait 3 seconds for page to load
        
        # Step 3: Send DOM action to find card by date and click View Report button
        target = {
            "text": "View Report",  # Find View Report button
            "date": date or ""  # Additional context for date matching
        }
        
        logger.info(f"   Step 3: Searching for report with date: {date}")
        logger.info(f"   Target: {target}")
        success = await self._send_dom_action(context, "click", target)
        
        if success:
            logger.info(f"✅✅✅ Successfully sent command to view report for date: {date} ✅✅✅")
            return f"Opening report for {date} on {report_type} reports page..."
        else:
            logger.error(f"❌ Failed to send command to view report")
            return f"Failed to open report for {date}. Please try navigating to {report_type} reports page manually."


def prewarm(proc: JobProcess):
    """
    Prewarm function to load models before the agent starts
    This improves startup time for the first request

    Note: Silero VAD is disabled on Windows due to ONNX runtime DLL issues
    The agent will use STT-based voice activity detection instead
    """
    logger.info("Prewarming models...")
    # Skip VAD loading on Windows - use STT-based detection instead
    proc.userdata["vad"] = None
    logger.info("Using STT-based voice activity detection (Windows compatible)")


async def entrypoint(ctx: JobContext):
    """
    Main entry point for the voice agent
    Called when a new room connection is established
    """
    # Add contextual information to all log entries
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    logger.info(f"Starting voice agent for room: {ctx.room.name}")

    # Use OpenAI Realtime API - handles STT, LLM, and TTS together
    # This is the simplest and most reliable solution for Arabic
    logger.info("Using OpenAI Realtime API for complete Arabic voice support")

    session = AgentSession(
        # OpenAI Realtime API handles everything: STT, LLM, TTS
        llm=openai.realtime.RealtimeModel(
            model="gpt-realtime-mini",  # Latest mini voice model - 70% cheaper than previous realtime models
            voice="alloy",  # Professional, neutral voice - Options: alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar
        ),
    )

    room_input_options = RoomInputOptions()
    
    # Ensure we accept microphone input
    # Default should be SOURCE_MICROPHONE, but let's be explicit
    logger.info(f"Room input options - accepted sources: {room_input_options.accepted_sources if hasattr(room_input_options, 'accepted_sources') else 'default'}")

    # Set up metrics collection to monitor performance
    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        """Log metrics when they are collected"""
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        """Log usage summary on shutdown"""
        summary = usage_collector.get_summary()
        logger.info(f"Usage Summary: {summary}")

    # Register shutdown callback
    ctx.add_shutdown_callback(log_usage)

    # Add event handlers for debugging
    @session.on("agent_started_speaking")
    def _on_agent_started_speaking():
        logger.info("Agent started speaking")

    @session.on("agent_stopped_speaking")
    def _on_agent_stopped_speaking():
        logger.info("Agent stopped speaking")

    # Capture agent's response text for navigation parsing
    agent_responses = []  # Store recent responses
    
    @session.on("agent_response")
    def _on_agent_response(response):
        """Capture agent's text response for navigation parsing"""
        response_text = str(response) if response else ""
        agent_responses.append(response_text)
        logger.info(f"Agent response captured: {response_text[:100]}")  # Log first 100 chars
        
        # Check if response contains navigation command
        import re
        nav_match = re.search(r'NAVIGATE:(\/[^\s]*)', response_text)
        if nav_match:
            path = nav_match.group(1)
            logger.info(f"🎯🎯🎯 NAVIGATION COMMAND DETECTED IN RESPONSE: {path} 🎯🎯🎯")
    
    @session.on("function_called")
    def _on_function_called(func_call):
        """Log when functions are called"""
        logger.info(f"🔧 Function called: {func_call.name if hasattr(func_call, 'name') else func_call}")
    
    @session.on("llm_response")
    def _on_llm_response(response):
        """Capture LLM response text"""
        if hasattr(response, 'text'):
            logger.info(f"LLM response text: {response.text[:200]}")
        if hasattr(response, 'content'):
            logger.info(f"LLM response content: {response.content[:200]}")

    @session.on("user_started_speaking")
    def _on_user_started_speaking():
        logger.info("✅✅✅ USER STARTED SPEAKING - AGENT HEARD YOU! ✅✅✅")

    @session.on("user_stopped_speaking")
    def _on_user_stopped_speaking():
        logger.info("⏸️  User stopped speaking")

    @session.on("user_speech_committed")
    def _on_user_speech_committed(transcript):
        """This fires when user finishes speaking and transcript is ready"""
        logger.info(f"🗣️ User speech committed: {transcript}")
        
    @session.on("user_transcription")
    def _on_user_transcription(transcript):
        """Raw transcription events"""
        logger.info(f"📝 User transcription: {transcript}")
        
    @session.on("realtime_audio_buffer_committed")
    def _on_audio_committed():
        logger.info("🎵 Audio buffer committed to realtime API")
        
    @session.on("realtime_audio_buffer_speech_started")
    def _on_speech_started():
        logger.info("🎤 Realtime API detected speech started")
        
    @session.on("error")
    def _on_session_error(error):
        logger.error(f"❌ Session error: {error}")
        
    @session.on("connection_quality_changed")
    def _on_quality_changed(quality):
        logger.info(f"📡 Connection quality changed: {quality}")

    # Add room event handlers for debugging
    @ctx.room.on("participant_connected")
    def _on_participant_connected(participant):
        logger.info(f"👤 Participant connected: {participant.identity}")

    @ctx.room.on("track_published")
    def _on_track_published(publication, participant):
        logger.info(f"📢 Track published by {participant.identity}: {publication.kind} (source: {publication.source})")
        # Critical: Check if this is user's microphone audio
        if publication.kind == "audio" and publication.source == 2:  # SOURCE_MICROPHONE = 2
            logger.info(f"🎤✅ USER MICROPHONE TRACK PUBLISHED! Agent should receive audio now")

    @ctx.room.on("track_subscribed")
    def _on_track_subscribed(track, publication, participant):
        logger.info(f"🎤 Track subscribed from {participant.identity}: {track.kind} (source: {publication.source})")
        # Critical: Check if this is user's microphone audio
        if track.kind == "audio" and publication.source == 2:  # SOURCE_MICROPHONE = 2
            logger.info(f"🎤✅✅✅ USER MICROPHONE TRACK SUBSCRIBED! Agent is receiving audio! ✅✅✅")

    # Listen for data messages from frontend (like page content)
    @ctx.room.on("data_received")
    def _on_data_received(data: bytes, participant, kind=None, topic=None):
        """Handle data messages from frontend (like page content)"""
        try:
            if topic == "page-content":
                page_data = json.loads(data.decode('utf-8'))
                content = page_data.get('content', {})
                logger.info(f"📄 Received page content: {content.get('pathname', 'unknown')}")
                logger.info(f"   Buttons: {len(content.get('elements', {}).get('buttons', []))}")
                logger.info(f"   Inputs: {len(content.get('elements', {}).get('inputs', []))}")
                logger.info(f"   Links: {len(content.get('elements', {}).get('links', []))}")
                logger.info(f"   Cards: {len(content.get('elements', {}).get('cards', []))}")
                # Store page content for agent to use
                if hasattr(ctx.room, '_page_content'):
                    ctx.room._page_content = content
                else:
                    setattr(ctx.room, '_page_content', content)
                
                # Log available buttons and cards for debugging
                buttons = content.get('elements', {}).get('buttons', [])
                cards = content.get('elements', {}).get('cards', [])
                if buttons:
                    logger.info(f"📋 Available buttons on page:")
                    for btn in buttons[:10]:  # Log first 10 buttons
                        logger.info(f"   - '{btn.get('text', '')}' (id: {btn.get('id', 'none')})")
                if cards:
                    logger.info(f"📋 Available report cards on page:")
                    for card in cards[:5]:  # Log first 5 cards
                        logger.info(f"   - Date: '{card.get('date', 'none')}' Text: '{card.get('text', '')[:50]}'")
            elif topic == "dom-action-result":
                result_data = json.loads(data.decode('utf-8'))
                logger.info(f"✅ DOM action result: {result_data.get('result', 'unknown')}")
        except Exception as e:
            logger.error(f"Error handling data_received: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

    # Running in voice-only mode (Tavus disabled for audio compatibility)
    avatar = None
    logger.info("🎤 Running in voice-only mode (Tavus avatar disabled)")
    logger.info("Audio input enabled - agent will receive user speech")

    # Create the agent instance
    agent = VoiceAssistant()  # Uses instructions from prompts/agent_instructions.txt
    
    # Store room reference in agent for use in function tools
    agent.set_room(ctx.room)
    logger.info("Stored room reference in agent instance")

    # Configure MCP (Model Context Protocol) for external tool integration
    # MCP allows the agent to access external APIs and services (e.g., Zapier, CRM, etc.)
    mcp_server_url = os.getenv("MCP_SERVER_URL")
    if mcp_server_url and MCP_AVAILABLE:
        logger.info(f"Configuring MCP server: {mcp_server_url}")
        try:
            # Create MCP server connection
            mcp_server = MCPServerSse(
                params={
                    "url": mcp_server_url,
                    # Optional: Add custom headers for authentication
                    # "headers": {"Authorization": f"Bearer {os.getenv('MCP_AUTH_TOKEN')}"},
                },
                cache_tools_list=True,  # Cache tool list for better performance
                name=os.getenv("MCP_SERVER_NAME", "Database MCP Server")  # Descriptive name for logging
            )

            # Register MCP tools with the agent
            await MCPToolsIntegration.register_with_agent(
                agent,
                mcp_servers=[mcp_server],
                auto_connect=True  # Automatically connect to MCP server
            )
            logger.info("MCP tools registered successfully")
        except Exception as e:
            logger.error(f"Failed to configure MCP server: {e}")
            logger.warning("Agent will continue without MCP tools")
    elif mcp_server_url and not MCP_AVAILABLE:
        logger.warning("MCP_SERVER_URL is set but MCP client is not installed. Install mcp_client package to use MCP tools.")
    else:
        logger.info("No MCP_SERVER_URL configured - agent running without external tools")

    # Start the agent session in voice-only mode
    # audio_enabled=True allows agent to receive and respond with audio
    from livekit.agents import RoomOutputOptions

    try:
        await session.start(
            agent=agent,
            room=ctx.room,
            room_input_options=room_input_options,
            room_output_options=RoomOutputOptions(
                audio_enabled=True  # Always enable audio for voice-only mode
            ),
        )
        logger.info("✅ Voice agent session started successfully - ready for input!")
        logger.info(f"Session room: {session.room.name if hasattr(session, 'room') else 'N/A'}")
    except Exception as e:
        logger.error(f"❌ Failed to start session: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise
    logger.info("In console: Type your message in Arabic and press Enter")

    # Connect to the room
    await ctx.connect()

    logger.info(f"Connected to room: {ctx.room.name}")
    
    # Log all participants and their tracks for debugging
    logger.info(f"Current participants in room: {len(ctx.room.remote_participants)}")
    for pid, participant in ctx.room.remote_participants.items():
        logger.info(f"  - Participant: {participant.identity}")
        for pub_sid, publication in participant.track_publications.items():
            logger.info(f"    Track: {publication.kind} (source: {publication.source}, muted: {publication.is_muted})")
    
    logger.info("🔍 Waiting for user audio... Speak into your microphone and watch for 'USER STARTED SPEAKING' messages")


if __name__ == "__main__":
    # Run the agent worker
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )
