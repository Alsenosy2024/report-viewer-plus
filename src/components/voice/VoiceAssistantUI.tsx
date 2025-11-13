import React, { useEffect, useState } from 'react';
import {
  useVoiceAssistant,
  BarVisualizer,
  VoiceAssistantControlBar,
  useTrackTranscription,
  useLocalParticipant,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  type: 'agent' | 'user';
  text: string;
  firstReceivedTime: number;
}

const Message: React.FC<{ type: 'agent' | 'user'; text: string }> = ({ type, text }) => {
  return (
    <div className={cn(
      'mb-3 p-3 rounded-lg',
      type === 'agent'
        ? 'bg-primary/10 text-primary'
        : 'bg-secondary/10 text-secondary-foreground'
    )}>
      <strong className="font-semibold">
        {type === 'agent' ? '🤖 Lamie: ' : '👤 You: '}
      </strong>
      <span>{text}</span>
    </div>
  );
};

export const VoiceAssistantUI: React.FC = () => {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const localParticipant = useLocalParticipant();
  const { segments: userTranscriptions } = useTrackTranscription({
    publication: localParticipant.microphoneTrack,
    source: Track.Source.Microphone,
    participant: localParticipant.localParticipant,
  });

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const allMessages: Message[] = [
      ...(agentTranscriptions?.map((t) => ({ ...t, type: 'agent' as const })) ?? []),
      ...(userTranscriptions?.map((t) => ({ ...t, type: 'user' as const })) ?? []),
    ].sort((a, b) => a.firstReceivedTime - b.firstReceivedTime);
    setMessages(allMessages);
  }, [agentTranscriptions, userTranscriptions]);

  return (
    <div className="flex flex-col space-y-4 w-full max-w-2xl">
      {/* Audio Visualizer */}
      <div className="w-full h-32 flex items-center justify-center bg-background/50 rounded-lg border border-primary/20">
        <BarVisualizer
          state={state}
          barCount={7}
          trackRef={audioTrack}
        />
      </div>

      {/* Status Indicator */}
      <div className="text-center">
        <p className="text-sm font-medium transition-colors text-muted-foreground">
          💬 Ready to help
        </p>
      </div>

      {/* Voice Assistant Controls */}
      <div className="flex justify-center">
        <VoiceAssistantControlBar />
      </div>

      {/* Transcription Display */}
      {messages.length > 0 && (
        <div className="w-full">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Conversation</h3>
          <ScrollArea className="h-64 w-full border rounded-lg p-3 bg-background/30">
            {messages.map((msg, idx) => (
              <Message key={idx} type={msg.type} text={msg.text} />
            ))}
          </ScrollArea>
        </div>
      )}

      {/* Helper Text */}
      <div className="text-center text-xs text-muted-foreground px-4">
        <p>Try: "افتح الداشبورد" or "Show me WhatsApp reports"</p>
      </div>
    </div>
  );
};
