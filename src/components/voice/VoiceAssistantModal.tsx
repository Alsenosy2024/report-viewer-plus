import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LiveKitRoom, useRemoteParticipants } from "@livekit/components-react";
import { AgentNavigationListener } from "@/components/AgentNavigationListener";
import { useLiveKitToken } from "@/hooks/useLiveKitToken";
import { useVoiceAssistantContext } from "@/contexts/VoiceAssistantContext";
import { ConversationHistory } from "./ConversationHistory";
import { AlertCircle } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface VoiceAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VoiceAssistantContent = () => {
  const participants = useRemoteParticipants();
  const [waitingForAgent, setWaitingForAgent] = useState(true);

  useEffect(() => {
    if (participants.length > 0) {
      setWaitingForAgent(false);
    }
  }, [participants]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (participants.length === 0) {
        console.warn("[Voice Assistant] No agent joined after 10 seconds");
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [participants]);

  return (
    <>
      <AgentNavigationListener />
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-3">
            {waitingForAgent && participants.length === 0 ? (
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse" />
            )}
          </div>
          <h3 className="font-semibold text-lg">Voice Assistant</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {participants.length === 0 ? "Waiting for agent..." : "Listening..."}
          </p>
          {participants.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Make sure your LiveKit agent is running
            </p>
          )}
        </div>
        
        <div className="max-h-[200px] overflow-y-auto">
          <ConversationHistory />
        </div>
      </div>
    </>
  );
};

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { getToken, isLoading } = useLiveKitToken();
  const { setIsConnected } = useVoiceAssistantContext();
  const [connectionInfo, setConnectionInfo] = useState<{ token: string; url: string } | null>(null);

  useEffect(() => {
    if (open && !connectionInfo) {
      getToken().then((response) => {
        if (response) {
          setConnectionInfo({ token: response.token, url: response.url });
        }
      });
    }
  }, [open, connectionInfo, getToken]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-6">
        <VisuallyHidden>
          <DialogTitle>Voice Assistant</DialogTitle>
          <DialogDescription>
            Speak to interact with your AI voice assistant
          </DialogDescription>
        </VisuallyHidden>
        
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Connecting to voice assistant...
          </div>
        ) : connectionInfo ? (
          <LiveKitRoom
            token={connectionInfo.token}
            serverUrl={connectionInfo.url}
            connect={open}
            onConnected={() => setIsConnected(true)}
            onDisconnected={() => setIsConnected(false)}
          >
            <VoiceAssistantContent />
          </LiveKitRoom>
        ) : (
          <div className="text-center text-destructive py-8">
            Failed to connect to voice assistant
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
