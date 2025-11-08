import { useEffect, useRef, useCallback } from 'react';
import { useRoomContext, useRemoteParticipant } from '@livekit/components-react';
import { useVoiceAssistantContext } from '@/contexts/VoiceAssistantContext';
import { RoomEvent } from 'livekit-client';

/**
 * Component that captures agent responses and adds them to the transcript
 * CRITICAL: This component must NOT interfere with navigation or mic state
 * - Early returns for navigation messages BEFORE any processing
 * - Deferred transcript updates to prevent blocking navigation
 * - Minimal processing overhead
 */
export const TranscriptCapture = () => {
  const room = useRoomContext();
  const { addMessage } = useVoiceAssistantContext();
  // Track processed messages to prevent duplicates
  const processedMessagesRef = useRef<Set<string>>(new Set());
  // Queue for deferred message processing to avoid blocking navigation
  const messageQueueRef = useRef<Array<{ role: 'assistant'; content: string }>>([]);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process queued messages asynchronously to avoid blocking
  const processMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length === 0) return;
    
    const messages = [...messageQueueRef.current];
    messageQueueRef.current = [];
    
    // Process messages in next tick to avoid blocking
    setTimeout(() => {
      messages.forEach(msg => {
        addMessage(msg.role, msg.content);
      });
    }, 0);
  }, [addMessage]);

  useEffect(() => {
    if (!room) return;

    // Helper to check if message contains navigation command (FAST check)
    const containsNavigation = (text: string): boolean => {
      return text.includes('NAVIGATE:') || /NAVIGATE:\/[^\s]*/.test(text);
    };

    // Helper to extract non-navigation text from response
    const extractNonNavigationText = (text: string): string | null => {
      const navMatch = text.match(/NAVIGATE:\/[^\s]*\s*(.*)/);
      if (navMatch && navMatch[1]) {
        return navMatch[1].trim();
      }
      return null;
    };

    // Helper to create message hash for deduplication
    const createMessageHash = (text: string): string => {
      return text.substring(0, 200).replace(/\s+/g, '').toLowerCase();
    };

    // Listen for data received events - agent might send responses via data channel
    const handleDataReceived = (
      payload: Uint8Array,
      participant?: any,
      kind?: any,
      topic?: string
    ) => {
      // CRITICAL: Early return for navigation messages BEFORE any processing
      if (topic === 'agent-navigation') {
        return; // Skip immediately, no logging, no processing
      }
      
      // CRITICAL: Only process agent messages
      if (!participant || !participant.identity?.includes('agent')) {
        if (topic !== 'agent-response') {
          return; // Skip non-agent messages unless explicitly agent-response topic
        }
      }
      
      try {
        const decoder = new TextDecoder();
        const text = decoder.decode(payload);
        
        // CRITICAL: Fast navigation check BEFORE any other processing
        if (containsNavigation(text)) {
          // Check if there's non-navigation text to extract
          const nonNavText = extractNonNavigationText(text);
          if (nonNavText) {
            // Queue the non-navigation text for deferred processing
            const responseHash = createMessageHash(nonNavText);
            if (!processedMessagesRef.current.has(responseHash)) {
              messageQueueRef.current.push({ role: 'assistant', content: nonNavText });
              processedMessagesRef.current.add(responseHash);
              
              // Process queue asynchronously
              if (processingTimeoutRef.current) {
                clearTimeout(processingTimeoutRef.current);
              }
              processingTimeoutRef.current = setTimeout(processMessageQueue, 10);
            }
          }
          return; // Skip navigation messages immediately
        }
        
        // Check for duplicates BEFORE parsing JSON
        const messageHash = createMessageHash(text);
        if (processedMessagesRef.current.has(messageHash)) {
          return; // Skip duplicates immediately
        }
        
        try {
          const data = JSON.parse(text);
          
          // CRITICAL: Fast navigation check in JSON
          if (data.type === 'agent-navigation-url' || data.pathname || data.navigate) {
            return; // Skip navigation JSON immediately
          }
          
          // If it's a response message, process it
          if (data.type === 'agent-response' || data.response || data.text) {
            const responseText = data.response || data.text || text;
            
            // Check for navigation in response text
            if (containsNavigation(responseText)) {
              const nonNavText = extractNonNavigationText(responseText);
              if (nonNavText) {
                const responseHash = createMessageHash(nonNavText);
                if (!processedMessagesRef.current.has(responseHash)) {
                  messageQueueRef.current.push({ role: 'assistant', content: nonNavText });
                  processedMessagesRef.current.add(responseHash);
                  
                  if (processingTimeoutRef.current) {
                    clearTimeout(processingTimeoutRef.current);
                  }
                  processingTimeoutRef.current = setTimeout(processMessageQueue, 10);
                }
              }
              return; // Skip navigation responses immediately
            }
            
            // Queue non-navigation response for deferred processing
            const responseHash = createMessageHash(responseText);
            if (!processedMessagesRef.current.has(responseHash)) {
              messageQueueRef.current.push({ role: 'assistant', content: responseText });
              processedMessagesRef.current.add(responseHash);
              
              if (processingTimeoutRef.current) {
                clearTimeout(processingTimeoutRef.current);
              }
              processingTimeoutRef.current = setTimeout(processMessageQueue, 10);
            }
          }
        } catch (e) {
          // Not JSON, might be plain text response
          if (text.length > 10 && !text.startsWith('{')) {
            const textHash = createMessageHash(text);
            if (!processedMessagesRef.current.has(textHash)) {
              messageQueueRef.current.push({ role: 'assistant', content: text });
              processedMessagesRef.current.add(textHash);
              
              if (processingTimeoutRef.current) {
                clearTimeout(processingTimeoutRef.current);
              }
              processingTimeoutRef.current = setTimeout(processMessageQueue, 10);
            }
          }
        }
      } catch (e2) {
        // Silently ignore decoding errors to avoid blocking
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    // Also listen for metadata changes - agent might put response in metadata
    const handleMetadataChanged = (participant: any) => {
      // CRITICAL: Early return if not agent
      if (!participant?.identity?.includes('agent') || !participant.metadata) {
        return;
      }
      
      try {
        const metadata = JSON.parse(participant.metadata);
        
        // CRITICAL: Fast navigation check in metadata
        if (metadata.navigate || metadata.pathname || metadata.type === 'navigation') {
          return; // Skip navigation metadata immediately
        }
        
        // Check for response text
        if (metadata.response || metadata.text) {
          const responseText = metadata.response || metadata.text;
          
          // Check for navigation in response
          if (containsNavigation(responseText)) {
            const nonNavText = extractNonNavigationText(responseText);
            if (nonNavText) {
              const responseHash = createMessageHash(nonNavText);
              if (!processedMessagesRef.current.has(responseHash)) {
                messageQueueRef.current.push({ role: 'assistant', content: nonNavText });
                processedMessagesRef.current.add(responseHash);
                
                if (processingTimeoutRef.current) {
                  clearTimeout(processingTimeoutRef.current);
                }
                processingTimeoutRef.current = setTimeout(processMessageQueue, 10);
              }
            }
            return; // Skip navigation responses immediately
          }
          
          // Queue non-navigation response for deferred processing
          const responseHash = createMessageHash(responseText);
          if (!processedMessagesRef.current.has(responseHash)) {
            messageQueueRef.current.push({ role: 'assistant', content: responseText });
            processedMessagesRef.current.add(responseHash);
            
            if (processingTimeoutRef.current) {
              clearTimeout(processingTimeoutRef.current);
            }
            processingTimeoutRef.current = setTimeout(processMessageQueue, 10);
          }
        }
      } catch (e) {
        // Metadata might be plain text
        if (participant.metadata.length > 10) {
          const metadataText = participant.metadata;
          
          // Fast navigation check
          if (containsNavigation(metadataText)) {
            return; // Skip navigation metadata immediately
          }
          
          const metadataHash = createMessageHash(metadataText);
          if (!processedMessagesRef.current.has(metadataHash)) {
            messageQueueRef.current.push({ role: 'assistant', content: metadataText });
            processedMessagesRef.current.add(metadataHash);
            
            if (processingTimeoutRef.current) {
              clearTimeout(processingTimeoutRef.current);
            }
            processingTimeoutRef.current = setTimeout(processMessageQueue, 10);
          }
        }
      }
    };

    room.on(RoomEvent.ParticipantMetadataChanged, handleMetadataChanged);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.ParticipantMetadataChanged, handleMetadataChanged);
      
      // Clear processing timeout
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      
      // Process any remaining queued messages
      processMessageQueue();
      
      // Clear processed messages on cleanup
      processedMessagesRef.current.clear();
      messageQueueRef.current = [];
    };
  }, [room, addMessage, processMessageQueue]);

  return null;
};

