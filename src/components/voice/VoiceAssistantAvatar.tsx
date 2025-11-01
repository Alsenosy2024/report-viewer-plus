import React, { useEffect, useRef, useState } from 'react';
import { useRoomContext, useTrackVolume, useRemoteParticipants } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useVoiceAssistantContext } from '@/contexts/VoiceAssistantContext';
import { cn } from '@/lib/utils';
import { Video, VideoOff } from 'lucide-react';

export const VoiceAssistantAvatar: React.FC = () => {
  const room = useRoomContext();
  const { setIsSpeaking } = useVoiceAssistantContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const participants = useRemoteParticipants();

  useEffect(() => {
    if (!room) return;

    // Find agent participant (usually named "Tavus Avatar Agent" or similar)
    const agentParticipant = participants.find(
      (p) => p.identity.includes('agent') || p.identity.includes('Tavus')
    );

    if (agentParticipant) {
      // Subscribe to video track
      const videoTrack = agentParticipant.getTrack(Track.Source.Camera)?.videoTrack;

      if (videoTrack && videoRef.current) {
        videoTrack.attach(videoRef.current);
        setHasVideo(true);
      }

      // Monitor audio for speaking detection
      const audioTrack = agentParticipant.getTrack(Track.Source.Microphone)?.audioTrack;
      if (audioTrack) {
        // Track volume will be handled by useTrackVolume hook
      }

      return () => {
        if (videoTrack && videoRef.current) {
          videoTrack.detach(videoRef.current);
        }
      };
    }
  }, [room, participants]);

  // Monitor speaking state from first remote participant
  const firstParticipant = participants[0];
  const volume = useTrackVolume(
    firstParticipant?.getTrack(Track.Source.Microphone)?.track
  );

  useEffect(() => {
    // Detect speaking based on volume threshold
    const isSpeaking = volume > 0.01;
    setIsSpeaking(isSpeaking);
  }, [volume, setIsSpeaking]);

  return (
    <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg overflow-hidden aspect-video">
      {hasVideo ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {volume > 0.01 && (
            <div className="absolute inset-0 border-4 border-primary animate-pulse-glow" />
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4 p-8">
            {hasVideo === false ? (
              <>
                <VideoOff className="w-16 h-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Waiting for avatar video...
                </p>
              </>
            ) : (
              <>
                <Video className="w-16 h-16 mx-auto text-primary animate-pulse" />
                <p className="text-muted-foreground">
                  Avatar loading...
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        <div
          className={cn(
            'w-3 h-3 rounded-full',
            volume > 0.01 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
          )}
        />
      </div>
    </div>
  );
};
