import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

interface NavigationCommand {
  type: 'agent-navigation';
  command: string;
  params?: Record<string, any>;
}

/**
 * Component that listens for navigation commands from the LiveKit voice agent
 * and executes them on the frontend.
 *
 * This component hooks into the existing LiveKit room connection created by
 * the VoiceAssistantModal. No additional configuration needed - it will
 * automatically start listening when the user connects to the voice assistant.
 */
export const AgentNavigationListener = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const room = useRoomContext();

  useEffect(() => {
    if (!room) {
      return;
    }

    console.log('[Agent Navigation] Listening for navigation commands from agent');

    // Handle data messages from the agent
    const handleDataReceived = (
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
    };

    // Subscribe to data messages
    room.on(RoomEvent.DataReceived, handleDataReceived);

    // Cleanup
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

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
