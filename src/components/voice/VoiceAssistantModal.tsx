import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Phone, Globe, X, Minimize2, Maximize2 } from 'lucide-react';
import { LiveKitRoom, useLocalParticipant, RoomAudioRenderer, useRoomContext, useRemoteParticipants } from '@livekit/components-react';
import { useLiveKitToken } from '@/hooks/useLiveKitToken';
import { useVoiceAssistantContext } from '@/contexts/VoiceAssistantContext';
import { VoiceAssistantAvatar } from './VoiceAssistantAvatar';
import { ConversationHistory } from './ConversationHistory';
import '@livekit/components-styles';

// Component to enable microphone automatically and debug remote participants
const MicrophoneEnabler: React.FC = () => {
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const room = useRoomContext();

  useEffect(() => {
    const enableMicrophone = async () => {
      if (localParticipant) {
        try {
          console.log('[VoiceAssistant] Enabling microphone...');
          await localParticipant.setMicrophoneEnabled(true);
          console.log('[VoiceAssistant] Microphone enabled successfully');

          // Log track status
          const tracks = localParticipant.audioTrackPublications;
          console.log('[VoiceAssistant] Local audio tracks:', tracks.size);
          tracks.forEach((publication, key) => {
            console.log(`[VoiceAssistant] Local Track ${key}:`, {
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

  // Debug remote participants
  useEffect(() => {
    console.log('[VoiceAssistant] Remote participants count:', remoteParticipants.length);
    remoteParticipants.forEach((participant) => {
      console.log('[VoiceAssistant] Remote participant:', {
        identity: participant.identity,
        name: participant.name,
        audioTracks: participant.audioTrackPublications.size,
        isSpeaking: participant.isSpeaking,
      });

      participant.audioTrackPublications.forEach((publication, key) => {
        console.log(`[VoiceAssistant] Remote audio track ${key}:`, {
          kind: publication.kind,
          source: publication.source,
          isMuted: publication.isMuted,
          isSubscribed: publication.isSubscribed,
          trackSid: publication.trackSid,
        });
      });
    });
  }, [remoteParticipants]);

  // Listen for track subscribed events
  useEffect(() => {
    if (!room) return;

    const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
      console.log('[VoiceAssistant] Track subscribed:', {
        kind: track.kind,
        participant: participant.identity,
        trackSid: publication.trackSid,
      });
    };

    const handleTrackUnsubscribed = (track: any, publication: any, participant: any) => {
      console.log('[VoiceAssistant] Track unsubscribed:', {
        kind: track.kind,
        participant: participant.identity,
      });
    };

    room.on('trackSubscribed', handleTrackSubscribed);
    room.on('trackUnsubscribed', handleTrackUnsubscribed);

    return () => {
      room.off('trackSubscribed', handleTrackSubscribed);
      room.off('trackUnsubscribed', handleTrackUnsubscribed);
    };
  }, [room]);

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
  const [isMinimized, setIsMinimized] = useState(false);

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

  if (!open) return null;

  return (
    <Card 
      className={`fixed bottom-20 right-6 shadow-2xl border-2 z-50 flex flex-col transition-all duration-300 ${
        isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <h3 className="text-sm font-semibold">
            {language === 'ar' ? 'مساعد صوتي' : 'Voice Assistant'}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleLanguage}
            title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <Globe className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDisconnect}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {tokenLoading || !token || !livekitUrl ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'جاري الاتصال...' : 'Connecting...'}
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
                  audioPreset: { maxBitrate: 32000 },
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
              className="flex-1 flex flex-col overflow-hidden"
            >
              <MicrophoneEnabler />
              <RoomAudioRenderer />

              {/* Conversation Transcript */}
              <div className="flex-1 overflow-y-auto p-3">
                <ConversationHistory />
              </div>

              {/* Footer Controls */}
              <div className="p-3 border-t bg-background/50 backdrop-blur">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                  className="w-full gap-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'إنهاء' : 'End Call'}
                </Button>
              </div>
            </LiveKitRoom>
          )}
        </div>
      )}
    </Card>
  );
};
