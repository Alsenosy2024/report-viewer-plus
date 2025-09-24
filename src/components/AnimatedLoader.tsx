import { cn } from '@/lib/utils';
import { Loader2, Sparkles, Zap } from 'lucide-react';

interface AnimatedLoaderProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'glow' | 'cyber';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
};

export function AnimatedLoader({ 
  variant = 'spinner',
  size = 'md',
  className,
  text
}: AnimatedLoaderProps) {
  
  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Loader2 
            className={cn(
              sizeClasses[size], 
              "animate-spin text-primary"
            )} 
          />
        );
        
      case 'dots':
        return (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-primary animate-bounce",
                  size === 'sm' && "w-1 h-1",
                  size === 'md' && "w-1.5 h-1.5",
                  size === 'lg' && "w-2 h-2",
                  size === 'xl' && "w-3 h-3"
                )}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );
        
      case 'pulse':
        return (
          <div className={cn(
            "rounded-full bg-primary animate-pulse",
            sizeClasses[size]
          )} />
        );
        
      case 'glow':
        return (
          <div className={cn(
            "relative",
            sizeClasses[size]
          )}>
            <Sparkles className={cn(
              "absolute inset-0 animate-pulse-glow text-primary",
              sizeClasses[size]
            )} />
          </div>
        );
        
      case 'cyber':
        return (
          <div className={cn(
            "relative flex items-center justify-center",
            sizeClasses[size]
          )}>
            <div className={cn(
              "absolute inset-0 rounded-full border-2 border-primary/30",
              "animate-spin"
            )} />
            <div className={cn(
              "absolute inset-2 rounded-full border-2 border-accent/40",
              "animate-spin",
              "[animation-direction:reverse]"
            )} />
            <Zap className="w-1/2 h-1/2 text-primary animate-pulse" />
          </div>
        );
        
      default:
        return (
          <Loader2 
            className={cn(
              sizeClasses[size], 
              "animate-spin text-primary"
            )} 
          />
        );
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3",
      className
    )}>
      {renderLoader()}
      {text && (
        <div className={cn(
          "text-muted-foreground animate-pulse loading-dots",
          textSizes[size]
        )}>
          {text}
        </div>
      )}
    </div>
  );
}

export function LoadingScreen({ 
  text = "Loading your experience" 
}: { 
  text?: string 
}) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-6 animate-fade-in">
        <AnimatedLoader 
          variant="cyber" 
          size="xl" 
        />
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-shimmer">
            {text}
          </h3>
          <p className="text-muted-foreground animate-pulse">
            Preparing something amazing...
          </p>
        </div>
      </div>
    </div>
  );
}