import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  summary?: string;
  children: React.ReactNode;
  accentColor?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'blue';
  defaultExpanded?: boolean;
  className?: string;
}

const accentColors = {
  cyan: {
    gradient: 'from-cyan-500/20 to-blue-500/20',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    glow: 'hover:shadow-[0_0_40px_rgba(6,182,212,0.12)]',
    icon: 'text-cyan-400',
    badge: 'bg-cyan-500/10 text-cyan-400',
  },
  emerald: {
    gradient: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    glow: 'hover:shadow-[0_0_40px_rgba(16,185,129,0.12)]',
    icon: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400',
  },
  amber: {
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    glow: 'hover:shadow-[0_0_40px_rgba(245,158,11,0.12)]',
    icon: 'text-amber-400',
    badge: 'bg-amber-500/10 text-amber-400',
  },
  rose: {
    gradient: 'from-rose-500/20 to-pink-500/20',
    border: 'border-rose-500/20 hover:border-rose-500/40',
    glow: 'hover:shadow-[0_0_40px_rgba(244,63,94,0.12)]',
    icon: 'text-rose-400',
    badge: 'bg-rose-500/10 text-rose-400',
  },
  blue: {
    gradient: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    glow: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.12)]',
    icon: 'text-blue-400',
    badge: 'bg-blue-500/10 text-blue-400',
  },
};

export function SectionCard({
  title,
  icon,
  summary,
  children,
  accentColor = 'cyan',
  defaultExpanded = true,
  className,
}: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const colors = accentColors[accentColor];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl transition-all duration-500 h-full',
        'bg-gradient-to-br from-slate-900/80 via-slate-800/50 to-slate-900/80',
        'backdrop-blur-xl border',
        colors.border,
        colors.glow,
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
        className="relative flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
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
          <h3 className="text-base font-bold text-white font-[Tajawal]">{title}</h3>
        </div>
        <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Summary (always visible) */}
      {summary && (
        <div className="relative px-4 pb-3">
          <p className="text-xs text-slate-400 font-[Tajawal] leading-relaxed line-clamp-2">
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
