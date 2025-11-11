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
      // Get current session for user authentication
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('User not authenticated');
      }

      // Generate unique room name based on user ID
      const uniqueRoomName = `voice-assistant-${session.user.id}`;
      const userName = participantName || session.user.email || 'Guest';

      // Call Supabase edge function to generate LiveKit token
      const { data, error } = await supabase.functions.invoke('livekit-token', {
        body: {
          roomName: uniqueRoomName,
          participantName: userName,
        },
      });

      if (error) {
        throw new Error(`Token generation failed: ${error.message}`);
      }

      if (!data?.token || !data?.url) {
        throw new Error('Invalid token response from edge function');
      }

      console.log('[LiveKit] Token generated successfully', {
        roomName: data.roomName,
        userName,
      });

      setIsLoading(false);
      return {
        token: data.token,
        url: data.url,
        roomName: data.roomName,
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
