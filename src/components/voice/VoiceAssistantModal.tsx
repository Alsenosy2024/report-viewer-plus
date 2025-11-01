import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, Globe } from 'lucide-react';
import { LiveKitRoom, useLocalParticipant, RoomAudioRenderer } from '@livekit/components-react';
import { useLiveKitToken } from '@/hooks/useLiveKitToken';
import { useVoiceAssistantContext } from '@/contexts/VoiceAssistantContext';
import { VoiceAssistantAvatar } from './VoiceAssistantAvatar';
import { ConversationHistory } from './ConversationHistory';
import '@livekit/components-styles';

// Component to enable microphone automatically
const MicrophoneEnabler: React.FC = () => {
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    const enableMicrophone = async () => {
      if (localParticipant) {
        try {
          console.log('[VoiceAssistant] Enabling microphone...');
          await localParticipant.setMicrophoneEnabled(true);
          console.log('[VoiceAssistant] Microphone enabled successfully');

          // Log track status
          const tracks = localParticipant.audioTrackPublications;
          console.log('[VoiceAssistant] Audio tracks:', tracks.size);
          tracks.forEach((publication, key) => {
            console.log(`[VoiceAssistant] Track ${key}:`, {
              kind: publication.kind,
              source: publication.source,
              isMuted: publication.isMuted,
              isSubscribed: publication.isSubscribed,
            });
          });
        } catch (error) {
          console.error('[VoiceAssistant] Failed to enable microphone:', error);
        }
      }
    };

    enableMicrophone();
  }, [localParticipant]);

  return null;
};

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
              video={false}
              options={{
                publishDefaults: {
                  audioPreset: {
                    maxBitrate: 32000,
                  },
                  dtx: true,
                  red: true,
                },
                audioCaptureDefaults: {
                  autoGainControl: true,
                  echoCancellation: true,
                  noiseSuppression: true,
                },
              }}
              onConnected={() => {
                console.log('[VoiceAssistant] Connected to LiveKit room');
                setIsConnected(true);
              }}
              onDisconnected={() => {
                console.log('[VoiceAssistant] Disconnected from LiveKit room');
                setIsConnected(false);
              }}
              onError={(error) => {
                console.error('[VoiceAssistant] LiveKit error:', error);
              }}
              className="flex-1 flex flex-col"
            >
              {/* Auto-enable microphone */}
              <MicrophoneEnabler />
              {/* Play remote audio */}
              <RoomAudioRenderer />

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
