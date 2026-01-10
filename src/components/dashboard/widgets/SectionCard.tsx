import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  summary?: string;
  children: React.ReactNode;
  accentColor?: 'accent' | 'success' | 'warning' | 'error' | 'info';
  defaultExpanded?: boolean;
  className?: string;
}

const accentColors = {
  accent: {
    gradient: 'from-accent/20 to-primary/20',
    border: 'border-accent/20 hover:border-accent/40',
    icon: 'text-accent',
    badge: 'bg-accent/10 text-accent',
  },
  success: {
    gradient: 'from-success/20 to-success/10',
    border: 'border-success/20 hover:border-success/40',
    icon: 'text-success',
    badge: 'bg-success/10 text-success',
  },
  warning: {
    gradient: 'from-warning/20 to-warning/10',
    border: 'border-warning/20 hover:border-warning/40',
    icon: 'text-warning',
    badge: 'bg-warning/10 text-warning',
  },
  error: {
    gradient: 'from-error/20 to-error/10',
    border: 'border-error/20 hover:border-error/40',
    icon: 'text-error',
    badge: 'bg-error/10 text-error',
  },
  info: {
    gradient: 'from-info/20 to-primary/20',
    border: 'border-info/20 hover:border-info/40',
    icon: 'text-info',
    badge: 'bg-info/10 text-info',
  },
};

export function SectionCard({
  title,
  icon,
  summary,
  children,
  accentColor = 'accent',
  defaultExpanded = true,
  className,
}: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const colors = accentColors[accentColor];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl transition-all duration-500 h-full',
        'bg-card border',
        'hover:shadow-lg',
        colors.border,
        className
      )}
    >
      {/* Gradient decoration */}
      <div className={cn(
        'absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl rounded-full blur-3xl opacity-30',
        colors.gradient
      )} />

      {/* Header */}
      <div
        className="relative flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-xl bg-gradient-to-br',
            colors.gradient,
            colors.icon
          )}>
            {icon}
          </div>
          <h3 className="text-base font-bold text-foreground font-[Tajawal]">{title}</h3>
        </div>
        <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Summary (always visible) */}
      {summary && (
        <div className="relative px-4 pb-3">
          <p className="text-xs text-muted-foreground font-[Tajawal] leading-relaxed line-clamp-2">
            {summary}
          </p>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'relative overflow-hidden transition-all duration-500 ease-out',
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-4 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
