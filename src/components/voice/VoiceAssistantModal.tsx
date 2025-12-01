import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PhoneOff, Mic, MicOff, X } from 'lucide-react';
import {
  LiveKitRoom,
  useLocalParticipant,
  RoomAudioRenderer,
  useRoomContext
} from '@livekit/components-react';
import { Track, LocalTrack } from 'livekit-client';
import { useLiveKitToken } from '@/hooks/useLiveKitToken';
import { useVoiceAssistantContext } from '@/contexts/VoiceAssistantContext';
import { AgentNavigationListener } from '@/components/AgentNavigationListener';
import { VoiceAssistantUI } from './VoiceAssistantUI';
import { UIElementsReporter } from './UIElementsReporter';
import { cn } from '@/lib/utils';
import '@livekit/components-styles';

// Microphone enabler component (runs in background)
const MicrophoneEnabler: React.FC = () => {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { setIsSpeaking } = useVoiceAssistantContext();

  useEffect(() => {
    if (!room || !localParticipant) return;

    const handleConnected = () => {
      console.log('[VoiceAssistant] Room connected in MicrophoneEnabler');
    };

    room.on('connected', handleConnected);

    const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
      console.log('[VoiceAssistant] Track subscribed:', {
        kind: track.kind,
        participant: participant.identity,
        isLocal: participant === localParticipant
      });

      if (track.kind === 'audio' && participant !== localParticipant) {
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

    const handleTrackPublished = (publication: any, participant: any) => {
      if (publication.kind === 'audio' && participant === localParticipant) {
        console.log('[VoiceAssistant] ✅✅✅ LOCAL MICROPHONE TRACK PUBLISHED!', {
          trackSid: publication.trackSid,
          source: publication.source,
          muted: publication.isMuted
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
    room.on('trackPublished', handleTrackPublished);
    room.on('participantMetadataChanged', handleParticipantMetadataChanged);

    return () => {
      room.off('connected', handleConnected);
      room.off('trackSubscribed', handleTrackSubscribed);
      room.off('trackUnsubscribed', handleTrackUnsubscribed);
      room.off('trackPublished', handleTrackPublished);
      room.off('participantMetadataChanged', handleParticipantMetadataChanged);
    };
  }, [room, localParticipant, setIsSpeaking]);

  return null;
};

// Minimal voice controls component
const VoiceControls: React.FC<{ onDisconnect: () => void }> = ({ onDisconnect }) => {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [isMuted, setIsMuted] = useState(false);
  const [audioTrackRef, setAudioTrackRef] = useState<LocalTrack | null>(null);

  // Monitor microphone publishing
  useEffect(() => {
    if (!localParticipant || !room) return;

    const checkMicStatus = () => {
      const isEnabled = localParticipant.isMicrophoneEnabled;
      const micPublication = localParticipant.getTrackPublication(Track.Source.Microphone);
      const hasTrack = !!micPublication?.track;
      const isTrackMuted = micPublication?.isMuted ?? false;

      console.log('[VoiceAssistant] Mic Status Check:', {
        enabled: isEnabled,
        hasPublication: !!micPublication,
        hasTrack,
        isTrackMuted,
        roomState: room.state,
        participantIdentity: localParticipant.identity
      });

      // Track mute state from publication
      if (micPublication) {
        setIsMuted(micPublication.isMuted);
      }
    };

    checkMicStatus();

    // Listen for mute state changes on the publication
    const handleTrackMuted = (publication: any) => {
      if (publication.kind === 'audio') {
        setIsMuted(publication.isMuted);
        console.log('[VoiceAssistant] Microphone mute state changed:', publication.isMuted);
      }
    };

    // Listen for track published events
    const handleTrackPublished = (publication: any) => {
      if (publication.kind === 'audio') {
        console.log('[VoiceAssistant] ✅✅✅ MICROPHONE TRACK PUBLISHED!', {
          trackSid: publication.trackSid,
          muted: publication.isMuted,
          source: publication.source
        });
        // Set up mute listeners when track is published
        setIsMuted(publication.isMuted);
        if (publication.track) {
          setAudioTrackRef(publication.track);
        }
        publication.on('muted', () => handleTrackMuted(publication));
        publication.on('unmuted', () => handleTrackMuted(publication));
      }
    };

    const handleTrackUnpublished = (publication: any) => {
      if (publication.kind === 'audio') {
        console.warn('[VoiceAssistant] ❌ Microphone track unpublished');
        // Remove mute listeners
        publication.off('muted', handleTrackMuted);
        publication.off('unmuted', handleTrackMuted);
      }
    };

    localParticipant.on('trackPublished', handleTrackPublished);
    localParticipant.on('trackUnpublished', handleTrackUnpublished);

    // Subscribe to mute events if publication already exists
    const micPub = localParticipant.getTrackPublication(Track.Source.Microphone);
    if (micPub) {
      setIsMuted(micPub.isMuted);
      if (micPub.track) {
        setAudioTrackRef(micPub.track as LocalTrack);
      }
      const handleMutedChange = () => handleTrackMuted(micPub);
      micPub.on('muted', handleMutedChange);
      micPub.on('unmuted', handleMutedChange);
    }

    room.on('connected', () => {
      console.log('[VoiceAssistant] Room connected, checking mic...');
      checkMicStatus();
    });

    // Periodic check
    const interval = setInterval(checkMicStatus, 2000);

    return () => {
      localParticipant.off('trackPublished', handleTrackPublished);
      localParticipant.off('trackUnpublished', handleTrackUnpublished);
      room.off('connected', checkMicStatus);
      // Clean up mute listeners from existing publication
      const existingPub = localParticipant.getTrackPublication(Track.Source.Microphone);
      if (existingPub) {
        const handleMutedChange = () => handleTrackMuted(existingPub);
        existingPub.off('muted', handleMutedChange);
        existingPub.off('unmuted', handleMutedChange);
      }
      clearInterval(interval);
    };
  }, [localParticipant, room]);

  const toggleMute = async () => {
    console.log('[VoiceAssistant] 🔴 MUTE BUTTON CLICKED!');

    // Get current state
    const currentMuted = isMuted;
    const newMutedState = !currentMuted;

    console.log('[VoiceAssistant] Toggling mute state from', currentMuted, 'to', newMutedState);

    // Update visual state
    setIsMuted(newMutedState);

    if (!localParticipant) {
      console.warn('[VoiceAssistant] No local participant');
      return;
    }

    // Use LiveKit's setMicrophoneEnabled method
    try {
      await localParticipant.setMicrophoneEnabled(!newMutedState);
      console.log('[VoiceAssistant] ✅ Microphone', newMutedState ? 'muted' : 'unmuted');
    } catch (error) {
      console.error('[VoiceAssistant] ❌ Error toggling microphone:', error);
    }
  };

  // Enable microphone on mount and when room connects
  useEffect(() => {
    if (localParticipant && room?.state === 'connected') {
      const enableMicrophone = async () => {
        try {
          console.log('[VoiceAssistant] Room connected, enabling microphone...');

          // Check if we have microphone permissions
          try {
            const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            console.log('[VoiceAssistant] Microphone permission status:', permissions.state);

            if (permissions.state === 'denied') {
              console.error('[VoiceAssistant] ❌ Microphone permission denied by user');
              alert('Please allow microphone access to use the voice assistant');
              return;
            }
          } catch (e) {
            console.log('[VoiceAssistant] Could not check permissions (may not be supported):', e);
          }

          // Manually get and publish microphone since audio={false}
          console.log('[VoiceAssistant] Manually requesting microphone...');

          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });

          console.log('[VoiceAssistant] ✅ Got microphone stream:', stream.getAudioTracks());

          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            console.log('[VoiceAssistant] Publishing microphone track...');

            const publication = await localParticipant.publishTrack(audioTrack, {
              name: 'microphone',
              source: Track.Source.Microphone,
            });

            console.log('[VoiceAssistant] ✅✅✅ MICROPHONE TRACK PUBLISHED!', {
              trackSid: publication.trackSid,
              kind: publication.kind,
              source: publication.source,
              track: !!publication.track
            });

            // Store reference to the track
            if (publication.track) {
              setAudioTrackRef(publication.track as LocalTrack);
              console.log('[VoiceAssistant] ✅ Audio track reference stored');
            }
          }
        } catch (error) {
          console.error('[VoiceAssistant] ❌ Error enabling microphone:', error);
          alert('Error enabling microphone: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      };

      enableMicrophone();
    }
  }, [localParticipant, room?.state]);

  return (
    <div className="flex items-center gap-2">
      {/* Mute/Unmute Button */}
      <Button
        size="icon"
        variant={isMuted ? "destructive" : "default"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleMute();
        }}
        className={cn(
          "w-9 h-9 rounded-full transition-all duration-200",
          isMuted
            ? "bg-red-500 hover:bg-red-600 text-white border-2 border-red-600"
            : "bg-primary hover:bg-primary/90 text-white"
        )}
        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        type="button"
      >
        {isMuted ? (
          <MicOff className="w-4 h-4 text-white stroke-2" />
        ) : (
          <Mic className="w-4 h-4 text-white" />
        )}
      </Button>

      {/* End Call Button */}
      <Button
        size="icon"
        variant="secondary"
        onClick={onDisconnect}
        className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/90 transition-all duration-200"
        aria-label="End call"
      >
        <PhoneOff className="w-4 h-4" />
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
  const [roomName, setRoomName] = useState<string>('');

  useEffect(() => {
    if (open && !token) {
      handleConnect();
    }
  }, [open]);

  const handleConnect = async () => {
    const result = await getToken('');
    if (result) {
      setToken(result.token);
      setLivekitUrl(result.url);
      setRoomName(result.roomName);
      console.log(`✅ Connected to unique room: ${result.roomName}`);
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
        'fixed bottom-24 right-6 z-50',
        'w-80 max-h-[500px]',
        'bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl',
        'border border-primary/20',
        'flex flex-col'
      )}
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between p-3 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold">Lamie</h3>
            {isConnected && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Connected</span>
              </div>
            )}
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDisconnect}
          className="h-8 w-8"
          aria-label="Close voice assistant"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {tokenLoading || !token || !livekitUrl ? (
          // Loading State
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Connecting...</p>
          </div>
        ) : (
          <LiveKitRoom
            serverUrl={livekitUrl}
            token={token}
            connect={true}
            audio={false}
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
              console.log('[VoiceAssistant] ✅✅✅ Connected to LiveKit room!');
              setIsConnected(true);
            }}
            onDisconnected={() => {
              console.log('[VoiceAssistant] Disconnected from LiveKit room');
              setIsConnected(false);
            }}
            onError={(error) => {
              console.error('[VoiceAssistant] ❌ LiveKit error:', error);
            }}
          >
            <MicrophoneEnabler />
            <AgentNavigationListener />
            <UIElementsReporter />
            <RoomAudioRenderer />

            {/* Compact Voice Assistant UI */}
            <div className="flex flex-col space-y-3">
              <VoiceAssistantUI />

              {/* Compact Controls */}
              <div className="flex justify-center">
                <VoiceControls onDisconnect={handleDisconnect} />
              </div>
            </div>
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
};
