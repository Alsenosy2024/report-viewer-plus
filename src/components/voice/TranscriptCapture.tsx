import { useEffect, useRef } from 'react';
import { useRoomContext, useRemoteParticipant } from '@livekit/components-react';
import { useVoiceAssistantContext } from '@/contexts/VoiceAssistantContext';
import { RoomEvent } from 'livekit-client';

/**
 * Component that captures agent responses and adds them to the transcript
 * This ensures the transcript is populated so navigation patterns can be detected
 * 
 * CRITICAL: Does NOT add navigation messages - those are handled by AgentNavigationListener
 */
export const TranscriptCapture = () => {
  const room = useRoomContext();
  const { addMessage } = useVoiceAssistantContext();
  const processedMessagesRef = useRef<Set<string>>(new Set()); // Track processed messages to prevent duplicates

  useEffect(() => {
    if (!room) return;

    console.log('[TranscriptCapture] Setting up transcript capture');

    // Listen for data received events - agent might send responses via data channel
    const handleDataReceived = (
      payload: Uint8Array,
      participant?: any,
      kind?: any,
      topic?: string
    ) => {
      console.log('[TranscriptCapture] 📨 Data received:', {
        participant: participant?.identity,
        topic: topic || '(no topic)',
        payloadLength: payload.length,
        isFromAgent: participant?.identity?.includes('agent') || false
      });
      
      // CRITICAL: Skip navigation messages - they're handled by AgentNavigationListener
      if (topic === 'agent-navigation') {
        console.log('[TranscriptCapture] ⏭️ Skipping navigation message - handled by AgentNavigationListener');
        return;
      }
      
      // Accept data from agent participant OR if topic is agent-response
      if ((participant && participant.identity.includes('agent')) || topic === 'agent-response') {
        try {
          const decoder = new TextDecoder();
          const text = decoder.decode(payload);
          console.log('[TranscriptCapture] Decoded text:', text.substring(0, 200));
          
          // CRITICAL: Skip if this message contains navigation commands
          if (text.includes('NAVIGATE:') || text.includes('agent-navigation-url')) {
            console.log('[TranscriptCapture] ⏭️ Skipping message with navigation command - handled by AgentNavigationListener');
            return;
          }
          
          // Create a hash of the message to prevent duplicates
          const messageHash = `${participant?.identity || 'unknown'}-${text.substring(0, 100)}`;
          if (processedMessagesRef.current.has(messageHash)) {
            console.log('[TranscriptCapture] ⏭️ Skipping duplicate message');
            return;
          }
          processedMessagesRef.current.add(messageHash);
          
          // Clean up old hashes (keep only last 50)
          if (processedMessagesRef.current.size > 50) {
            const firstHash = Array.from(processedMessagesRef.current)[0];
            processedMessagesRef.current.delete(firstHash);
          }
          
          try {
            const data = JSON.parse(text);
            console.log('[TranscriptCapture] Parsed JSON:', data);
            
            // CRITICAL: Skip navigation messages
            if (data.type === 'agent-navigation-url' || data.navigate || data.pathname) {
              console.log('[TranscriptCapture] ⏭️ Skipping navigation message in JSON - handled by AgentNavigationListener');
              return;
            }
            
            // If it's a response message, add to transcript
            if (data.type === 'agent-response' || data.response || data.text) {
              const responseText = data.response || data.text || text;
              // CRITICAL: Don't add if it contains navigation commands
              if (responseText.includes('NAVIGATE:')) {
                console.log('[TranscriptCapture] ⏭️ Skipping response with navigation command');
                return;
              }
              console.log('[TranscriptCapture] 📝📝📝 CAPTURED AGENT RESPONSE! 📝📝📝', responseText);
              addMessage('assistant', responseText);
            }
          } catch (e) {
            // Not JSON, might be plain text response
            if (text.length > 10 && !text.startsWith('{')) {
              // CRITICAL: Don't add if it contains navigation commands
              if (text.includes('NAVIGATE:')) {
                console.log('[TranscriptCapture] ⏭️ Skipping text with navigation command');
                return;
              }
              console.log('[TranscriptCapture] 📝 Captured agent text response (not JSON):', text);
              addMessage('assistant', text);
            }
          }
        } catch (e2) {
          console.error('[TranscriptCapture] Error decoding payload:', e2);
        }
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    // Also listen for metadata changes - agent might put response in metadata
    const handleMetadataChanged = (participant: any) => {
      console.log('[TranscriptCapture] 🔄 Metadata changed:', {
        participant: participant?.identity,
        hasMetadata: !!participant?.metadata,
        metadataLength: participant?.metadata?.length || 0
      });
      
      if (participant.identity.includes('agent') && participant.metadata) {
        try {
          const metadata = JSON.parse(participant.metadata);
          console.log('[TranscriptCapture] Parsed metadata:', metadata);
          
          // CRITICAL: Skip navigation metadata - handled by AgentNavigationListener
          if (metadata.navigate || metadata.pathname || metadata.type === 'navigation') {
            console.log('[TranscriptCapture] ⏭️ Skipping navigation metadata - handled by AgentNavigationListener');
            return;
          }
          
          // Create hash to prevent duplicates
          const metadataHash = `${participant.identity}-${participant.metadata.substring(0, 100)}`;
          if (processedMessagesRef.current.has(metadataHash)) {
            console.log('[TranscriptCapture] ⏭️ Skipping duplicate metadata');
            return;
          }
          processedMessagesRef.current.add(metadataHash);
          
          // Check for response text
          if (metadata.response || metadata.text) {
            const responseText = metadata.response || metadata.text;
            // CRITICAL: Don't add if it contains navigation commands
            if (responseText.includes('NAVIGATE:')) {
              console.log('[TranscriptCapture] ⏭️ Skipping metadata response with navigation command');
              return;
            }
            console.log('[TranscriptCapture] 📝📝📝 CAPTURED AGENT RESPONSE FROM METADATA! 📝📝📝', responseText);
            addMessage('assistant', responseText);
          }
        } catch (e) {
          // Metadata might be plain text
          if (participant.metadata.length > 10) {
            // CRITICAL: Don't add if it contains navigation commands
            if (participant.metadata.includes('NAVIGATE:')) {
              console.log('[TranscriptCapture] ⏭️ Skipping plain text metadata with navigation command');
              return;
            }
            console.log('[TranscriptCapture] 📝 Captured agent text from metadata (plain text):', participant.metadata.substring(0, 200));
            addMessage('assistant', participant.metadata);
          }
        }
      }
    };

    room.on(RoomEvent.ParticipantMetadataChanged, handleMetadataChanged);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.ParticipantMetadataChanged, handleMetadataChanged);
      processedMessagesRef.current.clear();
    };
  }, [room, addMessage]);

  return null;
};

