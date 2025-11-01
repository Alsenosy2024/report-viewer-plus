import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

interface NavigationMessage {
  type: 'agent-navigation-url';
  url: string;
}

/**
 * Component that listens for navigation URLs from the LiveKit voice agent
 * and executes them on the frontend.
 *
 * This component hooks into the existing LiveKit room connection created by
 * the VoiceAssistantModal. No additional configuration needed - it will
 * automatically start listening when the user connects to the voice assistant.
 *
 * The agent sends full URLs (e.g., "https://preview--report-viewer-plus.lovable.app/dashboard")
 * and this component extracts the pathname and navigates using React Router.
 */
export const AgentNavigationListener = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const room = useRoomContext();

  useEffect(() => {
    if (!room) {
      return;
    }

    console.log('[Agent Navigation] Listening for navigation URLs from agent');

    // Handle data messages from the agent
    const handleDataReceived = (
      payload: Uint8Array,
      participant: any,
      kind: any
    ) => {
      try {
        const decoder = new TextDecoder();
        const message = JSON.parse(decoder.decode(payload)) as NavigationMessage;

        if (message.type === 'agent-navigation-url') {
          console.log('[Agent Navigation] Received URL:', message.url);
          navigateToUrl(message.url);
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

  const navigateToUrl = (urlString: string) => {
    try {
      // Parse the URL
      const url = new URL(urlString);

      // Security: Only allow navigation to same origin
      if (url.origin !== window.location.origin) {
        console.warn(`[Agent Navigation] Blocked navigation to different origin: ${url.origin}`);
        toast({
          title: "Navigation Blocked",
          description: "Can only navigate within the same application",
          variant: "destructive"
        });
        return;
      }

      // Extract pathname and navigate using React Router (no page reload)
      const pathname = url.pathname;
      console.log(`[Agent Navigation] Navigating to: ${pathname}`);

      navigate(pathname);

      // Show success toast with page name
      const pageNames: Record<string, string> = {
        '/': 'Home',
        '/dashboard': 'Dashboard',
        '/whatsapp-reports': 'WhatsApp Reports',
        '/productivity-reports': 'Productivity Reports',
        '/ads-reports': 'Ads Reports',
        '/mail-reports': 'Mail Reports',
        '/admin/settings': 'Admin Settings',
        '/bots': 'Bot Controls',
        '/social-posts': 'Social Posts',
        '/content-ideas': 'Content Ideas',
        '/meeting-summary': 'Meeting Summary',
        '/courses-prices': 'Courses & Prices',
        '/awaiting-approval': 'Awaiting Approval',
      };

      const pageName = pageNames[pathname] || pathname;
      toast({
        title: "Voice Agent Navigation",
        description: `Opening ${pageName}`,
      });
    } catch (error) {
      console.error('[Agent Navigation] Invalid URL:', urlString, error);
      toast({
        title: "Navigation Error",
        description: "Failed to navigate to the requested page",
        variant: "destructive"
      });
    }
  };

  return null; // This is a listener component with no UI
};
