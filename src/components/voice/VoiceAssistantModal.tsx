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
  const { setIsSpeaking } = useVoiceAssistantContext();

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

  // Listen for track subscribed events and attach audio elements
  useEffect(() => {
    if (!room) return;

    const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
      console.log('[VoiceAssistant] Track subscribed:', {
        kind: track.kind,
        participant: participant.identity,
        trackSid: publication.trackSid,
      });

      // If it's an audio track, attach it to an audio element
      if (track.kind === 'audio') {
        const audioElement = track.attach();
        audioElement.autoplay = true;
        audioElement.playsInline = true;
        
        // Attempt to play with user interaction recovery
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('[VoiceAssistant] Audio playback started successfully');
            })
            .catch((error) => {
              console.error('[VoiceAssistant] Audio playback failed:', error);
              // Try to play again after a small delay
              setTimeout(() => {
                audioElement.play().catch((e) => 
                  console.error('[VoiceAssistant] Retry play failed:', e)
                );
              }, 100);
            });
        }
        
        document.body.appendChild(audioElement);
        console.log('[VoiceAssistant] Audio element attached and playing');
      }
    };

    const handleTrackUnsubscribed = (track: any, publication: any, participant: any) => {
      console.log('[VoiceAssistant] Track unsubscribed:', {
        kind: track.kind,
        participant: participant.identity,
      });
      
      if (track.kind === 'audio') {
        track.detach().forEach((element: HTMLMediaElement) => {
          element.remove();
        });
      }
    };

    // Monitor speaking state
    const handleParticipantMetadataChanged = (participant: any) => {
      if (participant.isSpeaking !== undefined) {
        console.log('[VoiceAssistant] Participant speaking state:', participant.isSpeaking);
        setIsSpeaking(participant.isSpeaking);
      }
    };

    room.on('trackSubscribed', handleTrackSubscribed);
    room.on('trackUnsubscribed', handleTrackUnsubscribed);
    room.on('participantMetadataChanged', handleParticipantMetadataChanged);

    return () => {
      room.off('trackSubscribed', handleTrackSubscribed);
      room.off('trackUnsubscribed', handleTrackUnsubscribed);
      room.off('participantMetadataChanged', handleParticipantMetadataChanged);
    };
  }, [room, setIsSpeaking]);

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
        isMinimized ? 'w-56 h-10' : 'w-72 h-[320px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-1 border-b bg-primary/5">
        <div className="flex items-center gap-1">
          <div className={`w-1 h-1 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <h3 className="text-[9px] font-semibold">
            {language === 'ar' ? 'مساعد صوتي' : 'Voice Assistant'}
          </h3>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={toggleLanguage}
            title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <Globe className="w-2.5 h-2.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="w-2.5 h-2.5" /> : <Minimize2 className="w-2.5 h-2.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={handleDisconnect}
          >
            <X className="w-2.5 h-2.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {tokenLoading || !token || !livekitUrl ? (
          !isMinimized && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-1">
                <Loader2 className="w-4 h-4 animate-spin mx-auto text-primary" />
                <p className="text-[8px] text-muted-foreground">
                  {language === 'ar' ? 'جاري الاتصال...' : 'Connecting...'}
                </p>
              </div>
            </div>
          )
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

            {!isMinimized && (
              <>
                {/* Conversation Transcript */}
                <div className="flex-1 overflow-y-auto p-1.5">
                  <ConversationHistory />
                </div>

                {/* Footer Controls */}
                <div className="p-1.5 border-t bg-background/50 backdrop-blur">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnect}
                    className="w-full gap-1 h-6 text-[9px]"
                  >
                    <Phone className="w-2.5 h-2.5" />
                    {language === 'ar' ? 'إنهاء' : 'End Call'}
                  </Button>
                </div>
              </>
            )}
          </LiveKitRoom>
        )}
      </div>
    </Card>
  );
};
