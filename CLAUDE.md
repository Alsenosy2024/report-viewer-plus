# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Report Viewer Plus** - A React/TypeScript dashboard application with voice navigation capabilities.

- **Framework**: React 18 + TypeScript + Vite 5
- **UI**: shadcn/ui components + Tailwind CSS
- **Auth**: Supabase authentication
- **Voice**: ElevenLabs ConvAI widget + LiveKit agent navigation
- **Built with**: Lovable.dev (auto-syncs to Git)

## Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (http://localhost:8080)
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## Architecture

### Key Files

- `src/App.tsx` - Main routing and providers
- `src/components/ConvAINavigator.tsx` - ElevenLabs voice navigation (20+ commands)
- `src/components/AgentNavigationListener.tsx` - LiveKit backend agent navigation
- `src/hooks/useAuth.tsx` - Supabase authentication context
- `src/pages/` - 15 page components (Dashboard, Reports, Admin, etc.)
- `src/components/ui/` - 60+ shadcn/ui components

### Voice Navigation

Two independent voice systems:
1. **ElevenLabs ConvAI** - Widget-based, commands on `window.convaiNavigationTools`
2. **Backend Agent** - LiveKit data channel communication with Python agent

### Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

Optional for agent navigation:
```
VITE_ENABLE_AGENT_NAVIGATION=true
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

## Related Documentation

This frontend is part of a larger voice AI system. For comprehensive documentation including:
- Backend voice agent setup
- MCP integration
- LiveKit configuration
- Full troubleshooting guide

See: `../PE-live-ai-agent/CLAUDE.md`

## Lovable.dev Integration

Project URL: https://lovable.dev/projects/fe7f70d3-e9ae-433a-be6a-a95b146a9889

Changes made in Lovable automatically sync to this Git repo. Local changes push back to Lovable.
