import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomContext, useDataChannel } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { toast } from 'sonner';

export const AgentNavigationListener = () => {
  const navigate = useNavigate();
  const room = useRoomContext();

  // Helper function to parse and navigate to URLs
  const navigateToUrlFromString = (urlString: string) => {
    try {
      console.log('[AgentNav] Processing navigation command:', urlString);
      
      // Handle direct paths
      if (urlString.startsWith('/')) {
        console.log('[AgentNav] Navigating to path:', urlString);
        navigate(urlString);
        toast.success(`Navigating to ${urlString}`);
        return;
      }

      // Handle full URLs
      const url = new URL(urlString, window.location.origin);
      
      // Security check: only navigate within the same origin
      if (url.origin === window.location.origin) {
        console.log('[AgentNav] Navigating to:', url.pathname);
        navigate(url.pathname);
        toast.success(`Navigating to ${url.pathname}`);
      } else {
        console.warn('[AgentNav] Blocked navigation to external URL:', urlString);
      }
    } catch (error) {
      console.error('[AgentNav] Error parsing navigation URL:', error);
    }
  };

  // Listen for data channel messages (primary method)
  const { message } = useDataChannel('agent-navigation');
  
  useEffect(() => {
    if (message) {
      console.log('[AgentNav] Received data channel message:', message);
      
      try {
        const payload = message.payload;
        const data = JSON.parse(new TextDecoder().decode(payload));
        console.log('[AgentNav] Parsed message:', data);
        
        if (data.type === 'agent-navigation-url') {
          const targetUrl = data.url || data.pathname || data.navigate;
          if (targetUrl) {
            navigateToUrlFromString(targetUrl);
          }
        }
      } catch (error) {
        console.error('[AgentNav] Error parsing data channel message:', error);
      }
    }
  }, [message]);

  // Listen for room data events (fallback method)
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant: any,
      kind: any,
      topic?: string
    ) => {
      console.log('[AgentNav] Room data received:', {
        topic,
        participant: participant?.identity,
        kind,
        payloadLength: payload.length
      });

      if (topic === 'agent-navigation' || topic === 'navigation') {
        try {
          const message = new TextDecoder().decode(payload);
          const data = JSON.parse(message);
          console.log('[AgentNav] Parsed room data:', data);
          
          if (data.type === 'agent-navigation-url') {
            const targetUrl = data.url || data.pathname || data.navigate;
            if (targetUrl) {
              navigateToUrlFromString(targetUrl);
            }
          }
        } catch (error) {
          console.error('[AgentNav] Error parsing room data:', error);
        }
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, navigate]);

  // Monitor participant metadata for navigation commands
  useEffect(() => {
    if (!room) return;

    const checkParticipantMetadata = () => {
      room.remoteParticipants.forEach((participant) => {
        if (participant.metadata) {
          try {
            const metadata = JSON.parse(participant.metadata);
            if (metadata.navigate) {
              console.log('[AgentNav] Found navigation in metadata:', metadata.navigate);
              navigateToUrlFromString(metadata.navigate);
            }
          } catch (error) {
            // Metadata might not be JSON
          }
        }
      });
    };

    // Check on participant metadata changes
    const handleMetadataChanged = (prevMetadata: string | undefined, participant: any) => {
      console.log('[AgentNav] Metadata changed:', { 
        participant: participant?.identity,
        prevMetadata,
        newMetadata: participant?.metadata 
      });
      checkParticipantMetadata();
    };

    room.on('participantMetadataChanged' as any, handleMetadataChanged);

    // Check periodically as fallback
    const interval = setInterval(checkParticipantMetadata, 2000);

    return () => {
      room.off('participantMetadataChanged' as any, handleMetadataChanged);
      clearInterval(interval);
    };
  }, [room, navigate]);

  // Debug helper
  useEffect(() => {
    (window as any).testNav = (path: string) => {
      console.log('[AgentNav] Manual test navigation to:', path);
      navigateToUrlFromString(path);
    };
  }, [navigate]);

  return null;
};
