import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useRoomContext, useDataChannel } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

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
  const { toast } = useToast();
  const room = useRoomContext();

  // Helper function to navigate to a URL string (defined first)
  const navigateToUrlFromString = (urlString: string) => {
    try {
      let pathname: string;

      if (urlString.startsWith("http://") || urlString.startsWith("https://")) {
        const url = new URL(urlString);
        pathname = url.pathname;
      } else {
        pathname = urlString.startsWith("/") ? urlString : `/${urlString}`;
      }

      console.log(`[Agent Navigation] Navigating to: ${pathname}`);
      navigate(pathname);

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
    } catch (error) {
      console.error("[Agent Navigation] Navigation error:", error);
    }
  };

  // Use useDataChannel hook (must be called unconditionally)
  // This is the recommended LiveKit method
  const { message } = useDataChannel("agent-navigation", (msg) => {
    console.log("[Agent Navigation] 📨 useDataChannel received message:", msg);
    try {
      // Handle both ReceivedDataMessage and raw messages
      const rawData = (msg as any)?.payload || (msg as any)?.data || msg;
      const data = typeof rawData === "string" ? JSON.parse(rawData) : rawData;

      if (data.type === "agent-navigation-url" || data.pathname || data.navigate) {
        const path = data.pathname || data.navigate || data.url;
        console.log("[Agent Navigation] 🎯🎯🎯 NAVIGATION FROM useDataChannel! 🎯🎯🎯", path);
        navigateToUrlFromString(path);
      }
    } catch (e) {
      console.error("[Agent Navigation] Error parsing useDataChannel message:", e, msg);
    }
  });

  // Log when message changes (for debugging)
  useEffect(() => {
    if (message) {
      console.log("[Agent Navigation] useDataChannel message updated:", message);
    }
  }, [message]);

  useEffect(() => {
    if (!room) {
      console.log("[Agent Navigation] No room context available yet");
      return;
    }

    // Define navigateToUrl inside useEffect to access navigate and toast
    const navigateToUrl = (urlString: string) => {
      try {
        let pathname: string;

        // Handle both full URLs and relative paths
        if (urlString.startsWith("http://") || urlString.startsWith("https://")) {
          // Full URL - parse it
          const url = new URL(urlString);

          // In development, allow localhost with different ports
          const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
          const isSameHostname = url.hostname === window.location.hostname;

          // Security: Only allow same hostname (or localhost in dev)
          if (!isSameHostname && !(isLocalhost && (url.hostname === "localhost" || url.hostname === "127.0.0.1"))) {
            console.warn(`[Agent Navigation] Blocked navigation to different hostname: ${url.hostname}`);
            toast({
              title: "Navigation Blocked",
              description: "Can only navigate within the same application",
              variant: "destructive",
            });
            return;
          }

          pathname = url.pathname;
        } else {
          // Relative path - use as is
          pathname = urlString.startsWith("/") ? urlString : `/${urlString}`;
        }

        console.log(`[Agent Navigation] Navigating to: ${pathname}`);

        navigate(pathname);

        // Show success toast with page name
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
        console.log(`[Agent Navigation] Successfully navigating to: ${pathname} (${pageName})`);
        toast({
          title: "Voice Agent Navigation",
          description: `Opening ${pageName}`,
        });
      } catch (error) {
        console.error("[Agent Navigation] Invalid URL:", urlString, error);
        toast({
          title: "Navigation Error",
          description: `Failed to navigate: ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive",
        });
      }
    };

    // Handle data messages from the agent
    const handleDataReceived = (payload: Uint8Array, participant: any, kind: any) => {
      console.log("[Agent Navigation] ✅✅✅ DATA RECEIVED! ✅✅✅", {
        payloadLength: payload.length,
        participant: participant?.identity,
        kind: kind,
        payloadPreview: Array.from(payload.slice(0, 100)),
      });

      try {
        const decoder = new TextDecoder();
        const rawText = decoder.decode(payload);
        console.log("[Agent Navigation] Decoded message:", rawText);

        const message = JSON.parse(rawText) as NavigationMessage;
        console.log("[Agent Navigation] Parsed message:", message);

        if (message.type === "agent-navigation-url") {
          console.log("[Agent Navigation] ✅ Navigation message recognized!", {
            url: message.url,
            pathname: message.pathname,
          });
          // Prefer pathname if provided (avoids origin issues), otherwise parse URL
          const urlToNavigate = message.pathname || message.url;
          console.log("[Agent Navigation] Navigating to:", urlToNavigate);
          navigateToUrl(urlToNavigate);
        } else {
          console.log("[Agent Navigation] ⚠️ Message type mismatch:", message.type, "Expected: agent-navigation-url");
        }
      } catch (error) {
        console.error("[Agent Navigation] ❌ Error parsing data message:", error);
        console.error("[Agent Navigation] Raw payload:", payload);
        // Try to log raw bytes for debugging
        try {
          const decoder = new TextDecoder();
          const text = decoder.decode(payload);
          console.error("[Agent Navigation] Decoded text:", text);
        } catch (e) {
          console.error("[Agent Navigation] Could not decode payload");
        }
      }
    };

    const setupListener = () => {
      console.log("[Agent Navigation] ✅ Setting up navigation listener", {
        roomName: room.name,
        participants: room.remoteParticipants.size,
        roomState: room.state,
      });

      // Subscribe to data messages
      console.log("[Agent Navigation] Subscribing to DataReceived events");
      room.on(RoomEvent.DataReceived, handleDataReceived);

      // Listen for new participants joining
      const handleParticipantConnected = (participant: any) => {
        console.log("[Agent Navigation] Participant connected:", participant.identity);
        participant.on("dataReceived", handleDataReceived);
        participant.on(RoomEvent.DataReceived, handleDataReceived);
      };
      room.on("participantConnected", handleParticipantConnected);

      // Subscribe to data channel events if available
      if (room.engine) {
        console.log("[Agent Navigation] Room engine available, setting up data channel listener");
        room.engine.on("data_received", handleDataReceived);
      }

      // FALLBACK: Monitor agent transcription/responses for navigation commands
      // Parse "NAVIGATE:/path" from agent's spoken response

      // Listen for transcription events from the agent
      const handleTranscription = (event: any) => {
        const text = event?.transcription?.text || event?.text || "";
        console.log("[Agent Navigation] Transcription received:", text);

        // Parse navigation command from agent response
        const navMatch = text.match(/NAVIGATE:(\/[^\s]*)/);
        if (navMatch) {
          const path = navMatch[1];
          console.log("[Agent Navigation] 🎯 Found navigation command in transcription:", path);
          navigateToUrl(path);
        }
      };

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
          // Listen for metadata changes on this participant
          p.on("metadataChanged", () => {
            console.log("[Agent Navigation] 📢 Metadata changed event fired for:", p.identity);
            handleMetadataChange(p);
          });
        }
      };

      // Check existing participants
      room.remoteParticipants.forEach(checkAgentMetadata);

      // Also check when new participants connect
      const handleNewParticipant = (participant: any) => {
        console.log("[Agent Navigation] New participant connected:", participant.identity);
        if (participant.identity.includes("agent")) {
          // Wait a bit for metadata to be set
          setTimeout(() => {
            checkAgentMetadata(participant);
          }, 1000);
        }
      };
      room.on("participantConnected", handleNewParticipant);

      room.on("participantMetadataChanged", handleMetadataChange);

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

      // Set up transcription listeners
      console.log("[Agent Navigation] Setting up transcription fallback listener");

      // Try multiple ways to listen to agent speech/transcription
      room.on("transcriptionReceived", handleTranscription);
      room.on("transcription", handleTranscription);

      // Also listen to remote participants for any text/data
      room.remoteParticipants.forEach((participant) => {
        if (participant.identity.includes("agent")) {
          console.log("[Agent Navigation] Setting up listener for agent participant:", participant.identity);
          participant.on("transcriptionReceived", handleTranscription);
          participant.on("transcription", handleTranscription);
        }
      });

      // Cleanup function
      const cleanup = () => {
        console.log("[Agent Navigation] Cleaning up event listeners");
        room.off(RoomEvent.DataReceived, handleDataReceived);
        room.off("dataReceived", handleDataReceived);
        room.off("participantConnected", handleParticipantConnected);
        room.off("participantMetadataChanged", handleMetadataChange);
        room.off("transcriptionReceived", handleTranscription);
        room.off("transcription", handleTranscription);

        // Clear polling interval
        if ((room as any)._navMetadataInterval) {
          clearInterval((room as any)._navMetadataInterval);
        }

        room.remoteParticipants.forEach((participant) => {
          participant.off("dataReceived", handleDataReceived);
          participant.off(RoomEvent.DataReceived, handleDataReceived);
          participant.off("transcriptionReceived", handleTranscription);
          participant.off("transcription", handleTranscription);
          participant.off("metadataChanged", handleMetadataChange);
        });
        if (room.engine) {
          room.engine.off("data_received", handleDataReceived);
        }
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
  }, [room, navigate, toast]);

  // Expose test function for debugging
  useEffect(() => {
    // Make navigateToUrl available globally for testing
    (window as any).testNavigation = (path: string) => {
      console.log("[Agent Navigation] 🧪 Manual navigation test:", path);
      const navigate = require("react-router-dom").useNavigate();
      // This won't work directly, but we can test via the room
      console.log('[Agent Navigation] Use: window.testNav("/whatsapp-reports")');
    };

    // Better: direct navigation test
    (window as any).testNav = (path: string) => {
      console.log("[Agent Navigation] 🧪 Testing direct navigation to:", path);
      navigate(path);
      toast({
        title: "Test Navigation",
        description: `Navigated to ${path}`,
      });
    };

    console.log('[Agent Navigation] Test functions available: window.testNav("/path")');
  }, [navigate, toast]);

  return null; // This is a listener component with no UI
};
