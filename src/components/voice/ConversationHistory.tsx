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
        <p className="text-center text-xs text-muted-foreground px-4">
          {language === 'ar'
            ? 'ابدأ المحادثة...'
            : 'Start speaking...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transcript.map((message, index) => (
        <div
          key={index}
          className={cn(
            'flex gap-2 items-start',
            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          {/* Avatar */}
          <div
            className={cn(
              'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            {message.role === 'user' ? (
              <User className="w-3 h-3" />
            ) : (
              <Bot className="w-3 h-3" />
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
                'inline-block px-2.5 py-1.5 rounded-lg text-xs',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
              {format(new Date(message.timestamp), 'HH:mm:ss')}
            </p>
          </div>
        </div>
      ))}
      <div ref={scrollRef} />
    </div>
  );
};
