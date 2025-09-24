import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, Zap, Palette, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FloatingAction {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions?: FloatingAction[];
  className?: string;
}

const defaultActions: FloatingAction[] = [
  {
    icon: Sparkles,
    label: 'AI Magic',
    onClick: () => console.log('AI Magic'),
    color: 'hsl(280 100% 70%)'
  },
  {
    icon: Plus,
    label: 'Quick Add',
    onClick: () => console.log('Quick Add'),
    color: 'hsl(140 100% 60%)'
  },
  {
    icon: Zap,
    label: 'Boost',
    onClick: () => console.log('Boost'),
    color: 'hsl(60 100% 60%)'
  },
  {
    icon: HelpCircle,
    label: 'Help',
    onClick: () => console.log('Help'),
    color: 'hsl(220 100% 70%)'
  }
];

export function FloatingActionButton({ 
  actions = defaultActions,
  className 
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className={cn(
        "fixed bottom-8 right-8 z-50 flex flex-col-reverse items-end gap-3",
        className
      )}>
        {/* Sub Actions */}
        {isOpen && actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="glass"
                  className={cn(
                    "w-12 h-12 rounded-full shadow-xl animate-scale-in glass-intense",
                    "hover:scale-110 transition-all duration-300",
                    "border-2 border-primary/30 hover:border-primary/60"
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    boxShadow: action.color 
                      ? `0 0 20px ${action.color}40, 0 0 40px ${action.color}20`
                      : undefined
                  }}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                >
                  <Icon 
                    className="w-5 h-5" 
                    style={{ color: action.color }}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="glass-intense border-primary/20">
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Main FAB */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="default"
              className={cn(
                "w-16 h-16 rounded-full shadow-glow hover:shadow-xl",
                "transform transition-all duration-300 hover:scale-110",
                "pulse-glow bg-gradient-primary animate-float",
                isOpen && "rotate-45"
              )}
              onClick={() => setIsOpen(!isOpen)}
            >
              <Plus className="w-6 h-6 transition-transform duration-300" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="glass-intense border-primary/20">
            <p>{isOpen ? 'Close Menu' : 'Quick Actions'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}