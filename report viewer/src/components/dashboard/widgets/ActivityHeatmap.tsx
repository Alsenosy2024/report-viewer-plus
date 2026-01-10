import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { HeatmapData } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface ActivityHeatmapProps {
  data: HeatmapData;
}

const dayLabels = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const maxIntensity = Math.max(...data.data.map(d => d.intensity), 1);
  const isWeekly = data.type === 'weekly';

  // Get intensity color based on value
  const getIntensityColor = (intensity: number) => {
    const normalized = intensity / maxIntensity;
    if (normalized === 0) return 'bg-slate-800/50';
    if (normalized < 0.25) return 'bg-cyan-900/50';
    if (normalized < 0.5) return 'bg-cyan-700/60';
    if (normalized < 0.75) return 'bg-cyan-500/70';
    return 'bg-cyan-400/80';
  };

  const getIntensityGlow = (intensity: number) => {
    const normalized = intensity / maxIntensity;
    if (normalized < 0.5) return '';
    if (normalized < 0.75) return 'shadow-[0_0_10px_rgba(6,182,212,0.3)]';
    return 'shadow-[0_0_15px_rgba(6,182,212,0.5)]';
  };

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl',
      'bg-gradient-to-br from-slate-900/90 via-slate-800/60 to-slate-900/90',
      'backdrop-blur-xl border border-white/[0.08]',
      'shadow-[0_0_60px_rgba(6,182,212,0.08)]'
    )}>
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      {/* Header */}
      <div className="relative p-5 border-b border-white/[0.05]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400">
              {isWeekly ? <Calendar className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-[Tajawal]">
                {data.title}
              </h3>
              <p className="text-xs text-slate-500 font-[Tajawal]">
                {isWeekly ? 'النشاط الأسبوعي' : 'النشاط بالساعة'}
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-[Tajawal]">أقل</span>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-slate-800/50" />
              <div className="w-3 h-3 rounded-sm bg-cyan-900/50" />
              <div className="w-3 h-3 rounded-sm bg-cyan-700/60" />
              <div className="w-3 h-3 rounded-sm bg-cyan-500/70" />
              <div className="w-3 h-3 rounded-sm bg-cyan-400/80" />
            </div>
            <span className="text-[10px] text-slate-500 font-[Tajawal]">أكثر</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="relative p-5">
        {isWeekly ? (
          // Weekly view - horizontal bars for each day
          <div className="space-y-2">
            {dayLabels.map((day, dayIndex) => {
              const dayData = data.data.find(d => d.label === day);
              const intensity = dayData?.intensity || 0;
              const value = dayData?.value || 0;
              const widthPercent = (intensity / maxIntensity) * 100;

              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-16 text-xs text-slate-400 font-[Tajawal] text-left">
                    {day}
                  </span>
                  <div className="flex-1 h-8 rounded-lg bg-slate-800/30 overflow-hidden relative">
                    <div
                      className={cn(
                        'h-full rounded-lg transition-all duration-700 ease-out',
                        getIntensityColor(intensity),
                        getIntensityGlow(intensity)
                      )}
                      style={{
                        width: `${widthPercent}%`,
                        animationDelay: `${dayIndex * 100}ms`
                      }}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                    </div>
                    {value > 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white/80 font-[Outfit]">
                        {value.toLocaleString('ar-EG')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Hourly view - grid of cells
          <div className="overflow-x-auto">
            <div className="grid grid-cols-12 gap-1 min-w-[400px]">
              {data.data.slice(0, 24).map((cell, index) => (
                <div
                  key={index}
                  className={cn(
                    'group relative aspect-square rounded-md transition-all duration-300',
                    'hover:scale-110 hover:z-10 cursor-pointer',
                    getIntensityColor(cell.intensity),
                    getIntensityGlow(cell.intensity)
                  )}
                  title={`${cell.label}: ${cell.value}`}
                >
                  {/* Tooltip on hover */}
                  <div className={cn(
                    'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg',
                    'bg-slate-900 border border-white/10 shadow-lg',
                    'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                    'pointer-events-none whitespace-nowrap z-20'
                  )}>
                    <p className="text-[10px] text-white font-[Tajawal]">
                      {cell.label}
                    </p>
                    <p className="text-xs font-bold text-cyan-400 font-[Outfit]">
                      {cell.value.toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Hour labels */}
            <div className="grid grid-cols-12 gap-1 mt-2 min-w-[400px]">
              {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map((hour) => (
                <div key={hour} className="text-center">
                  <span className="text-[10px] text-slate-500 font-[Outfit]">
                    {hour}:00
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t border-white/[0.05] grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-white font-[Outfit]">
              {Math.max(...data.data.map(d => d.value)).toLocaleString('ar-EG')}
            </p>
            <p className="text-[10px] text-slate-500 font-[Tajawal]">أعلى نشاط</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-cyan-400 font-[Outfit]">
              {Math.round(data.data.reduce((a, b) => a + b.value, 0) / data.data.length).toLocaleString('ar-EG')}
            </p>
            <p className="text-[10px] text-slate-500 font-[Tajawal]">المتوسط</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white font-[Outfit]">
              {data.data.reduce((a, b) => a + b.value, 0).toLocaleString('ar-EG')}
            </p>
            <p className="text-[10px] text-slate-500 font-[Tajawal]">الإجمالي</p>
          </div>
        </div>
      </div>
    </div>
  );
}
