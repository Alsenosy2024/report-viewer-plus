import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PhoneOff, Mic, MicOff } from 'lucide-react';
import { 
  LiveKitRoom, 
  useLocalParticipant, 
  RoomAudioRenderer, 
  useRoomContext 
} from '@livekit/components-react';
import { useLiveKitToken } from '@/hooks/useLiveKitToken';
import { useVoiceAssistantContext } from '@/contexts/VoiceAssistantContext';
import { AgentNavigationListener } from '@/components/AgentNavigationListener';
import { cn } from '@/lib/utils';
import '@livekit/components-styles';

// Microphone enabler component (runs in background)
const MicrophoneEnabler: React.FC = () => {
  const room = useRoomContext();
  const { setIsSpeaking } = useVoiceAssistantContext();

  useEffect(() => {
    if (!room) return;

    const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
      console.log('[VoiceAssistant] Track subscribed:', track.kind);

      if (track.kind === 'audio') {
        const audioElement = track.attach();
        audioElement.autoplay = true;
        audioElement.playsInline = true;
        document.body.appendChild(audioElement);
        console.log('[VoiceAssistant] Audio element attached');
      }
    };

    const handleTrackUnsubscribed = (track: any) => {
      if (track.kind === 'audio') {
        track.detach().forEach((element: HTMLMediaElement) => {
          element.remove();
        });
      }
    };

    const handleParticipantMetadataChanged = (participant: any) => {
      if (participant.isSpeaking !== undefined) {
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

// Minimal voice controls component
const VoiceControls: React.FC<{ onDisconnect: () => void }> = ({ onDisconnect }) => {
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    if (localParticipant) {
      const newMutedState = !isMuted;
      localParticipant.setMicrophoneEnabled(!newMutedState);
      setIsMuted(newMutedState);
      console.log('[VoiceAssistant] Microphone', newMutedState ? 'muted' : 'unmuted');
    }
  };

  // Enable microphone on mount
  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(true);
      console.log('[VoiceAssistant] Microphone enabled on mount');
    }
  }, [localParticipant]);

  return (
    <div className="flex items-center gap-2">
      {/* Mute/Unmute Button */}
      <Button
        size="icon"
        variant={isMuted ? "destructive" : "default"}
        onClick={toggleMute}
        className={cn(
          "w-12 h-12 rounded-full transition-all duration-200 hover:scale-105",
          isMuted 
            ? "bg-destructive hover:bg-destructive/90" 
            : "bg-primary hover:bg-primary/90"
        )}
        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
      >
        {isMuted ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>

      {/* End Call Button */}
      <Button
        size="icon"
        variant="secondary"
        onClick={onDisconnect}
        className="w-12 h-12 rounded-full bg-secondary hover:bg-secondary/90 transition-all duration-200 hover:scale-105"
        aria-label="End call"
      >
        <PhoneOff className="w-5 h-5" />
      </Button>
    </div>
  );
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

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed bottom-20 right-6 z-50 transition-all duration-300',
        'bg-background/95 backdrop-blur-xl rounded-full shadow-glow',
        'border border-primary/20 p-3'
      )}
    >
      {tokenLoading || !token || !livekitUrl ? (
        // Loading State
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
        >
          <MicrophoneEnabler />
          <AgentNavigationListener />
          <RoomAudioRenderer />

          {/* Minimal Controls with Status Indicator */}
          <div className="relative">
            {/* Connection Status Indicator */}
            <div
              className={cn(
                'absolute -top-1 -left-1 w-3 h-3 rounded-full transition-all duration-300',
                isConnected ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-400'
              )}
            />
            
            <VoiceControls onDisconnect={handleDisconnect} />
          </div>
        </LiveKitRoom>
      )}
    </div>
  );
};
