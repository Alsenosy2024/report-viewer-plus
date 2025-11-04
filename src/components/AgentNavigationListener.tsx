import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useRoomContext, useDataChannel } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

interface NavigationMessage {
  type: 'agent-navigation-url';
  url: string;
  pathname?: string;
}

export const AgentNavigationListener = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const room = useRoomContext();
  
  const navigateToUrlFromString = (urlString: string) => {
    try {
      let pathname: string;
      
      if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
        const url = new URL(urlString);
        pathname = url.pathname;
      } else {
        pathname = urlString.startsWith('/') ? urlString : `/${urlString}`;
      }

      console.log(`[Agent Navigation] Navigating to: ${pathname}`);
      navigate(pathname);

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
      console.error('[Agent Navigation] Navigation error:', error);
    }
  };

  const { message } = useDataChannel('agent-navigation', (msg) => {
    console.log('[Agent Navigation] 📨 useDataChannel received message:', msg);
    try {
      const rawData = (msg as any)?.payload || (msg as any)?.data || msg;
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      
      if (data.type === 'agent-navigation-url' || data.pathname || data.navigate) {
        const path = data.pathname || data.navigate || data.url;
        console.log('[Agent Navigation] 🎯 NAVIGATION FROM useDataChannel!', path);
        navigateToUrlFromString(path);
      }
    } catch (e) {
      console.error('[Agent Navigation] Error parsing useDataChannel message:', e, msg);
    }
  });
  
  useEffect(() => {
    if (message) {
      console.log('[Agent Navigation] useDataChannel message updated:', message);
    }
  }, [message]);

  useEffect(() => {
    if (!room) {
      console.log('[Agent Navigation] No room context available yet');
      return;
    }

    const navigateToUrl = (urlString: string) => {
      try {
        let pathname: string;
        
        if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
          const url = new URL(urlString);
          
          const isLocalhost = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';
          const isSameHostname = url.hostname === window.location.hostname;
          
          if (!isSameHostname && !(isLocalhost && (url.hostname === 'localhost' || url.hostname === '127.0.0.1'))) {
            console.warn(`[Agent Navigation] Blocked navigation to different hostname: ${url.hostname}`);
            toast({
              title: "Navigation Blocked",
              description: "Can only navigate within the same application",
              variant: "destructive"
            });
            return;
          }
          
          pathname = url.pathname;
        } else {
          pathname = urlString.startsWith('/') ? urlString : `/${urlString}`;
        }

        console.log(`[Agent Navigation] Navigating to: ${pathname}`);
        navigate(pathname);

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
          description: `Failed to navigate: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive"
        });
      }
    };

    const handleDataReceived = (payload: Uint8Array, participant: any) => {
      console.log('[Agent Navigation] ✅ DATA RECEIVED!', {
        payloadLength: payload.length,
        participant: participant?.identity
      });

      try {
        const decoder = new TextDecoder();
        const rawText = decoder.decode(payload);
        console.log('[Agent Navigation] Decoded message:', rawText);
        
        const message = JSON.parse(rawText) as NavigationMessage;
        console.log('[Agent Navigation] Parsed message:', message);

        if (message.type === 'agent-navigation-url') {
          const urlToNavigate = message.pathname || message.url;
          console.log('[Agent Navigation] Navigating to:', urlToNavigate);
          navigateToUrl(urlToNavigate);
        }
      } catch (error) {
        console.error('[Agent Navigation] Error parsing data message:', error);
      }
    };

    const setupListener = () => {
      console.log('[Agent Navigation] Setting up navigation listener');
      room.on(RoomEvent.DataReceived, handleDataReceived);
      
      room.remoteParticipants.forEach((participant) => {
        console.log('[Agent Navigation] Found remote participant:', participant.identity);
      });

      return () => {
        console.log('[Agent Navigation] Cleaning up event listeners');
        room.off(RoomEvent.DataReceived, handleDataReceived);
      };
    };

    if (room.state !== 'connected') {
      console.log('[Agent Navigation] Room not connected yet, state:', room.state);
      
      const handleConnected = () => {
        console.log('[Agent Navigation] Room connected, setting up listener now');
        return setupListener();
      };
      
      room.on('connected', handleConnected);
      
      return () => {
        room.off('connected', handleConnected);
      };
    }

    return setupListener();
  }, [room, navigate, toast]);

  useEffect(() => {
    (window as any).testNav = (path: string) => {
      console.log('[Agent Navigation] Testing navigation to:', path);
      navigate(path);
      toast({
        title: "Test Navigation",
        description: `Navigated to ${path}`,
      });
    };
    
    console.log('[Agent Navigation] Test function available: window.testNav("/path")');
  }, [navigate, toast]);

  return null;
};
