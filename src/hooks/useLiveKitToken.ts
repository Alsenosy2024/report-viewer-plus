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
    roomName: string = 'voice-assistant',
    participantName?: string
  ): Promise<LiveKitTokenResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      // Call Supabase Edge Function to generate token
      const { data, error: functionError } = await supabase.functions.invoke(
        'livekit-token',
        {
          body: {
            roomName,
            participantName: participantName || session.user.email,
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (!data || !data.token) {
        throw new Error('Invalid response from token service');
      }

      setIsLoading(false);
      return data as LiveKitTokenResponse;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);

      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to connect to voice assistant',
        variant: 'destructive',
      });

      return null;
    }
  }, [toast]);

  return {
    getToken,
    isLoading,
    error,
  };
};
