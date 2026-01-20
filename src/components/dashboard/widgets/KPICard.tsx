import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { KPIMetric } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  icon: React.ReactNode;
  metric: KPIMetric;
  className?: string;
}

export function KPICard({ title, icon, metric, className }: KPICardProps) {
  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
    down: { icon: TrendingDown, color: 'text-error', bg: 'bg-error/10' },
    stable: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted' },
  };

  const statusConfig = {
    good: 'from-success/20 to-transparent',
    warning: 'from-warning/20 to-transparent',
    critical: 'from-error/20 to-transparent',
  };

  const TrendIcon = trendConfig[metric.trend].icon;
  const sparklineData = metric.sparkline?.map((value, index) => ({ value, index })) || [];

  const formatValue = (value: number | string | undefined) => {
    if (value === undefined || value === null) return '—';
    if (typeof value === 'number') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toLocaleString('ar-EG');
    }
    return value;
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl h-full',
        'bg-card border border-border',
        'hover:border-accent/30 transition-all duration-500',
        'hover:shadow-lg',
        className
      )}
    >
      {/* Status indicator gradient */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-b opacity-50',
        statusConfig[metric.status]
      )} />

      {/* Glow effect on hover */}
      <div className="absolute -inset-px bg-gradient-to-r from-accent/0 via-accent/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

      <div className="relative p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
              {icon}
            </div>
            <span className="text-sm font-medium text-muted-foreground font-[Tajawal]">{title}</span>
          </div>
        </div>

        {/* Value */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-foreground font-[Outfit] tracking-tight">
              {formatValue(metric.value)}
            </span>
            {metric.unit && (
              <span className="text-lg text-muted-foreground font-[Tajawal]">{metric.unit}</span>
            )}
          </div>
        </div>

        {/* Trend */}
        <div className="flex items-center gap-2 mb-4">
          <div className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
            trendConfig[metric.trend].bg,
            trendConfig[metric.trend].color
          )}>
            <TrendIcon className="w-3 h-3" />
            {metric.changePercent !== undefined && (
              <span className="font-[Outfit]">
                {metric.changePercent > 0 ? '+' : ''}{metric.changePercent}%
              </span>
            )}
          </div>
          {metric.changeLabel && (
            <span className="text-xs text-muted-foreground font-[Tajawal]">{metric.changeLabel}</span>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData.length > 0 && (
          <div className="mt-auto h-12 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`sparkGradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  fill={`url(#sparkGradient-${title})`}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
