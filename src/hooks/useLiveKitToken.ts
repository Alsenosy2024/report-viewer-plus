import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LiveKitTokenResponse {
  token: string;
  url: string;
  roomName: string;
}

export const useLiveKitToken = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const getToken = useCallback(async (
    participantName?: string
  ): Promise<LiveKitTokenResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get backend URL from environment or use default
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const livekitUrl = import.meta.env.VITE_LIVEKIT_URL;

      if (!backendUrl) {
        throw new Error('VITE_BACKEND_URL not configured. Please add your Railway backend URL to .env');
      }

      if (!livekitUrl) {
        throw new Error('VITE_LIVEKIT_URL not configured. Please add your LiveKit server URL to .env');
      }

      // Get current session for user info
      const { data: { session } } = await supabase.auth.getSession();

      // Generate unique room name based on user ID or use default
      const uniqueRoomName = session?.user?.id
        ? `voice-assistant-${session.user.id}`
        : `voice-assistant-${Date.now()}`;

      const userName = participantName || session?.user?.email || 'Guest';

      // Call Railway backend Flask server to generate token
      const response = await fetch(
        `${backendUrl}/getToken?name=${encodeURIComponent(userName)}&room=${encodeURIComponent(uniqueRoomName)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Token generation failed: ${response.statusText}`);
      }

      const token = await response.text();

      if (!token) {
        throw new Error('Invalid token received from backend');
      }

      console.log('[LiveKit] Token generated successfully', {
        roomName: uniqueRoomName,
        userName,
        backendUrl
      });

      setIsLoading(false);
      return {
        token,
        url: livekitUrl,
        roomName: uniqueRoomName,
      };
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);

      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to connect to voice assistant',
        variant: 'destructive',
      });

      console.error('[LiveKit] Token generation error:', error);

      return null;
    }
  }, [toast]);

  return {
    getToken,
    isLoading,
    error,
  };
};
