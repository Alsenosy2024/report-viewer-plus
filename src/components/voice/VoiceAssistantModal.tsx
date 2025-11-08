import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LiveKitRoom } from "@livekit/components-react";
import { AgentNavigationListener } from "@/components/AgentNavigationListener";
import { useLiveKitToken } from "@/hooks/useLiveKitToken";
import { useVoiceAssistantContext } from "@/contexts/VoiceAssistantContext";
import { VoiceAssistantAvatar } from "./VoiceAssistantAvatar";
import { ConversationHistory } from "./ConversationHistory";

interface VoiceAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
      <DialogContent className="sm:max-w-[600px]">
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">
              Connecting...
            </div>
          ) : connectionInfo ? (
            <LiveKitRoom
              token={connectionInfo.token}
              serverUrl={connectionInfo.url}
              connect={open}
              onConnected={() => setIsConnected(true)}
              onDisconnected={() => setIsConnected(false)}
            >
              <div className="flex flex-col gap-4">
                <VoiceAssistantAvatar />
                <AgentNavigationListener />
                <ConversationHistory />
              </div>
            </LiveKitRoom>
          ) : (
            <div className="text-center text-destructive">
              Failed to connect to voice assistant
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
