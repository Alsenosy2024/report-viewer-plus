import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, Globe } from 'lucide-react';
import { LiveKitRoom } from '@livekit/components-react';
import { useLiveKitToken } from '@/hooks/useLiveKitToken';
import { useVoiceAssistantContext } from '@/contexts/VoiceAssistantContext';
import { VoiceAssistantAvatar } from './VoiceAssistantAvatar';
import { ConversationHistory } from './ConversationHistory';
import '@livekit/components-styles';

interface VoiceAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { getToken, isLoading: tokenLoading } = useLiveKitToken();
  const {
    isConnected,
    setIsConnected,
    language,
    toggleLanguage,
    saveConversation,
    clearTranscript,
  } = useVoiceAssistantContext();

  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>('voice-assistant');

  useEffect(() => {
    if (open && !token) {
      handleConnect();
    }
  }, [open]);

  const handleConnect = async () => {
    const result = await getToken(roomName);
    if (result) {
      setToken(result.token);
      setLivekitUrl(result.url);
      setRoomName(result.roomName);
    }
  };

  const handleDisconnect = async () => {
    if (isConnected) {
      await saveConversation(roomName);
    }
    setToken(null);
    setLivekitUrl(null);
    setIsConnected(false);
    clearTranscript();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0 overflow-hidden"
      >
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">
              {language === 'ar' ? 'مساعد الذكاء الاصطناعي' : 'AI Voice Assistant'}
            </SheetTitle>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleLanguage}
              title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              <Globe className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {tokenLoading || !token || !livekitUrl ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">
                  {language === 'ar'
                    ? 'جاري الاتصال بالمساعد...'
                    : 'Connecting to assistant...'}
                </p>
              </div>
            </div>
          ) : (
            <LiveKitRoom
              serverUrl={livekitUrl}
              token={token}
              connect={true}
              audio={true}
              onConnected={() => setIsConnected(true)}
              onDisconnected={() => setIsConnected(false)}
              className="flex-1 flex flex-col"
            >
              {/* Avatar Video */}
              <div className="flex-shrink-0">
                <VoiceAssistantAvatar />
              </div>

              {/* Conversation History */}
              <div className="flex-1 overflow-y-auto">
                <ConversationHistory />
              </div>

              {/* Controls */}
              <div className="p-4 border-t bg-background">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={handleDisconnect}
                    className="gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    {language === 'ar' ? 'إنهاء المكالمة' : 'End Call'}
                  </Button>
                </div>
              </div>
            </LiveKitRoom>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
