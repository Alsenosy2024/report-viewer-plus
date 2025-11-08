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
      <DialogContent className="sm:max-w-[400px] p-6">
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
            <AgentNavigationListener />
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse" />
                </div>
                <h3 className="font-semibold text-lg">Voice Assistant</h3>
                <p className="text-sm text-muted-foreground mt-1">Listening...</p>
              </div>
              
              <div className="max-h-[200px] overflow-y-auto">
                <ConversationHistory />
              </div>
            </div>
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
