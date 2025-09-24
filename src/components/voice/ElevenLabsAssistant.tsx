import React, { useEffect, useState } from "react";
import { useConversation } from "@11labs/react";
import { useNavigationTools } from "@/hooks/useNavigationTools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Lightweight, global ElevenLabs assistant with proper clientTools wiring
const ElevenLabsAssistant: React.FC = () => {
  const { clientTools } = useNavigationTools();

  const [agentId, setAgentId] = useState<string>(
    (typeof localStorage !== "undefined" && localStorage.getItem("elevenlabs_agent_id")) || ""
  );

  const conversation = useConversation({
    clientTools,
    onConnect: () => console.log("[ElevenLabs] Connected"),
    onDisconnect: () => console.log("[ElevenLabs] Disconnected"),
    onMessage: (msg) => console.log("[ElevenLabs] Message:", msg),
    onError: (err) => console.error("[ElevenLabs] Error:", err),
  });

  useEffect(() => {
    // Auto-start if a global agent id is provided
    const globalAgentId = (window as any)?.ELEVENLABS_AGENT_ID as string | undefined;
    if (globalAgentId && conversation.status !== "connected") {
      // Persist and try to connect silently
      setAgentId(globalAgentId);
      tryStart(globalAgentId, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestMicAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (e) {
      console.error("[ElevenLabs] Microphone permission denied:", e);
      return false;
    }
  };

  const tryStart = async (id: string, silent = false) => {
    if (!id) {
      if (!silent) alert("Please enter your ElevenLabs Agent ID");
      return;
    }

    const hasMic = await requestMicAccess();
    if (!hasMic) return;

    try {
      await conversation.startSession({ 
        agentId: id,
        connectionType: "webrtc"  // Required for public agents
      });
      if (typeof localStorage !== "undefined") localStorage.setItem("elevenlabs_agent_id", id);
      console.log("[ElevenLabs] Session started with agent:", id);
    } catch (err) {
      console.error("[ElevenLabs] Failed to start session:", err);
      if (!silent) alert("Failed to start ElevenLabs session. Check console for details.");
    }
  };

  const endSession = async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.error("[ElevenLabs] Failed to end session:", err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium">Voice Assistant</h2>
        <span className="text-xs text-muted-foreground">{conversation.status}</span>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="eleven-agent">ElevenLabs Agent ID</Label>
          <Input
            id="eleven-agent"
            placeholder="agent_..."
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => tryStart(agentId)} disabled={conversation.status === "connected"}>
            Start
          </Button>
          <Button size="sm" variant="outline" onClick={endSession} disabled={conversation.status !== "connected"}>
            End
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Tip: Say "Open WhatsApp reports" or "Go to dashboard". Tools are wired directly.
        </p>
      </div>
    </div>
  );
};

export default ElevenLabsAssistant;
