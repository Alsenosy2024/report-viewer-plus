import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PhoneOff, Mic, MicOff } from "lucide-react";
import { LiveKitRoom, useLocalParticipant, RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import { useLiveKitToken } from "@/hooks/useLiveKitToken";
import { useVoiceAssistantContext } from "@/contexts/VoiceAssistantContext";
import { AgentNavigationListener } from "@/components/AgentNavigationListener";
import { cn } from "@/lib/utils";
import "@livekit/components-styles";

// Microphone enabler component (runs in background)
const MicrophoneEnabler: React.FC = () => {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { setIsSpeaking } = useVoiceAssistantContext();

  useEffect(() => {
    if (!room || !localParticipant) return;

    const handleConnected = () => {
      console.log("[VoiceAssistant] Room connected in MicrophoneEnabler");
    };

    room.on("connected", handleConnected);

    const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
      console.log("[VoiceAssistant] Track subscribed:", {
        kind: track.kind,
        participant: participant.identity,
        isLocal: participant === localParticipant,
      });

      if (track.kind === "audio" && participant !== localParticipant) {
        const audioElement = track.attach();
        audioElement.autoplay = true;
        audioElement.playsInline = true;
        document.body.appendChild(audioElement);
        console.log("[VoiceAssistant] Audio element attached");
      }
    };

    const handleTrackUnsubscribed = (track: any) => {
      if (track.kind === "audio") {
        track.detach().forEach((element: HTMLMediaElement) => {
          element.remove();
        });
      }
    };

    const handleTrackPublished = (publication: any, participant: any) => {
      if (publication.kind === "audio" && participant === localParticipant) {
        console.log("[VoiceAssistant] ✅✅✅ LOCAL MICROPHONE TRACK PUBLISHED!", {
          trackSid: publication.trackSid,
          source: publication.source,
          muted: publication.isMuted,
        });
      }
    };

    const handleParticipantMetadataChanged = (participant: any) => {
      if (participant.isSpeaking !== undefined) {
        setIsSpeaking(participant.isSpeaking);
      }
    };

    room.on("trackSubscribed", handleTrackSubscribed);
    room.on("trackUnsubscribed", handleTrackUnsubscribed);
    room.on("trackPublished", handleTrackPublished);
    room.on("participantMetadataChanged", handleParticipantMetadataChanged);

    return () => {
      room.off("connected", handleConnected);
      room.off("trackSubscribed", handleTrackSubscribed);
      room.off("trackUnsubscribed", handleTrackUnsubscribed);
      room.off("trackPublished", handleTrackPublished);
      room.off("participantMetadataChanged", handleParticipantMetadataChanged);
    };
  }, [room, localParticipant, setIsSpeaking]);

  return null;
};

// Minimal voice controls component
const VoiceControls: React.FC<{ onDisconnect: () => void }> = ({ onDisconnect }) => {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [isMuted, setIsMuted] = useState(false);
  const [audioTrackRef, setAudioTrackRef] = useState<any>(null);

  // Monitor microphone publishing
  useEffect(() => {
    if (!localParticipant || !room) return;

    const checkMicStatus = () => {
      const isEnabled = localParticipant.isMicrophoneEnabled;
      const micPublication = localParticipant.getTrackPublication("microphone" as any);
      const hasTrack = !!micPublication?.track;
      const isTrackMuted = micPublication?.isMuted ?? false;

      console.log("[VoiceAssistant] Mic Status Check:", {
        enabled: isEnabled,
        hasPublication: !!micPublication,
        hasTrack,
        isTrackMuted,
        roomState: room.state,
        participantIdentity: localParticipant.identity,
      });

      // Track mute state from publication
      if (micPublication) {
        setIsMuted(micPublication.isMuted);
      }
    };

    checkMicStatus();

    // Listen for mute state changes on the publication
    const handleTrackMuted = (publication: any) => {
      if (publication.kind === "audio") {
        setIsMuted(publication.isMuted);
        console.log("[VoiceAssistant] Microphone mute state changed:", publication.isMuted);
      }
    };

    // Listen for track published events
    const handleTrackPublished = (publication: any) => {
      if (publication.kind === "audio") {
        console.log("[VoiceAssistant] ✅✅✅ MICROPHONE TRACK PUBLISHED!", {
          trackSid: publication.trackSid,
          muted: publication.isMuted,
          source: publication.source,
        });
        // Set up mute listeners when track is published
        setIsMuted(publication.isMuted);
        if (publication.track) {
          setAudioTrackRef(publication.track);
        }
        (publication as any).on("muted", () => handleTrackMuted(publication));
        (publication as any).on("unmuted", () => handleTrackMuted(publication));
      }
    };

    const handleTrackUnpublished = (publication: any) => {
      if (publication.kind === "audio") {
        console.warn("[VoiceAssistant] ❌ Microphone track unpublished");
        // Remove mute listeners
        (publication as any).off("muted", handleTrackMuted);
        (publication as any).off("unmuted", handleTrackMuted);
      }
    };

    localParticipant.on("trackPublished", handleTrackPublished);
    localParticipant.on("trackUnpublished", handleTrackUnpublished);

    // Subscribe to mute events if publication already exists
    const micPub = localParticipant.getTrackPublication("microphone" as any);
    if (micPub) {
      setIsMuted(micPub.isMuted);
      if (micPub.track) {
        setAudioTrackRef(micPub.track);
      }
      (micPub as any).on("muted", () => handleTrackMuted(micPub));
      (micPub as any).on("unmuted", () => handleTrackMuted(micPub));
    }

    room.on("connected", () => {
      console.log("[VoiceAssistant] Room connected, checking mic...");
      checkMicStatus();
    });

    // Periodic check
    const interval = setInterval(checkMicStatus, 2000);

    return () => {
      localParticipant.off("trackPublished", handleTrackPublished);
      localParticipant.off("trackUnpublished", handleTrackUnpublished);
      room.off("connected", checkMicStatus);
      // Clean up mute listeners from existing publication
      const existingPub = localParticipant.getTrackPublication("microphone" as any);
      if (existingPub) {
        (existingPub as any).off("muted", handleTrackMuted);
        (existingPub as any).off("unmuted", handleTrackMuted);
      }
      clearInterval(interval);
    };
  }, [localParticipant, room]);

  const toggleMute = async () => {
    console.log("[VoiceAssistant] 🔴 MUTE BUTTON CLICKED!");

    // Get current state
    const currentMuted = isMuted;
    const newMutedState = !currentMuted;

    console.log("[VoiceAssistant] Toggling mute state from", currentMuted, "to", newMutedState);

    // Mute/unmute the actual MediaStreamTrack directly (this stops audio at the source)
    if (audioTrackRef) {
      const mediaStreamTrack = (audioTrackRef as any).mediaStreamTrack || audioTrackRef;
      if (mediaStreamTrack && 'enabled' in mediaStreamTrack) {
        mediaStreamTrack.enabled = !newMutedState; // enabled=false means muted
        console.log(
          "[VoiceAssistant] ✅✅✅ Direct track mute:",
          newMutedState ? "MUTED (track.enabled=false)" : "UNMUTED (track.enabled=true)",
          "Actual track.enabled:",
          mediaStreamTrack.enabled,
        );
      }
    } else {
      console.warn("[VoiceAssistant] ⚠️ No audio track reference found for direct muting");
      // Try to find the track from publications
      if (localParticipant) {
        const allPubs = Array.from(localParticipant.trackPublications.values());
        const audioPub = allPubs.find((p) => p.kind === "audio");
        if (audioPub?.track) {
          console.log("[VoiceAssistant] Found audio track via publications, using it");
          const mediaStreamTrack = (audioPub.track as any).mediaStreamTrack || audioPub.track;
          if (mediaStreamTrack && 'enabled' in mediaStreamTrack) {
            mediaStreamTrack.enabled = !newMutedState;
            setAudioTrackRef(audioPub.track);
          }
        }
      }
    }

    // Update visual state
    setIsMuted(newMutedState);

    if (!localParticipant) {
      console.warn("[VoiceAssistant] No local participant");
      return;
    }

    // Also try to mute through publication if it exists (tries multiple methods)
    const micPubByKind = localParticipant.getTrackPublication("microphone" as any);
    const micPubBySource = localParticipant.getTrackPublication("microphone" as any);
    const allPubs = Array.from(localParticipant.trackPublications.values());
    const audioPub = micPubByKind || micPubBySource || allPubs.find((p) => p.kind === "audio");

    if (audioPub) {
      try {
        console.log(
          "[VoiceAssistant] Found publication via:",
          micPubByKind ? "kind" : micPubBySource ? "source" : "search",
        );

        // Mute the track directly through publication
        if (audioPub.track) {
          const mediaStreamTrack = (audioPub.track as any).mediaStreamTrack || audioPub.track;
          if (mediaStreamTrack && 'enabled' in mediaStreamTrack) {
            mediaStreamTrack.enabled = !newMutedState;
            console.log("[VoiceAssistant] ✅ Muted via publication.track.enabled:", !newMutedState);
          }
        } else {
          console.log("[VoiceAssistant] Publication found but no track, using direct mute only");
        }
      } catch (error) {
        console.error("[VoiceAssistant] ❌ Error muting publication:", error);
        // Direct track mute already worked, so this is not critical
      }
    } else {
      console.log("[VoiceAssistant] No publication found, direct track mute is sufficient");
    }
  };

  // Enable microphone on mount and when room connects
  useEffect(() => {
    if (localParticipant && room?.state === "connected") {
      const enableMicrophone = async () => {
        try {
          console.log("[VoiceAssistant] Room connected, enabling microphone...");

          // Check if we have microphone permissions
          try {
            const permissions = await navigator.permissions.query({ name: "microphone" as PermissionName });
            console.log("[VoiceAssistant] Microphone permission status:", permissions.state);

            if (permissions.state === "denied") {
              console.error("[VoiceAssistant] ❌ Microphone permission denied by user");
              alert("Please allow microphone access to use the voice assistant");
              return;
            }
          } catch (e) {
            console.log("[VoiceAssistant] Could not check permissions (may not be supported):", e);
          }

          // Manually get and publish microphone since audio={false}
          console.log("[VoiceAssistant] Manually requesting microphone...");

          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

          console.log("[VoiceAssistant] ✅ Got microphone stream:", stream.getAudioTracks());

          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            console.log("[VoiceAssistant] Publishing microphone track...");

            const publication = await localParticipant.publishTrack(audioTrack, {
              name: "microphone",
            } as any);

            console.log("[VoiceAssistant] ✅✅✅ MICROPHONE TRACK PUBLISHED!", {
              trackSid: publication.trackSid,
              kind: publication.kind,
              source: publication.source,
              track: !!publication.track,
            });

            // Store reference to the audio track for muting (direct from MediaStreamTrack)
            setAudioTrackRef(audioTrack);
            console.log("[VoiceAssistant] ✅ Audio track reference stored for muting (direct track)");

            // Also store track from publication if available
            if (publication.track) {
              setAudioTrackRef(publication.track);
              console.log("[VoiceAssistant] ✅ Publication track reference also stored");
            }

            // Wait a bit and verify publication is available via getTrackPublication
            setTimeout(() => {
              // Try multiple ways to find the publication
              const micPubByKind = localParticipant.getTrackPublication("microphone" as any);
              const micPubBySource = localParticipant.getTrackPublication("microphone" as any);
              const allPublications = Array.from(localParticipant.trackPublications.values());
              const audioPublications = allPublications.filter((p) => p.kind === "audio");

              console.log("[VoiceAssistant] Verification check:", {
                byKind: !!micPubByKind,
                bySource: !!micPubBySource,
                totalPublications: allPublications.length,
                audioPublications: audioPublications.length,
                audioPubTrackSids: audioPublications.map((p) => p.trackSid),
              });

              // Use the publication we got from publishTrack or find it
              const finalPub = publication || micPubByKind || micPubBySource || audioPublications[0];

              if (finalPub && finalPub.track) {
                console.log("[VoiceAssistant] ✅✅✅ ALL GOOD! Microphone is live and published!", {
                  trackSid: finalPub.trackSid,
                  hasTrack: !!finalPub.track,
                });
                setAudioTrackRef(finalPub.track);
              } else {
                console.warn(
                  "[VoiceAssistant] ⚠️ Publication not found via getTrackPublication, but we have direct reference",
                );
              }
            }, 1000);
          }
        } catch (error) {
          console.error("[VoiceAssistant] ❌ Error enabling microphone:", error);
          alert("Error enabling microphone: " + (error instanceof Error ? error.message : "Unknown error"));
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
          "w-12 h-12 rounded-full transition-all duration-200 hover:scale-105",
          isMuted
            ? "bg-red-500 hover:bg-red-600 text-white border-2 border-red-600"
            : "bg-primary hover:bg-primary/90 text-white",
        )}
        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        type="button"
      >
        {isMuted ? <MicOff className="w-5 h-5 text-white stroke-2" /> : <Mic className="w-5 h-5 text-white" />}
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

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ open, onOpenChange }) => {
  const { getToken, isLoading: tokenLoading } = useLiveKitToken();
  const { isConnected, setIsConnected, saveConversation, clearTranscript } = useVoiceAssistantContext();

  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>("voice-assistant");

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
        "fixed bottom-20 right-6 z-50 transition-all duration-300",
        "bg-background/95 backdrop-blur-xl rounded-full shadow-glow",
        "border border-primary/20 p-3",
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
            console.log("[VoiceAssistant] ✅✅✅ Connected to LiveKit room!");
            setIsConnected(true);
          }}
          onDisconnected={() => {
            console.log("[VoiceAssistant] Disconnected from LiveKit room");
            setIsConnected(false);
          }}
          onError={(error) => {
            console.error("[VoiceAssistant] ❌ LiveKit error:", error);
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
                "absolute -top-1 -left-1 w-3 h-3 rounded-full transition-all duration-300",
                isConnected ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-400",
              )}
            />

            <VoiceControls onDisconnect={handleDisconnect} />
          </div>
        </LiveKitRoom>
      )}
    </div>
  );
};
