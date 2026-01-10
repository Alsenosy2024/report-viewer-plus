import React from 'react';
import { Filter, TrendingDown, ArrowLeft } from 'lucide-react';
import { FunnelData } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface CrossChannelFunnelProps {
  data: FunnelData;
}

const stageColors = [
  { bg: 'bg-cyan-500', gradient: 'from-cyan-500 to-cyan-600' },
  { bg: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600' },
  { bg: 'bg-indigo-500', gradient: 'from-indigo-500 to-indigo-600' },
  { bg: 'bg-violet-500', gradient: 'from-violet-500 to-violet-600' },
  { bg: 'bg-purple-500', gradient: 'from-purple-500 to-purple-600' },
];

export function CrossChannelFunnel({ data }: CrossChannelFunnelProps) {
  const maxValue = Math.max(...data.stages.map(s => s.value));

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl',
      'bg-gradient-to-br from-slate-900/90 via-slate-800/60 to-slate-900/90',
      'backdrop-blur-xl border border-white/[0.08]',
      'shadow-[0_0_60px_rgba(6,182,212,0.08)]'
    )}>
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <div className="relative p-5 border-b border-white/[0.05]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-[Tajawal]">
                قمع التحويل عبر القنوات
              </h3>
              <p className="text-xs text-slate-500 font-[Tajawal]">
                معدل التحويل الإجمالي: <span className="text-cyan-400 font-[Outfit]">{data.conversionRate}%</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="relative p-5">
        <div className="space-y-3">
          {data.stages.map((stage, index) => {
            const widthPercent = (stage.value / maxValue) * 100;
            const color = stageColors[index % stageColors.length];
            const isLast = index === data.stages.length - 1;

            return (
              <div key={index} className="relative">
                {/* Stage Bar */}
                <div className="relative">
                  <div
                    className={cn(
                      'relative h-14 rounded-xl overflow-hidden transition-all duration-700 ease-out',
                      'bg-gradient-to-l',
                      color.gradient,
                      'hover:shadow-lg hover:scale-[1.01]'
                    )}
                    style={{
                      width: `${widthPercent}%`,
                      animationDelay: `${index * 150}ms`
                    }}
                  >
                    {/* Inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 flex items-center justify-between px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm font-[Tajawal]">
                          {stage.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white/90 font-bold text-lg font-[Outfit]">
                          {stage.value.toLocaleString('ar-EG')}
                        </span>
                        <span className="text-white/70 text-xs font-[Outfit] bg-black/20 px-2 py-0.5 rounded-full">
                          {stage.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Drop-off indicator */}
                  {!isLast && stage.dropoff !== undefined && stage.dropoff > 0 && (
                    <div className="absolute -bottom-2 right-0 flex items-center gap-1 text-xs">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <TrendingDown className="w-3 h-3" />
                        <span className="font-[Outfit]">-{stage.dropoff}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Connector Arrow */}
                {!isLast && (
                  <div className="flex justify-center py-1">
                    <ArrowLeft className="w-4 h-4 text-slate-600 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-white/[0.05] text-center">
            <p className="text-2xl font-bold text-white font-[Outfit]">
              {data.stages[0]?.value.toLocaleString('ar-EG') || 0}
            </p>
            <p className="text-xs text-slate-500 font-[Tajawal]">البداية</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-white/[0.05] text-center">
            <p className="text-2xl font-bold text-cyan-400 font-[Outfit]">
              {data.conversionRate}%
            </p>
            <p className="text-xs text-slate-500 font-[Tajawal]">التحويل</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-white/[0.05] text-center">
            <p className="text-2xl font-bold text-emerald-400 font-[Outfit]">
              {data.stages[data.stages.length - 1]?.value.toLocaleString('ar-EG') || 0}
            </p>
            <p className="text-xs text-slate-500 font-[Tajawal]">النهاية</p>
          </div>
        </div>
      </div>
    </div>
  );
}
