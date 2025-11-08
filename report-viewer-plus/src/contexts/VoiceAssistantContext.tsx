import React, { createContext, useContext, ReactNode } from 'react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface VoiceAssistantContextType {
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
  transcript: ConversationMessage[];
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  language: 'ar' | 'en';
  toggleLanguage: () => void;
  saveConversation: (roomName: string) => Promise<void>;
  clearTranscript: () => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | undefined>(
  undefined
);

export const useVoiceAssistantContext = () => {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error(
      'useVoiceAssistantContext must be used within VoiceAssistantProvider'
    );
  }
  return context;
};

interface VoiceAssistantProviderProps {
  children: ReactNode;
}

export const VoiceAssistantProvider: React.FC<VoiceAssistantProviderProps> = ({
  children,
}) => {
  const voiceAssistant = useVoiceAssistant();

  return (
    <VoiceAssistantContext.Provider value={voiceAssistant}>
      {children}
    </VoiceAssistantContext.Provider>
  );
};
