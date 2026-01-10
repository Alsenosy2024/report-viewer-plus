"""
LiveKit Voice AI Agent for Professional Engineers Dashboard.

This agent handles voice interactions and can navigate the website,
click elements, and respond in both Arabic and English.
"""

import os
import logging
from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, RunContext, function_tool

# Import custom tools from tools.py
from tools import ALL_TOOLS, FRONTEND_BASE_URL

# Load environment variables
load_dotenv(".env.local")
load_dotenv(".env")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")

# Agent instructions - bilingual support for Arabic and English
AGENT_INSTRUCTIONS = """You are a helpful voice AI assistant for the Professional Engineers Dashboard.

## Language Support
- You can understand and respond in both Arabic (Egyptian dialect) and English.
- Detect the user's language and respond in the same language.
- If the user speaks Arabic, respond in Arabic. If they speak English, respond in English.

## Your Capabilities
You can help users navigate the dashboard using voice commands:

### Navigation Commands
- Dashboard: "افتح الداشبورد" / "Open dashboard"
- WhatsApp Reports: "وريني تقارير الواتساب" / "Show WhatsApp reports"
- Productivity Reports: "افتح تقارير الإنتاجية" / "Show productivity reports"
- Ads Reports: "عايز تقارير الإعلانات" / "Show ads reports"
- Email Reports: "افتح تقارير الإيميلات" / "Show mail reports"
- Bots: "روح على البوتات" / "Open bots"
- Social Posts: "وريني البوستات" / "Show social posts"
- Content Ideas: "افتح الأفكار" / "Show content ideas"
- Meeting Summary: "وريني الاجتماعات" / "Show meeting summary"
- Courses: "افتح الكورسات" / "Show courses and prices"
- Home: "روح الصفحة الرئيسية" / "Go home"
- Admin Settings: "افتح الإعدادات" / "Open admin settings"
- Awaiting Approval: "وريني الموافقات" / "Show awaiting approval"

### Report by Date
When a user asks for a specific report with a DATE mentioned (e.g., "Get me productivity report of 2 nov 2025" or "عايز تقرير الإنتاجية بتاع 2 نوفمبر"), use the view_report_by_date function.

### DOM Interactions
You can also click buttons and elements on the page when the user requests.

## Response Style
- Be concise and friendly
- Confirm actions you're taking
- If navigation fails, inform the user politely
- Don't use complex formatting, emojis, or special characters in your responses
"""


class VoiceAssistant(Agent):
    """Voice assistant agent for the Professional Engineers Dashboard."""

    def __init__(self) -> None:
        super().__init__(
            instructions=AGENT_INSTRUCTIONS,
            tools=ALL_TOOLS,
        )

    async def on_enter(self) -> None:
        """Called when the agent enters the session."""
        logger.info("Voice assistant entered session")


# Create the agent server
server = AgentServer()


@server.rtc_session()
async def voice_agent_session(ctx: agents.JobContext):
    """Main entry point for voice agent sessions."""
    logger.info(f"Starting voice agent session in room: {ctx.room.name}")

    # Store room reference for navigation tools
    # This allows tools to access the room for data channel communication

    # Create the agent session with STT-LLM-TTS pipeline
    session = AgentSession(
        stt="assemblyai/universal-streaming:ar",  # Arabic + English support
        llm="openai/gpt-4.1-mini",
        tts="openai/tts-1:nova",  # Clear voice for bilingual support
    )

    # Create the assistant
    assistant = VoiceAssistant()

    # Store room reference on assistant for tool access
    assistant._room = ctx.room

    # Start the session
    await session.start(
        room=ctx.room,
        agent=assistant,
    )

    # Generate initial greeting
    await session.generate_reply(
        instructions="Greet the user briefly. If they seem Arabic-speaking, greet in Arabic. Otherwise greet in English. Offer to help them navigate the dashboard."
    )


if __name__ == "__main__":
    agents.cli.run_app(server)
