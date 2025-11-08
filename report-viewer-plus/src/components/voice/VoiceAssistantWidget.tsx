import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceAssistantContext } from '@/contexts/VoiceAssistantContext';
import { VoiceAssistantModal } from './VoiceAssistantModal';
import { cn } from '@/lib/utils';

export const VoiceAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected, isListening } = useVoiceAssistantContext();

  return (
    <>
      {/* Floating Button */}
      <Button
        size="lg"
        className={cn(
          'fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-glow z-50',
          'transition-all duration-300',
          isConnected && 'ring-2 ring-primary ring-offset-2',
          isListening && 'animate-pulse-glow'
        )}
        onClick={() => setIsOpen(true)}
        aria-label="Open Voice Assistant"
      >
        {isListening ? (
          <MicOff className="w-7 h-7 animate-pulse" />
        ) : (
          <Mic className="w-7 h-7" />
        )}
      </Button>

      {/* Modal */}
      <VoiceAssistantModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
