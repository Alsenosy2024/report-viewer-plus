import { useEffect, useRef } from 'react';

interface ElevenLabsAgentProps {
  agentId?: string;
  className?: string;
}

const ElevenLabsAgent = ({ 
  agentId = "agent_2401k5v85f8beantem3febzmgj81", 
  className = "" 
}: ElevenLabsAgentProps) => {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!widgetRef.current) return;

    // Create the elevenlabs-convai element
    const widget = document.createElement('elevenlabs-convai');
    widget.setAttribute('agent-id', agentId);
    
    // Clear any existing content and append the widget
    widgetRef.current.innerHTML = '';
    widgetRef.current.appendChild(widget);

    return () => {
      // Cleanup when component unmounts
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
    };
  }, [agentId]);

  return (
    <div 
      ref={widgetRef} 
      className={`elevenlabs-widget-container ${className}`}
    />
  );
};

export default ElevenLabsAgent;