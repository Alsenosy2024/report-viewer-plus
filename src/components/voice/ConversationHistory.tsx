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
      <div className="flex items-center justify-center h-full">
        <p className="text-center text-[8px] text-muted-foreground px-1">
          {language === 'ar'
            ? 'ابدأ المحادثة...'
            : 'Start speaking...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transcript.map((message, index) => (
        <div
          key={index}
          className={cn(
            'flex gap-1 items-start',
            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          {/* Avatar */}
          <div
            className={cn(
              'flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center',
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            {message.role === 'user' ? (
              <User className="w-2 h-2" />
            ) : (
              <Bot className="w-2 h-2" />
            )}
          </div>

          {/* Message Bubble */}
          <div
            className={cn(
              'flex-1',
              message.role === 'user' ? 'text-right' : 'text-left'
            )}
          >
            <div
              className={cn(
                'inline-block px-1.5 py-0.5 rounded-lg text-[9px]',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              )}
            >
              <p className="whitespace-pre-wrap leading-tight">{message.content}</p>
            </div>
            <p className="text-[7px] text-muted-foreground mt-0.5 px-0.5">
              {format(new Date(message.timestamp), 'HH:mm:ss')}
            </p>
          </div>
        </div>
      ))}
      <div ref={scrollRef} />
    </div>
  );
};
