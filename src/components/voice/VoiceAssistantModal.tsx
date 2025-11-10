import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PhoneOff, Mic, MicOff } from 'lucide-react';
import { 
  LiveKitRoom, 
  useLocalParticipant, 
  RoomAudioRenderer, 
  useRoomContext 
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useLiveKitToken } from '@/hooks/useLiveKitToken';
import { useVoiceAssistantContext } from '@/contexts/VoiceAssistantContext';
import { AgentNavigationListener } from '@/components/AgentNavigationListener';
import { PageContentSender } from './PageContentSender';
import { DOMInteractionExecutor } from './DOMInteractionExecutor';
import { TranscriptCapture } from './TranscriptCapture';
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
  const [audioTrackRef, setAudioTrackRef] = useState<MediaStreamTrack | null>(null);
  const manualMuteRef = React.useRef<{ timestamp: number; state: boolean } | null>(null);
  const isMutedRef = React.useRef(isMuted);
  // Persist mute state across route changes using sessionStorage
  const muteStateKey = `voice-assistant-mute-${room?.name || 'default'}`;
  
  // CRITICAL: Force check mic state on EVERY render to ensure UI is always correct
  // This runs BEFORE any other useEffect to catch state issues immediately
  useEffect(() => {
    if (!localParticipant || !room) return;
    
    const forceCheckMicState = () => {
      try {
        const micPublication = localParticipant.getTrackPublication(Track.Source.Microphone);
        if (micPublication?.track) {
          const mediaStreamTrack = (micPublication.track as any).mediaStreamTrack;
          if (mediaStreamTrack && mediaStreamTrack.readyState === 'live') {
            const trackEnabled = mediaStreamTrack.enabled;
            
            // CRITICAL: If mic is enabled, FORCE unmuted state (ignore current UI state and sessionStorage)
            if (trackEnabled === true) {
              if (isMuted === true) {
                console.log('[VoiceAssistant] 🔧🔧🔧 RENDER CHECK: Mic enabled but UI shows muted - FORCING UNMUTED 🔧🔧🔧');
                setIsMuted(false);
                isMutedRef.current = false;
                sessionStorage.setItem(muteStateKey, 'false');
              }
              // Always ensure unmuted if track is enabled - don't check anything else
              return;
            }
            
            // If mic is disabled, check if we should show muted
            if (trackEnabled === false && isMuted === false) {
              // Check if this is a manual mute (within last 5 seconds)
              const now = Date.now();
              const recentlyManuallyMuted = manualMuteRef.current && (now - manualMuteRef.current.timestamp) < 5000;
              
              if (!recentlyManuallyMuted) {
                console.log('[VoiceAssistant] 🔧 RENDER CHECK: Mic disabled but UI shows unmuted - setting muted');
                setIsMuted(true);
                isMutedRef.current = true;
                sessionStorage.setItem(muteStateKey, 'true');
              }
            }
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };
    
    // Check immediately on every render
    forceCheckMicState();
  }); // No dependencies - runs on every render
  
  // Load persisted mute state on mount - BUT verify against actual track state
  useEffect(() => {
    if (!localParticipant || !room) return;
    
    // CRITICAL: ALWAYS default to unmuted first
    setIsMuted(false);
    isMutedRef.current = false;
    
    // Then verify against actual track state
    try {
      const micPublication = localParticipant.getTrackPublication(Track.Source.Microphone);
      if (micPublication?.track) {
        const mediaStreamTrack = (micPublication.track as any).mediaStreamTrack;
        if (mediaStreamTrack && mediaStreamTrack.readyState === 'live') {
          const actualMuted = !mediaStreamTrack.enabled;
          
          console.log('[VoiceAssistant] 🔍 Initial mic state check:', {
            trackEnabled: mediaStreamTrack.enabled,
            actualMuted,
            trackReadyState: mediaStreamTrack.readyState
          });
          
          // CRITICAL: Only set to muted if track is ACTUALLY disabled
          if (actualMuted === true) {
            setIsMuted(true);
            isMutedRef.current = true;
            sessionStorage.setItem(muteStateKey, 'true');
            console.log('[VoiceAssistant] Mic is actually muted - setting muted state');
          } else {
            // Mic is enabled - ensure unmuted state
            setIsMuted(false);
            isMutedRef.current = false;
            sessionStorage.setItem(muteStateKey, 'false');
            console.log('[VoiceAssistant] Mic is enabled - setting unmuted state');
          }
        } else {
          console.log('[VoiceAssistant] No live track yet - defaulting to unmuted');
        }
      } else {
        console.log('[VoiceAssistant] No mic publication yet - defaulting to unmuted');
      }
    } catch (e) {
      console.warn('[VoiceAssistant] Could not check mic state:', e);
      // On error, ensure unmuted
      setIsMuted(false);
      isMutedRef.current = false;
    }
  }, [muteStateKey, localParticipant, room]);
  
  // Keep ref in sync with state
  useEffect(() => {
    isMutedRef.current = isMuted;
    
    // CRITICAL: Before persisting, verify mic track state
    // Don't persist muted state if mic is actually enabled
    if (localParticipant && room) {
      const micPublication = localParticipant.getTrackPublication(Track.Source.Microphone);
      if (micPublication?.track) {
        const mediaStreamTrack = (micPublication.track as any).mediaStreamTrack;
        if (mediaStreamTrack && mediaStreamTrack.readyState === 'live' && mediaStreamTrack.enabled === true) {
          // Mic is enabled - never persist muted state
          if (isMuted === true) {
            console.log('[VoiceAssistant] ⚠️ Preventing muted state persistence - mic is actually enabled');
            sessionStorage.setItem(muteStateKey, 'false');
            // Also correct the state immediately
            setIsMuted(false);
            isMutedRef.current = false;
            return;
          }
        }
      }
    }
    
    // Persist mute state to sessionStorage
    try {
      sessionStorage.setItem(muteStateKey, String(isMuted));
    } catch (e) {
      // Ignore storage errors
    }
  }, [isMuted, muteStateKey, localParticipant, room]);

    // Listen for navigation completion to verify mic state
    useEffect(() => {
      const handleNavigationComplete = () => {
        // After navigation, verify mic state matches actual track state - multiple times to catch timing issues
        if (localParticipant && room) {
          // Check immediately
          const checkMicState = () => {
            try {
              const micPublication = localParticipant.getTrackPublication(Track.Source.Microphone);
              if (micPublication?.track) {
                const mediaStreamTrack = (micPublication.track as any).mediaStreamTrack;
                if (mediaStreamTrack && mediaStreamTrack.readyState === 'live') {
                  const actualMuted = !mediaStreamTrack.enabled;
                  const trackEnabled = mediaStreamTrack.enabled;
                  
                  console.log('[VoiceAssistant] 🔍 Post-navigation mic check:', {
                    trackEnabled,
                    actualMuted,
                    currentState: isMuted,
                    trackReadyState: mediaStreamTrack.readyState
                  });
                  
                  // CRITICAL: If mic track is enabled, FORCE unmuted state (ignore stored state)
                  if (trackEnabled === true) {
                    if (isMuted === true) {
                      console.log('[VoiceAssistant] 🔧🔧🔧 FORCING UNMUTED - Mic track is ENABLED 🔧🔧🔧');
                      setIsMuted(false);
                      isMutedRef.current = false;
                      sessionStorage.setItem(muteStateKey, 'false');
                    } else {
                      console.log('[VoiceAssistant] ✅ Mic state already correct (unmuted)');
                    }
                  } else if (actualMuted !== isMuted) {
                    console.log('[VoiceAssistant] 🔧 After navigation: correcting mic state from', isMuted, 'to', actualMuted);
                    setIsMuted(actualMuted);
                    isMutedRef.current = actualMuted;
                    sessionStorage.setItem(muteStateKey, String(actualMuted));
                  }
                }
              }
            } catch (error) {
              console.warn('[VoiceAssistant] Error checking mic state after navigation:', error);
            }
          };
          
          // Check immediately (no delay)
          checkMicState();
          
          // Check again after 50ms
          setTimeout(checkMicState, 50);
          
          // Check again after 150ms
          setTimeout(checkMicState, 150);
          
          // Check again after 300ms
          setTimeout(checkMicState, 300);
          
          // Final check after 500ms
          setTimeout(checkMicState, 500);
          
          // Extra final check after 1 second (to override any late state restoration)
          setTimeout(checkMicState, 1000);
        }
      };
      
      window.addEventListener('navigation-complete', handleNavigationComplete);
      return () => {
        window.removeEventListener('navigation-complete', handleNavigationComplete);
      };
    }, [localParticipant, room, isMuted, muteStateKey]);
    
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
        participantIdentity: localParticipant.identity,
        currentState: isMuted
      });

      // Track mute state from publication, but only if it has a track
      // Skip syncing if we just manually muted/unmuted (within last 3 seconds to prevent override)
      const now = Date.now();
      if (manualMuteRef.current && (now - manualMuteRef.current.timestamp) < 3000) {
        console.log('[VoiceAssistant] Skipping sync - manual mute just happened (within 3s)');
        // Also ensure the track stays in the manual mute state (with error handling)
        try {
          if (micPublication?.track) {
            const mediaStreamTrack = (micPublication.track as any).mediaStreamTrack;
            if (mediaStreamTrack && mediaStreamTrack.readyState === 'live') {
              const shouldBeMuted = manualMuteRef.current.state;
              const isActuallyMuted = !mediaStreamTrack.enabled;
              if (isActuallyMuted !== shouldBeMuted) {
                console.log(`[VoiceAssistant] 🔧 Correcting track state: ${isActuallyMuted} -> ${shouldBeMuted}`);
                mediaStreamTrack.enabled = !shouldBeMuted;
              }
            }
          }
        } catch (error) {
          console.warn('[VoiceAssistant] Error correcting track state:', error);
          // Don't throw - just log
        }
        return;
      }

      if (micPublication && micPublication.track) {
        // Access underlying MediaStreamTrack to check enabled state
        const mediaStreamTrack = (micPublication.track as any).mediaStreamTrack;
        if (mediaStreamTrack) {
          const trackEnabled = mediaStreamTrack.enabled;
          const shouldBeMuted = !trackEnabled;
          
          // Only sync if we haven't manually set mute state recently
          // AND if the track state doesn't match our persisted state
          const now = Date.now();
          const recentlyManuallyMuted = manualMuteRef.current && (now - manualMuteRef.current.timestamp) < 5000;
          
          // CRITICAL: If mic is actually enabled, always show unmuted (don't sync to muted)
          if (trackEnabled === true && isMuted === true && !recentlyManuallyMuted) {
            console.log('[VoiceAssistant] 🔧🔧🔧 Mic is ENABLED but state shows MUTED - CORRECTING to UNMUTED 🔧🔧🔧');
            setIsMuted(false);
            isMutedRef.current = false;
            sessionStorage.setItem(muteStateKey, 'false');
          } else if (!recentlyManuallyMuted && shouldBeMuted !== isMuted && trackEnabled === false) {
            // Only sync to muted if track is actually disabled
            console.log('[VoiceAssistant] Syncing mute state from track:', {
              trackEnabled,
              shouldBeMuted,
              currentState: isMuted,
              publicationMuted: micPublication.isMuted,
              persistedState: sessionStorage.getItem(muteStateKey)
            });
            setIsMuted(shouldBeMuted);
          } else if (recentlyManuallyMuted && shouldBeMuted !== isMuted) {
            // Track state doesn't match manual mute - fix it
            console.log('[VoiceAssistant] 🔧 Correcting track to match manual mute state');
            mediaStreamTrack.enabled = !isMuted;
          }
        } else {
          // Fallback to publication.isMuted if mediaStreamTrack not available
          // But only if we haven't manually muted recently
          const now = Date.now();
          const recentlyManuallyMuted = manualMuteRef.current && (now - manualMuteRef.current.timestamp) < 5000;
          // CRITICAL: If publication says not muted, always show unmuted
          if (!micPublication.isMuted && isMuted === true && !recentlyManuallyMuted) {
            console.log('[VoiceAssistant] 🔧 Publication says not muted but state shows muted - correcting to unmuted');
            setIsMuted(false);
            isMutedRef.current = false;
            sessionStorage.setItem(muteStateKey, 'false');
          } else if (!recentlyManuallyMuted && micPublication.isMuted !== isMuted) {
            setIsMuted(micPublication.isMuted);
          }
        }
      }
    };

    checkMicStatus();
    
    // Listen for mute state changes on the publication
    const handleTrackMuted = () => {
      // Skip if we just manually muted/unmuted (within last 5 seconds to prevent override)
      const now = Date.now();
      if (manualMuteRef.current && (now - manualMuteRef.current.timestamp) < 5000) {
        console.log('[VoiceAssistant] Skipping handleTrackMuted - manual mute just happened (within 5s)');
        // Ensure track matches manual mute state
        const micPublication = localParticipant.getTrackPublication(Track.Source.Microphone);
        if (micPublication?.track) {
          const mediaStreamTrack = (micPublication.track as any).mediaStreamTrack;
          if (mediaStreamTrack && mediaStreamTrack.enabled === manualMuteRef.current.state) {
            mediaStreamTrack.enabled = !manualMuteRef.current.state;
            console.log('[VoiceAssistant] 🔧 Corrected track state in handleTrackMuted');
          }
        }
        return;
      }
      
      const micPublication = localParticipant.getTrackPublication(Track.Source.Microphone);
      if (micPublication) {
        // Access underlying MediaStreamTrack if available
        const mediaStreamTrack = micPublication.track ? (micPublication.track as any).mediaStreamTrack : null;
        const shouldBeMuted = mediaStreamTrack ? !mediaStreamTrack.enabled : micPublication.isMuted;
        
        // Only update if it's different AND we haven't manually set it recently
        if (shouldBeMuted !== isMuted) {
          setIsMuted(shouldBeMuted);
          console.log('[VoiceAssistant] Microphone mute state changed:', {
            publicationIsMuted: micPublication.isMuted,
            trackEnabled: mediaStreamTrack?.enabled,
            shouldBeMuted
          });
        }
      }
    };
    
    // Listen for track published events
    const handleTrackPublished = (publication: any) => {
      if (publication.kind === 'audio' && publication.source === Track.Source.Microphone) {
        console.log('[VoiceAssistant] ✅✅✅ MICROPHONE TRACK PUBLISHED!', {
          trackSid: publication.trackSid,
          muted: publication.isMuted,
          source: publication.source
        });
        // Set up mute listeners when track is published
        setIsMuted(publication.isMuted);
        
        // Store reference to MediaStreamTrack if available
        if (publication.track) {
          const mediaStreamTrack = (publication.track as any).mediaStreamTrack;
          if (mediaStreamTrack) {
            setAudioTrackRef(mediaStreamTrack);
          }
        }
        publication.on('muted', handleTrackMuted);
        publication.on('unmuted', handleTrackMuted);
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
        const mediaStreamTrack = (micPub.track as any).mediaStreamTrack;
        if (mediaStreamTrack) {
          setAudioTrackRef(mediaStreamTrack);
        }
      }
      micPub.on('muted', handleTrackMuted);
      micPub.on('unmuted', handleTrackMuted);
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
        existingPub.off('muted', handleTrackMuted);
        existingPub.off('unmuted', handleTrackMuted);
      }
      clearInterval(interval);
    };
  }, [localParticipant, room]);

  const toggleMute = async () => {
    console.log('[VoiceAssistant] 🔴 MUTE BUTTON CLICKED!');
    
    if (!localParticipant) {
      console.warn('[VoiceAssistant] No local participant');
      return;
    }
    
    // Find the audio publication and track
    const audioPub = localParticipant.getTrackPublication(Track.Source.Microphone);
    
    if (!audioPub) {
      console.warn('[VoiceAssistant] No audio publication found');
      return;
    }
    
    // Get current state from MediaStreamTrack.enabled (most reliable source)
    const mediaStreamTrack = audioPub.track ? (audioPub.track as any).mediaStreamTrack : null;
    const currentTrackEnabled = mediaStreamTrack?.enabled ?? !audioPub.isMuted;
    const currentMuted = !currentTrackEnabled;
    const newMutedState = !currentMuted;
    
    console.log('[VoiceAssistant] Toggling mute state from', currentMuted, 'to', newMutedState);
    
    // Mark that we're doing a manual mute (prevents monitoring code from overriding)
    manualMuteRef.current = { timestamp: Date.now(), state: newMutedState };
    
    // CRITICAL: Mute/unmute ALL track references to ensure audio stops
    const tracksToMute: MediaStreamTrack[] = [];
    
    // 1. Get track from publication (primary source)
    if (mediaStreamTrack && mediaStreamTrack.readyState === 'live') {
      tracksToMute.push(mediaStreamTrack);
    }
    
    // 2. Get track from audioTrackRef (if different and still valid)
    if (audioTrackRef && audioTrackRef !== mediaStreamTrack && audioTrackRef.readyState === 'live') {
      tracksToMute.push(audioTrackRef);
    }
    
    // Note: We avoid accessing stream.getTracks() as it might cause issues with LiveKit's internal state
    
    // Mute/unmute ALL found tracks (only if they're still live)
    console.log(`[VoiceAssistant] Found ${tracksToMute.length} track(s) to ${newMutedState ? 'MUTE' : 'UNMUTE'}`);
    tracksToMute.forEach((track, index) => {
      try {
        // Only modify tracks that are still live
        if (track.readyState === 'live' || track.readyState === 'ended') {
          track.enabled = !newMutedState; // enabled=false means muted
          console.log(`[VoiceAssistant] ✅ Track ${index + 1} ${newMutedState ? 'MUTED' : 'UNMUTED'}: enabled=${track.enabled}, id=${track.id}, readyState=${track.readyState}`);
        } else {
          console.warn(`[VoiceAssistant] ⚠️ Track ${index + 1} not in live state: ${track.readyState}`);
        }
      } catch (error) {
        console.error(`[VoiceAssistant] ❌ Error muting track ${index + 1}:`, error);
        // Continue with other tracks
      }
    });
    
    // Store the primary track reference
    if (mediaStreamTrack) {
      setAudioTrackRef(mediaStreamTrack);
    }
    
    // Update visual state IMMEDIATELY
    setIsMuted(newMutedState);
    
    // Verify mute state after a short delay (with error handling)
    setTimeout(() => {
      try {
        // Check if room and participant are still valid
        if (!room || room.state !== 'connected' || !localParticipant) {
          console.log('[VoiceAssistant] Skipping verification - room/participant no longer valid');
          return;
        }
        
        const verifyPub = localParticipant.getTrackPublication(Track.Source.Microphone);
        if (!verifyPub || !verifyPub.track) {
          console.log('[VoiceAssistant] Skipping verification - no track found');
          return;
        }
        
        const verifyTrack = (verifyPub.track as any).mediaStreamTrack;
        if (verifyTrack && verifyTrack.readyState === 'live') {
          const isActuallyMuted = !verifyTrack.enabled;
          if (isActuallyMuted !== newMutedState) {
            console.warn(`[VoiceAssistant] ⚠️ Mute state mismatch! Expected: ${newMutedState}, Actual: ${isActuallyMuted}. Fixing...`);
            verifyTrack.enabled = !newMutedState;
          } else {
            console.log(`[VoiceAssistant] ✅ Mute state verified: ${newMutedState ? 'MUTED' : 'UNMUTED'}`);
          }
        }
      } catch (error) {
        console.warn('[VoiceAssistant] Error verifying mute state:', error);
        // Don't throw - just log
      }
    }, 100);
    
    console.log(`[VoiceAssistant] ✅✅✅ MUTE STATE CHANGED: ${newMutedState ? 'MUTED' : 'UNMUTED'} ✅✅✅`);
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
            
            // CRITICAL: Ensure track is ENABLED before publishing
            // The agent needs to receive audio, so track MUST be enabled
            if (!audioTrack.enabled) {
              console.log('[VoiceAssistant] ⚠️ Track is disabled - ENABLING IT NOW for agent to receive audio');
              audioTrack.enabled = true;
            }
            
            // CRITICAL: Respect current mute state when publishing
            // BUT: Check actual track state first - if track is enabled, keep it enabled
            const actualTrackEnabled = audioTrack.enabled;
            if (isMutedRef.current && actualTrackEnabled) {
              // State says muted but track is enabled - correct the state
              console.log('[VoiceAssistant] 🔧 Track is enabled but state says muted - correcting state to unmuted');
              setIsMuted(false);
              isMutedRef.current = false;
              sessionStorage.setItem(muteStateKey, 'false');
            } else if (!isMutedRef.current && !actualTrackEnabled) {
              // State says unmuted but track is disabled - enable the track
              console.log('[VoiceAssistant] 🔧 Track is disabled but state says unmuted - enabling track');
              audioTrack.enabled = true;
            } else if (isMutedRef.current && !actualTrackEnabled) {
              // Both agree on muted - BUT we need to enable for agent to receive audio
              // The mute state is just for UI - agent still needs audio
              console.log('[VoiceAssistant] ⚠️ Mic state is muted BUT enabling track for agent to receive audio');
              audioTrack.enabled = true;
            }
            
            // CRITICAL: Final verification - track MUST be enabled for agent
            if (!audioTrack.enabled) {
              console.error('[VoiceAssistant] ❌❌❌ CRITICAL: Track is still disabled! Enabling now! ❌❌❌');
              audioTrack.enabled = true;
            }
            
            console.log('[VoiceAssistant] 📤 Publishing track with state:', {
              trackEnabled: audioTrack.enabled,
              trackReadyState: audioTrack.readyState,
              trackMuted: audioTrack.muted,
              isMutedState: isMutedRef.current
            });
            
            const publication = await localParticipant.publishTrack(audioTrack, {
              name: 'microphone',
              source: 'microphone' as any,
            });
            
            console.log('[VoiceAssistant] ✅✅✅ MICROPHONE TRACK PUBLISHED!', {
              trackSid: publication.trackSid,
              kind: publication.kind,
              source: publication.source,
              track: !!publication.track,
              trackEnabled: audioTrack.enabled,
              isMuted: isMutedRef.current,
              publicationMuted: publication.isMuted
            });
            
            // CRITICAL: Verify publication is not muted
            if (publication.isMuted) {
              console.error('[VoiceAssistant] ❌❌❌ WARNING: Publication is MUTED! Agent won\'t receive audio! ❌❌❌');
            }
            
            // Store reference to the audio track for muting (direct from MediaStreamTrack)
            setAudioTrackRef(audioTrack);
            console.log('[VoiceAssistant] ✅ Audio track reference stored for muting (direct track)');
            
            // Also store track from publication if available (get MediaStreamTrack)
            if (publication.track) {
              const publicationMediaStreamTrack = (publication.track as any).mediaStreamTrack;
              if (publicationMediaStreamTrack) {
                setAudioTrackRef(publicationMediaStreamTrack);
                console.log('[VoiceAssistant] ✅ Publication MediaStreamTrack reference also stored');
              }
            }
            
            // Wait a bit and verify publication is available via getTrackPublication
            setTimeout(() => {
              // Try to find the publication
              const micPub = localParticipant.getTrackPublication(Track.Source.Microphone);
              const allPublications = Array.from(localParticipant.trackPublications.values());
              const audioPublications = allPublications.filter(p => p.kind === 'audio');
              
              console.log('[VoiceAssistant] Verification check:', {
                bySource: !!micPub,
                totalPublications: allPublications.length,
                audioPublications: audioPublications.length,
                audioPubTrackSids: audioPublications.map(p => p.trackSid)
              });
              
              // Use the publication we got from publishTrack or find it
              const finalPub = publication || micPub || audioPublications[0];
              
              if (finalPub && finalPub.track) {
                const mediaStreamTrack = (finalPub.track as any).mediaStreamTrack;
                console.log('[VoiceAssistant] ✅✅✅ ALL GOOD! Microphone is live and published!', {
                  trackSid: finalPub.trackSid,
                  hasTrack: !!finalPub.track,
                  hasMediaStreamTrack: !!mediaStreamTrack
                });
                if (mediaStreamTrack) {
                  setAudioTrackRef(mediaStreamTrack);
                }
              } else {
                console.warn('[VoiceAssistant] ⚠️ Publication not found via getTrackPublication, but we have direct reference');
              }
            }, 1000);
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
          "w-12 h-12 rounded-full transition-all duration-200 hover:scale-105",
          isMuted 
            ? "bg-red-500 hover:bg-red-600 text-white border-2 border-red-600" 
            : "bg-primary hover:bg-primary/90 text-white"
        )}
        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        type="button"
      >
        {isMuted ? (
          <MicOff className="w-5 h-5 text-white stroke-2" />
        ) : (
          <Mic className="w-5 h-5 text-white" />
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

  const handleConnect = useCallback(async () => {
    const connectStartTime = Date.now();
    console.log('[VoiceAssistant] 🚀 Starting connection process...');
    
    // Generate a new unique room name for each connection attempt
    const newRoomName = `voice-assistant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log('[VoiceAssistant] Connecting with new room name:', newRoomName);
    setRoomName(newRoomName);
    
    try {
      const tokenStartTime = Date.now();
      console.log('[VoiceAssistant] 📡 Requesting token from Supabase Edge Function...');
      const result = await getToken(newRoomName);
      const tokenTime = Date.now() - tokenStartTime;
      console.log(`[VoiceAssistant] ⏱️ Token received in ${tokenTime}ms`);
      
      if (result && result.token && result.url) {
        console.log('[VoiceAssistant] ✅ Token and URL received:', {
          hasToken: !!result.token,
          hasUrl: !!result.url,
          roomName: result.roomName
        });
        setToken(result.token);
        setLivekitUrl(result.url);
        setRoomName(result.roomName);
        const totalTime = Date.now() - connectStartTime;
        console.log(`[VoiceAssistant] ✅✅✅ Connection setup complete in ${totalTime}ms ✅✅✅`);
        console.log('[VoiceAssistant] ✅ Token and URL received for room:', result.roomName);
      } else {
        console.error('[VoiceAssistant] ❌ Failed to get token - invalid result:', result);
        alert('Failed to connect to voice assistant. Please try again.');
      }
    } catch (error) {
      console.error('[VoiceAssistant] ❌ Connection error:', error);
      alert(`Failed to connect to voice assistant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [getToken]);

  useEffect(() => {
    if (open) {
      console.log('[VoiceAssistant] Modal opened, checking connection state...', {
        hasToken: !!token,
        tokenLoading,
        hasUrl: !!livekitUrl,
        roomName
      });
      
      if (!token && !tokenLoading) {
        console.log('[VoiceAssistant] No token and not loading, initiating connection...');
        handleConnect();
      } else if (tokenLoading) {
        console.log('[VoiceAssistant] Token is loading, waiting...');
      } else if (token && livekitUrl) {
        console.log('[VoiceAssistant] Token and URL already available, should connect automatically');
      }
    }
  }, [open, token, tokenLoading, livekitUrl, roomName, handleConnect]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!open) {
      console.log('[VoiceAssistant] Modal closed, cleaning up...');
      // Mark as disconnected first
      setIsConnected(false);
      // Reset state when modal closes (without disconnecting if already disconnected)
      if (!isConnected) {
        setToken(null);
        setLivekitUrl(null);
        // Generate new room name for next time
        const newRoomName = `voice-assistant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setRoomName(newRoomName);
      }
    }
  }, [open, isConnected, setIsConnected]);

  const handleDisconnect = async () => {
    console.log('[VoiceAssistant] 🔌 Disconnecting...');
    
    // Mark as disconnected first to prevent any pending operations
    setIsConnected(false);
    
    // Save conversation if was connected
    const wasConnected = isConnected;
    if (wasConnected) {
      try {
        await saveConversation(roomName);
      } catch (error) {
        console.error('[VoiceAssistant] Error saving conversation:', error);
      }
    }
    
    // Reset all connection state
    setToken(null);
    setLivekitUrl(null);
    clearTranscript();
    
    // Generate new room name for next connection
    const newRoomName = `voice-assistant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setRoomName(newRoomName);
    console.log('[VoiceAssistant] ✅ Disconnected, new room name ready:', newRoomName);
    
    // Small delay to ensure cleanup completes before closing modal
    setTimeout(() => {
      onOpenChange(false);
    }, 100);
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
          <span className="ml-2 text-sm text-muted-foreground">Connecting...</span>
        </div>
      ) : (
        <LiveKitRoom
          key={`room-${roomName}`} // Force remount when room name changes
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
            const connectionEndTime = Date.now();
            console.log('[VoiceAssistant] ✅✅✅ Connected to LiveKit room!', roomName);
            console.log(`[VoiceAssistant] ⏱️ Total connection time: ${connectionEndTime}ms`);
            setIsConnected(true);
          }}
          onDisconnected={(reason) => {
            console.log('[VoiceAssistant] Disconnected from LiveKit room, reason:', reason);
            setIsConnected(false);
            // Clean up any pending operations
            // The WebSocket cleanup is handled by LiveKit internally
          }}
          onError={(error) => {
            console.error('[VoiceAssistant] ❌ LiveKit error:', error);
            setIsConnected(false);
            // Don't auto-reconnect on error to avoid infinite loops
            // User can manually reconnect by closing and reopening the modal
          }}
        >
          <MicrophoneEnabler />
          <TranscriptCapture />
          <AgentNavigationListener />
          <PageContentSender />
          <DOMInteractionExecutor />
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
