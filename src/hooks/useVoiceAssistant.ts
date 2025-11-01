import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const useVoiceAssistant = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<ConversationMessage[]>([]);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const { toast } = useToast();

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: ConversationMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    setTranscript((prev) => [...prev, message]);
  }, []);

  const saveConversation = useCallback(async (roomName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      // Calculate conversation duration (time between first and last message)
      const duration = transcript.length > 0
        ? Math.floor(
            (new Date(transcript[transcript.length - 1].timestamp).getTime() -
              new Date(transcript[0].timestamp).getTime()) / 1000
          )
        : 0;

      // Save to Supabase
      const { error } = await supabase
        .from('voice_conversations')
        .insert({
          user_id: user.id,
          room_name: roomName,
          participant_name: user.email,
          transcript: JSON.stringify(transcript),
          language,
          duration_seconds: duration,
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Conversation Saved',
        description: 'Your conversation has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save conversation history.',
        variant: 'destructive',
      });
    }
  }, [transcript, language, toast]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'));
    toast({
      title: language === 'ar' ? 'Switched to English' : 'تم التبديل إلى العربية',
      description: language === 'ar'
        ? 'Voice assistant will now respond in English'
        : 'سيستجيب المساعد الصوتي الآن باللغة العربية',
    });
  }, [language, toast]);

  const clearTranscript = useCallback(() => {
    setTranscript([]);
  }, []);

  return {
    isConnected,
    setIsConnected,
    isListening,
    setIsListening,
    isSpeaking,
    setIsSpeaking,
    transcript,
    addMessage,
    language,
    toggleLanguage,
    saveConversation,
    clearTranscript,
  };
};
