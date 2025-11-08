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
    // TODO: Re-enable after Supabase types are regenerated for voice_conversations table
    console.log('[VoiceAssistant] Conversation logged', {
      roomName,
      messageCount: transcript.length,
      language,
      duration: transcript.length > 0
        ? Math.floor(
            (new Date(transcript[transcript.length - 1].timestamp).getTime() -
              new Date(transcript[0].timestamp).getTime()) / 1000
          )
        : 0,
    });
  }, [transcript, language]);

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
