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
    up: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    down: { icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    stable: { icon: Minus, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  };

  const statusConfig = {
    good: 'from-emerald-500/20 to-transparent',
    warning: 'from-amber-500/20 to-transparent',
    critical: 'from-rose-500/20 to-transparent',
  };

  const TrendIcon = trendConfig[metric.trend].icon;
  const sparklineData = metric.sparkline?.map((value, index) => ({ value, index })) || [];

  const formatValue = (value: number | string) => {
    if (typeof value === 'number') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toLocaleString('ar-EG');
    }
    return value;
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-slate-900/80 via-slate-800/50 to-slate-900/80',
        'backdrop-blur-xl border border-white/[0.08]',
        'hover:border-cyan-500/30 transition-all duration-500',
        'hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]',
        className
      )}
    >
      {/* Status indicator gradient */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-b opacity-50',
        statusConfig[metric.status]
      )} />

      {/* Glow effect on hover */}
      <div className="absolute -inset-px bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

      <div className="relative p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
              {icon}
            </div>
            <span className="text-sm font-medium text-slate-300 font-[Tajawal]">{title}</span>
          </div>
        </div>

        {/* Value */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-white font-[Outfit] tracking-tight">
              {formatValue(metric.value)}
            </span>
            {metric.unit && (
              <span className="text-lg text-slate-400 font-[Tajawal]">{metric.unit}</span>
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
            <span className="text-xs text-slate-500 font-[Tajawal]">{metric.changeLabel}</span>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData.length > 0 && (
          <div className="mt-auto h-12 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`sparkGradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#06b6d4"
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
