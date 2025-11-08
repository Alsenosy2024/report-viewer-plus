import { useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useRoomContext, useDataChannel } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { useVoiceAssistantContext } from "@/contexts/VoiceAssistantContext";

interface NavigationMessage {
  type: "agent-navigation-url";
  url: string;
  pathname?: string; // Optional: direct pathname from agent
}

/**
 * Component that listens for navigation URLs from the LiveKit voice agent
 * and executes them on the frontend.
 *
 * This component hooks into the existing LiveKit room connection created by
 * the VoiceAssistantModal. No additional configuration needed - it will
 * automatically start listening when the user connects to the voice assistant.
 *
 * The agent sends full URLs (e.g., "https://preview--report-viewer-plus.lovable.app/dashboard")
 * and this component extracts the pathname and navigates using React Router.
 */
export const AgentNavigationListener = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const room = useRoomContext();
  const { transcript } = useVoiceAssistantContext();

  // Track navigation state to prevent duplicates and race conditions
  const lastNavigationRef = useRef<{ pathname: string; timestamp: number } | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingNavigationRef = useRef<string | null>(null);
  const NAVIGATION_DEBOUNCE_MS = 0; // No debounce - execute immediately
  const DUPLICATE_WINDOW_MS = 2000; // Window for duplicate detection (2 seconds)

  console.log("[Agent Navigation] Component rendered", {
    hasRoom: !!room,
    roomState: room?.state,
    currentPath: location.pathname,
    participants: room?.remoteParticipants.size,
    participantIdentities: room ? Array.from(room.remoteParticipants.values()).map((p) => p.identity) : [],
  });

  // Helper function to normalize pathname (remove trailing slashes, etc.)
  const normalizePathname = useCallback((pathname: string): string => {
    // Remove trailing slash except for root
    let normalized = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    // Ensure it starts with /
    if (!normalized.startsWith("/")) {
      normalized = "/" + normalized;
    }
    return normalized;
  }, []);

  // Helper function to navigate to a URL string (defined first)
  const navigateToUrlFromString = useCallback(
    (urlString: string) => {
      try {
        let pathname: string;

        if (urlString.startsWith("http://") || urlString.startsWith("https://")) {
          const url = new URL(urlString);
          pathname = url.pathname;
        } else {
          pathname = urlString.startsWith("/") ? urlString : `/${urlString}`;
        }

        // Normalize pathname
        pathname = normalizePathname(pathname);
        const currentPath = normalizePathname(location.pathname);

        // Check if already on target page
        if (pathname === currentPath) {
          console.log(`[Agent Navigation] Already on target page: ${pathname}, skipping navigation`);
          toast({
            title: "Already Here",
            description: `You're already on ${pathname}`,
          });
          return;
        }

        // Check if this is a duplicate navigation (same path within duplicate window)
        const now = Date.now();
        if (
          lastNavigationRef.current &&
          lastNavigationRef.current.pathname === pathname &&
          now - lastNavigationRef.current.timestamp < DUPLICATE_WINDOW_MS
        ) {
          console.log(`[Agent Navigation] Duplicate navigation detected for ${pathname} (within ${DUPLICATE_WINDOW_MS}ms), ignoring`);
          return;
        }

        // If there's a pending navigation to a different path, cancel it
        if (navigationTimeoutRef.current && pendingNavigationRef.current !== pathname) {
          console.log(`[Agent Navigation] Cancelling pending navigation to ${pendingNavigationRef.current}, new navigation to ${pathname}`);
          clearTimeout(navigationTimeoutRef.current);
          navigationTimeoutRef.current = null;
        }

        // Store pending navigation
        pendingNavigationRef.current = pathname;

        // Update last navigation timestamp
        lastNavigationRef.current = { pathname, timestamp: now };

        // Clear any existing timeout
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }

        // Execute navigation immediately (no debounce)
        const executeNavigation = () => {
          // Double-check we're not already on this page (race condition protection)
          const currentPathCheck = normalizePathname(window.location.pathname);
          if (pathname === currentPathCheck) {
            console.log(`[Agent Navigation] Already navigated to ${pathname}, skipping`);
            pendingNavigationRef.current = null;
            return;
          }

          console.log(`[Agent Navigation] ✅✅✅ EXECUTING NAVIGATION NOW to: ${pathname} (from: ${currentPath})`);
          
          // Execute navigation immediately
          try {
            navigate(pathname);
            pendingNavigationRef.current = null;

            const pageNames: Record<string, string> = {
              "/": "Home",
              "/dashboard": "Dashboard",
              "/whatsapp-reports": "WhatsApp Reports",
              "/productivity-reports": "Productivity Reports",
              "/ads-reports": "Ads Reports",
              "/mail-reports": "Mail Reports",
              "/admin/settings": "Admin Settings",
              "/bots": "Bot Controls",
              "/social-posts": "Social Posts",
              "/content-ideas": "Content Ideas",
              "/meeting-summary": "Meeting Summary",
              "/courses-prices": "Courses & Prices",
              "/awaiting-approval": "Awaiting Approval",
            };

            const pageName = pageNames[pathname] || pathname;
            toast({
              title: "Voice Agent Navigation",
              description: `Opening ${pageName}`,
            });
            
            console.log(`[Agent Navigation] ✅✅✅ NAVIGATION COMPLETE: ${pathname} ✅✅✅`);
          } catch (error) {
            console.error(`[Agent Navigation] ❌ Navigation error:`, error);
            pendingNavigationRef.current = null;
          }
        };

        // Execute immediately (no timeout if debounce is 0)
        if (NAVIGATION_DEBOUNCE_MS > 0) {
          navigationTimeoutRef.current = setTimeout(executeNavigation, NAVIGATION_DEBOUNCE_MS);
        } else {
          executeNavigation();
        }
      } catch (error) {
        console.error("[Agent Navigation] Navigation error:", error);
      }
    },
    [navigate, toast, location.pathname, normalizePathname],
  );

  // Use useDataChannel hook (must be called unconditionally)
  // This is the recommended LiveKit method
  console.log('[Agent Navigation] Setting up useDataChannel hook with topic "agent-navigation"');
  console.log('[Agent Navigation] Room state:', room?.state);
  console.log('[Agent Navigation] Room name:', room?.name);
  
  const { message } = useDataChannel("agent-navigation", (msg) => {
    console.log("[Agent Navigation] 📨📨📨 useDataChannel callback received message:", {
      msg,
      msgType: typeof msg,
      msgKeys: msg ? Object.keys(msg as any) : [],
      hasPayload: !!(msg as any)?.payload,
      hasData: !!(msg as any)?.data,
      msgString: typeof msg === "string" ? msg : JSON.stringify(msg),
    });
    console.log("[Agent Navigation] 🔍🔍🔍 RAW MESSAGE RECEIVED 🔍🔍🔍", msg);

    try {
      // Handle both ReceivedDataMessage and raw messages
      let rawData: any;

      if (typeof msg === "string") {
        console.log("[Agent Navigation] Message is string, parsing JSON...");
        rawData = JSON.parse(msg);
      } else if ((msg as any)?.payload) {
        console.log("[Agent Navigation] Message has payload property");
        const payload = (msg as any).payload;
        rawData = typeof payload === "string" ? JSON.parse(payload) : payload;
      } else if ((msg as any)?.data) {
        console.log("[Agent Navigation] Message has data property");
        const data = (msg as any).data;
        rawData = typeof data === "string" ? JSON.parse(data) : data;
      } else {
        console.log("[Agent Navigation] Using message as-is");
        rawData = msg;
      }

      console.log("[Agent Navigation] Parsed useDataChannel data:", rawData);
      console.log("[Agent Navigation] 🔍🔍🔍 PARSED DATA STRUCTURE 🔍🔍🔍", JSON.stringify(rawData, null, 2));

      // Extract navigation path - check multiple possible fields
      let path: string | null = null;
      if (rawData.pathname) {
        path = rawData.pathname;
        console.log("[Agent Navigation] ✅ Found pathname:", path);
      } else if (rawData.navigate) {
        path = rawData.navigate;
        console.log("[Agent Navigation] ✅ Found navigate:", path);
      } else if (rawData.url) {
        path = rawData.url;
        console.log("[Agent Navigation] ✅ Found url:", path);
      } else if (rawData.type === "agent-navigation-url" && rawData.url) {
        path = rawData.url;
        console.log("[Agent Navigation] ✅ Found url from type check:", path);
      }

      if (path) {
        console.log("[Agent Navigation] 🎯🎯🎯 NAVIGATION FROM useDataChannel! 🎯🎯🎯", path);
        console.log("[Agent Navigation] Calling navigateToUrlFromString with:", path);
        // Execute navigation immediately (debouncing is handled in navigateToUrlFromString)
        navigateToUrlFromString(path);
      } else {
        console.error("[Agent Navigation] ❌❌❌ NO NAVIGATION PATH FOUND! ❌❌❌", {
          rawData,
          hasPathname: !!rawData.pathname,
          hasNavigate: !!rawData.navigate,
          hasUrl: !!rawData.url,
          type: rawData.type,
          allKeys: Object.keys(rawData),
        });
      }
    } catch (e) {
      console.error("[Agent Navigation] ❌ Error parsing useDataChannel message:", e, msg);
      console.error("[Agent Navigation] Error details:", {
        error: e,
        message: msg,
        messageType: typeof msg,
      });
    }
  });

  // Log when message changes (for debugging)
  useEffect(() => {
    if (message) {
      console.log("[Agent Navigation] 📨 useDataChannel message state updated:", {
        message,
        messageType: typeof message,
        messageKeys: message ? Object.keys(message as any) : [],
      });

      try {
        // Try to parse and handle the message state
        let rawData: any;
        if (typeof message === "string") {
          rawData = JSON.parse(message);
        } else if ((message as any)?.payload) {
          const payload = (message as any).payload;
          rawData = typeof payload === "string" ? JSON.parse(payload) : payload;
        } else if ((message as any)?.data) {
          const data = (message as any).data;
          rawData = typeof data === "string" ? JSON.parse(data) : data;
        } else {
          rawData = message;
        }

        if (rawData.type === "agent-navigation-url" || rawData.pathname || rawData.navigate) {
          const path = rawData.pathname || rawData.navigate || rawData.url;
          console.log("[Agent Navigation] 🎯🎯🎯 NAVIGATION FROM useDataChannel message state! 🎯🎯🎯", path);
          navigateToUrlFromString(path);
        }
      } catch (e) {
        console.error("[Agent Navigation] Error parsing useDataChannel message state:", e, message);
      }
    }
  }, [message, navigateToUrlFromString]);

  useEffect(() => {
    if (!room) {
      console.log("[Agent Navigation] No room context available yet");
      return;
    }

    // Define navigateToUrl inside useEffect - delegates to navigateToUrlFromString for consistency
    // This ensures both useDataChannel and RoomEvent.DataReceived use the same navigation logic
    const navigateToUrl = (urlString: string) => {
      // Use the same debounced navigation function
      navigateToUrlFromString(urlString);
    };

    // Handle data messages from the agent via RoomEvent.DataReceived
    // Note: RoomEvent.DataReceived signature is: (payload: Uint8Array, participant?: RemoteParticipant, kind?: DataPacket_Kind, topic?: string)
    const handleDataReceived = (payload: Uint8Array, participant?: any, kind?: any, topic?: string) => {
      console.log("[Agent Navigation] ✅✅✅ DATA RECEIVED via RoomEvent! ✅✅✅", {
        payloadLength: payload.length,
        participant: participant?.identity || "unknown",
        participantIdentity: participant?.identity,
        kind: kind,
        topic: topic,
        payloadPreview: Array.from(payload.slice(0, 100)),
        isFromAgent: participant?.identity?.includes("agent") || false,
      });

      // Don't filter by participant - accept data from anyone (agent might send via different participant)
      // Only filter by topic if it's explicitly set and not our topic
      if (topic && topic !== "agent-navigation" && topic !== "page-content" && topic !== "dom-action-result") {
        console.log("[Agent Navigation] Ignoring data with topic:", topic);
        return;
      }
      
      // Log participant info but don't filter
      if (participant) {
        console.log("[Agent Navigation] Data from participant:", participant.identity, "isAgent:", participant.identity.includes("agent"));
      }

      try {
        const decoder = new TextDecoder();
        const rawText = decoder.decode(payload);
        console.log("[Agent Navigation] Decoded message text:", rawText);

        const message = JSON.parse(rawText) as NavigationMessage;
        console.log("[Agent Navigation] Parsed message object:", message);

        // Extract navigation path - check multiple possible fields
        let path: string | null = null;
        if (message.type === "agent-navigation-url") {
          console.log("[Agent Navigation] ✅ Navigation message recognized!", {
            url: message.url,
            pathname: message.pathname,
          });
          // Prefer pathname if provided (avoids origin issues), otherwise parse URL
          path = message.pathname || message.url;
        } else if (message.pathname) {
          path = message.pathname;
        } else if ((message as any).navigate) {
          path = (message as any).navigate;
        } else if (message.url) {
          path = message.url;
        }

        if (path) {
          console.log("[Agent Navigation] 🎯🎯🎯 NAVIGATING FROM RoomEvent.DataReceived! 🎯🎯🎯", path);
          navigateToUrl(path);
        } else {
          console.log("[Agent Navigation] ⚠️ Message does not contain navigation path:", {
            type: message.type,
            keys: Object.keys(message),
            message: message,
          });
        }
      } catch (error) {
        console.error("[Agent Navigation] ❌ Error parsing data message:", error);
        console.error("[Agent Navigation] Raw payload length:", payload.length);
        // Try to log raw bytes for debugging
        try {
          const decoder = new TextDecoder();
          const text = decoder.decode(payload);
          console.error("[Agent Navigation] Decoded text (error case):", text);
        } catch (e) {
          console.error("[Agent Navigation] Could not decode payload:", e);
        }
      }
    };

    const setupListener = () => {
      console.log("[Agent Navigation] ✅ Setting up navigation listener", {
        roomName: room.name,
        participants: room.remoteParticipants.size,
        roomState: room.state,
      });

      // Subscribe to data messages - PRIMARY method
      // IMPORTANT: RoomEvent.DataReceived fires for ALL data messages in the room
      // The participant parameter in the callback tells us who sent it
      // We do NOT need to listen on individual participants - that's not a valid API
      console.log("[Agent Navigation] Subscribing to RoomEvent.DataReceived for room-level data");
      room.on(RoomEvent.DataReceived, handleDataReceived);

      // Log all remote participants for debugging
      console.log("[Agent Navigation] Remote participants count:", room.remoteParticipants.size);
      room.remoteParticipants.forEach((participant) => {
        console.log("[Agent Navigation]   - Remote participant:", participant.identity, {
          isAgent: participant.identity.includes("agent"),
          hasMetadata: !!participant.metadata,
        });
      });

      // Listen for new participants joining
      const handleParticipantConnected = (participant: any) => {
        console.log("[Agent Navigation] Participant connected:", participant.identity);

        // Check agent metadata when participant connects
        if (participant.identity.includes("agent")) {
          console.log("[Agent Navigation] Agent participant connected - will check metadata");
          setTimeout(() => {
            if (participant.metadata) {
              console.log("[Agent Navigation] Agent has metadata on connect:", participant.metadata);
              handleMetadataChange(participant);
            } else {
              console.log("[Agent Navigation] Agent connected but no metadata yet");
            }
          }, 1000);
        }
      };
      room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);

      // Note: room.engine events are not part of the public API, using RoomEvent.DataReceived instead

      // Note: Transcription events are not available in LiveKit RoomEvent API
      // Navigation is handled via DataReceived events and metadata changes

      // Monitor participant metadata changes (PRIMARY METHOD)
      let lastCheckedMetadata: string | null = null;

      const handleMetadataChange = (participant: any) => {
        console.log("[Agent Navigation] Metadata changed event!", {
          participant: participant?.identity,
          metadata: participant?.metadata,
          isAgent: participant?.identity?.includes("agent"),
        });

        if (participant?.identity?.includes("agent")) {
          const metadata = participant.metadata;
          if (metadata && metadata !== lastCheckedMetadata) {
            lastCheckedMetadata = metadata;
            console.log("[Agent Navigation] 🔍 Checking agent metadata:", metadata);

            try {
              const parsed = JSON.parse(metadata);
              console.log("[Agent Navigation] Parsed metadata:", parsed);
              if (parsed.navigate || parsed.path) {
                const path = parsed.path || parsed.navigate;
                console.log("[Agent Navigation] 🎯🎯🎯 FOUND NAVIGATION IN METADATA! 🎯🎯🎯", path);
                navigateToUrl(path);
                return;
              }
            } catch (e) {
              // Not JSON, check if it's a plain NAVIGATE command
              console.log("[Agent Navigation] Metadata is not JSON, checking for NAVIGATE pattern");
              const navMatch = metadata.match(/NAVIGATE:(\/[^\s]*)/);
              if (navMatch) {
                console.log("[Agent Navigation] 🎯 Found navigation in metadata text:", navMatch[1]);
                navigateToUrl(navMatch[1]);
                return;
              }
            }
          }
        }
      };

      // Check metadata on participant connect and when new participants join
      const checkAgentMetadata = (p: any) => {
        if (p.identity.includes("agent")) {
          console.log("[Agent Navigation] 🔍 Checking agent metadata:", {
            identity: p.identity,
            metadata: p.metadata,
            metadataType: typeof p.metadata,
            hasMetadata: !!p.metadata,
          });
          if (p.metadata) {
            handleMetadataChange(p);
          }
          // Metadata changes are handled via RoomEvent.ParticipantMetadataChanged
        }
      };

      // Check existing participants
      room.remoteParticipants.forEach(checkAgentMetadata);

      // Monitor metadata changes via RoomEvent
      room.on(RoomEvent.ParticipantMetadataChanged, handleMetadataChange);

      // Also check existing participants again after setup (in case metadata was set before listener)
      setTimeout(() => {
        room.remoteParticipants.forEach((participant) => {
          if (participant.identity.includes("agent")) {
            console.log("[Agent Navigation] 🔍 Delayed check - agent metadata:", {
              identity: participant.identity,
              metadata: participant.metadata,
            });
            if (participant.metadata) {
              handleMetadataChange(participant);
            }
          }
        });
      }, 2000);

      // POLLING FALLBACK: Check metadata periodically (in case events don't fire)
      let pollCount = 0;
      const metadataCheckInterval = setInterval(() => {
        pollCount++;
        room.remoteParticipants.forEach((p) => {
          if (p.identity.includes("agent")) {
            const currentMetadata = p.metadata;
            if (currentMetadata && currentMetadata !== lastCheckedMetadata) {
              console.log("[Agent Navigation] 🔄 Polling detected metadata change!", {
                pollCount,
                oldMetadata: lastCheckedMetadata,
                newMetadata: currentMetadata,
                participant: p.identity,
              });
              handleMetadataChange(p);
            } else if (pollCount % 20 === 0) {
              // Log every 10 seconds (20 * 500ms)
              console.log("[Agent Navigation] Polling check (every 10s):", {
                participant: p.identity,
                hasMetadata: !!currentMetadata,
                metadata: currentMetadata?.substring(0, 100), // First 100 chars
                lastChecked: lastCheckedMetadata?.substring(0, 100),
              });
            }

            // DEBUG: Also log ALL metadata we see (even if same)
            if (pollCount === 1 || pollCount % 10 === 0) {
              console.log("[Agent Navigation] 🔍 Current agent metadata state:", {
                participant: p.identity,
                metadata: currentMetadata || "(null/empty)",
                lastChecked: lastCheckedMetadata || "(null)",
                areEqual: currentMetadata === lastCheckedMetadata,
              });
            }
          }
        });
      }, 500); // Check every 500ms

      // Store interval for cleanup
      (room as any)._navMetadataInterval = metadataCheckInterval;

      // Note: Transcription events are not available in LiveKit RoomEvent API
      // Navigation is handled via DataReceived events and metadata changes

      // Cleanup function
      const cleanup = () => {
        console.log("[Agent Navigation] Cleaning up event listeners");
        room.off(RoomEvent.DataReceived, handleDataReceived);
        room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
        room.off(RoomEvent.ParticipantMetadataChanged, handleMetadataChange);

        // Clear polling interval
        if ((room as any)._navMetadataInterval) {
          clearInterval((room as any)._navMetadataInterval);
        }

        // Note: We don't need to clean up participant listeners since we only listen on room
      };

      return cleanup;
    };

    // Wait for room to be connected before setting up listener
    if (room.state !== "connected") {
      console.log("[Agent Navigation] Room not connected yet, state:", room.state);

      const handleConnected = () => {
        console.log("[Agent Navigation] Room connected, setting up listener now");
        return setupListener();
      };

      room.on("connected", handleConnected);

      return () => {
        room.off("connected", handleConnected);
      };
    }

    // Room is already connected, setup listener immediately
    return setupListener();
  }, [room, navigate, toast, navigateToUrlFromString]);

  // FALLBACK: Listen to transcript for NAVIGATE: patterns (in case data channel fails)
  const lastProcessedTranscriptRef = useRef<number>(0);
  useEffect(() => {
    // Check latest transcript messages for NAVIGATE: patterns
    if (transcript.length > lastProcessedTranscriptRef.current) {
      const newMessages = transcript.slice(lastProcessedTranscriptRef.current);
      for (const message of newMessages) {
        if (message.role === 'assistant') {
          // Look for NAVIGATE: pattern in agent's response
          const navMatch = message.content.match(/NAVIGATE:(\/[^\s]*)/);
          if (navMatch) {
            const path = navMatch[1];
            console.log("[Agent Navigation] 🎯🎯🎯 FOUND NAVIGATE PATTERN IN TRANSCRIPT! 🎯🎯🎯", path);
            console.log("[Agent Navigation] Full message:", message.content);
            navigateToUrlFromString(path);
          }
        }
      }
      lastProcessedTranscriptRef.current = transcript.length;
    }
  }, [transcript, navigateToUrlFromString]);

  // Expose test function for debugging
  useEffect(() => {
    // Direct navigation test
    (window as any).testNav = (path: string) => {
      console.log("[Agent Navigation] 🧪 Testing direct navigation to:", path);
      navigateToUrlFromString(path);
    };
    
    // Test function to simulate receiving a navigation message
    (window as any).testNavMessage = (pathname: string) => {
      console.log("[Agent Navigation] 🧪 Testing navigation message with pathname:", pathname);
      const testMessage = {
        type: "agent-navigation-url",
        url: `https://example.com${pathname}`,
        pathname: pathname
      };
      console.log("[Agent Navigation] Simulating message:", testMessage);
      navigateToUrlFromString(pathname);
    };

    console.log('[Agent Navigation] Test functions available:');
    console.log('  window.testNav("/dashboard") - Test direct navigation');
    console.log('  window.testNavMessage("/dashboard") - Test navigation message');
  }, [navigateToUrlFromString]);

  return null; // This is a listener component with no UI
};
