import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface NavigationCommand {
  type: 'agent-navigation';
  command: string;
  params?: Record<string, any>;
}

interface AgentNavigationListenerProps {
  livekitUrl?: string;
  livekitToken?: string;
  enabled?: boolean;
}

/**
 * Component that listens for navigation commands from the LiveKit voice agent
 * and executes them on the frontend.
 *
 * To use this component:
 * 1. Install LiveKit SDK: npm install livekit-client @livekit/components-react
 * 2. Add this component to your App.tsx
 * 3. Provide LiveKit connection details (URL and token)
 * 4. The voice agent can now navigate the website using function tools
 */
export const AgentNavigationListener = ({
  livekitUrl,
  livekitToken,
  enabled = false
}: AgentNavigationListenerProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const roomRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || !livekitUrl || !livekitToken) {
      console.log('[Agent Navigation] Not enabled or missing credentials');
      return;
    }

    // Dynamic import to avoid errors if LiveKit SDK is not installed
    const connectToRoom = async () => {
      try {
        // @ts-ignore - Dynamic import
        const { Room, RoomEvent } = await import('livekit-client');

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        roomRef.current = room;

        // Handle data messages from the agent
        room.on(RoomEvent.DataReceived, (
          payload: Uint8Array,
          participant: any,
          kind: any
        ) => {
          try {
            const decoder = new TextDecoder();
            const message = JSON.parse(decoder.decode(payload)) as NavigationCommand;

            if (message.type === 'agent-navigation') {
              console.log('[Agent Navigation] Received command:', message.command);
              executeNavigationCommand(message.command, message.params);
            }
          } catch (error) {
            console.error('[Agent Navigation] Error parsing data message:', error);
          }
        });

        // Connect to the room
        await room.connect(livekitUrl, livekitToken);
        console.log('[Agent Navigation] Connected to LiveKit room');

        toast({
          title: "Voice Agent Connected",
          description: "The voice agent can now navigate the website",
        });

      } catch (error) {
        console.error('[Agent Navigation] Error connecting to LiveKit:', error);
        toast({
          title: "Connection Error",
          description: "Could not connect to voice agent. Please check your credentials.",
          variant: "destructive"
        });
      }
    };

    connectToRoom();

    // Cleanup
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        console.log('[Agent Navigation] Disconnected from LiveKit room');
      }
    };
  }, [livekitUrl, livekitToken, enabled]);

  const executeNavigationCommand = (command: string, params?: Record<string, any>) => {
    const pageNames: Record<string, string> = {
      '/': 'Home Page',
      '/dashboard': 'Dashboard',
      '/whatsapp-reports': 'WhatsApp Reports',
      '/productivity-reports': 'Productivity Reports',
      '/ads-reports': 'Ads Reports',
      '/mail-reports': 'Mail Reports',
      '/bots': 'Bot Controls',
      '/social-posts': 'Social Media Posts',
      '/content-ideas': 'Content Ideas',
      '/meeting-summary': 'Meeting Summary',
      '/courses-prices': 'Courses & Prices',
    };

    switch (command) {
      case 'open_dashboard':
        navigate('/dashboard');
        toast({ title: "Voice Agent", description: "Opening Dashboard" });
        break;

      case 'show_whatsapp_reports':
        navigate('/whatsapp-reports');
        toast({ title: "Voice Agent", description: "Opening WhatsApp Reports" });
        break;

      case 'show_productivity_reports':
        navigate('/productivity-reports');
        toast({ title: "Voice Agent", description: "Opening Productivity Reports" });
        break;

      case 'show_ads_reports':
        navigate('/ads-reports');
        toast({ title: "Voice Agent", description: "Opening Ads Reports" });
        break;

      case 'show_mail_reports':
        navigate('/mail-reports');
        toast({ title: "Voice Agent", description: "Opening Mail Reports" });
        break;

      case 'open_bots':
        navigate('/bots');
        toast({ title: "Voice Agent", description: "Opening Bot Controls" });
        break;

      case 'show_social_posts':
        navigate('/social-posts');
        toast({ title: "Voice Agent", description: "Opening Social Posts" });
        break;

      case 'show_content_ideas':
        navigate('/content-ideas');
        toast({ title: "Voice Agent", description: "Opening Content Ideas" });
        break;

      case 'show_meeting_summary':
        navigate('/meeting-summary');
        toast({ title: "Voice Agent", description: "Opening Meeting Summary" });
        break;

      case 'show_courses_prices':
        navigate('/courses-prices');
        toast({ title: "Voice Agent", description: "Opening Courses & Prices" });
        break;

      case 'go_home':
        navigate('/');
        toast({ title: "Voice Agent", description: "Going to Home Page" });
        break;

      case 'where_am_i':
        const currentPath = location.pathname;
        const pageName = pageNames[currentPath] || 'Unknown Page';
        toast({
          title: "Current Location",
          description: `You are on: ${pageName}`,
          duration: 5000
        });
        console.log(`[Agent Navigation] Current page: ${pageName} (${currentPath})`);
        break;

      default:
        console.warn(`[Agent Navigation] Unknown command: ${command}`);
        toast({
          title: "Unknown Command",
          description: `Command not recognized: ${command}`,
          variant: "destructive"
        });
    }
  };

  return null; // This is a listener component with no UI
};
