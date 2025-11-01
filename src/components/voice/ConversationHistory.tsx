import React, { useEffect, useRef } from 'react';
import { useVoiceAssistantContext } from '@/contexts/VoiceAssistantContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { format } from 'date-fns';

export const ConversationHistory: React.FC = () => {
  const { transcript, language } = useVoiceAssistantContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  if (transcript.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-center text-muted-foreground">
          {language === 'ar'
            ? 'ابدأ المحادثة بالتحدث إلى المساعد'
            : 'Start the conversation by speaking to the assistant'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {transcript.map((message, index) => (
          <div
            key={index}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              )}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={cn(
                'flex-1 max-w-[80%]',
                message.role === 'user' ? 'text-right' : 'text-left'
              )}
            >
              <div
                className={cn(
                  'inline-block px-4 py-2 rounded-lg',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(message.timestamp), 'HH:mm:ss')}
              </p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
};
