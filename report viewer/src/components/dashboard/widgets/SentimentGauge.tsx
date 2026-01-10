import React from 'react';
import { Smile, Meh, Frown, TrendingUp, TrendingDown, Minus, MessageCircle } from 'lucide-react';
import { SentimentData } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface SentimentGaugeProps {
  data: SentimentData;
}

const overallConfig = {
  positive: {
    icon: Smile,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500',
    label: 'إيجابي',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-500',
  },
  neutral: {
    icon: Meh,
    color: 'text-slate-400',
    bg: 'bg-slate-500',
    label: 'محايد',
    gradientFrom: 'from-slate-500',
    gradientTo: 'to-slate-600',
  },
  negative: {
    icon: Frown,
    color: 'text-rose-400',
    bg: 'bg-rose-500',
    label: 'سلبي',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-500',
  },
};

const trendConfig = {
  improving: { icon: TrendingUp, color: 'text-emerald-400', label: 'يتحسن' },
  declining: { icon: TrendingDown, color: 'text-rose-400', label: 'يتراجع' },
  stable: { icon: Minus, color: 'text-slate-400', label: 'مستقر' },
};

export function SentimentGauge({ data }: SentimentGaugeProps) {
  const config = overallConfig[data.overall];
  const SentimentIcon = config.icon;
  const TrendIcon = trendConfig[data.trend].icon;

  // Calculate gauge rotation (0-180 degrees, where 90 is neutral)
  const gaugeRotation = (data.score / 100) * 180;

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl',
      'bg-gradient-to-br from-slate-900/90 via-slate-800/60 to-slate-900/90',
      'backdrop-blur-xl border border-white/[0.08]',
      'shadow-[0_0_60px_rgba(6,182,212,0.08)]'
    )}>
      {/* Decorative gradient */}
      <div className={cn(
        'absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-20',
        config.bg
      )} />

      {/* Header */}
      <div className="relative p-5 border-b border-white/[0.05]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2.5 rounded-xl bg-gradient-to-br',
              config.gradientFrom,
              config.gradientTo,
              'bg-opacity-20'
            )}>
              <MessageCircle className={cn('w-5 h-5', config.color)} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-[Tajawal]">
                مقياس المشاعر
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-[Tajawal]">الاتجاه:</span>
                <span className={cn('flex items-center gap-1', trendConfig[data.trend].color)}>
                  <TrendIcon className="w-3 h-3" />
                  {trendConfig[data.trend].label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gauge Visualization */}
      <div className="relative px-5 pt-6 pb-4">
        {/* Semicircular Gauge */}
        <div className="relative w-48 h-24 mx-auto">
          {/* Background Arc */}
          <svg className="w-full h-full" viewBox="0 0 200 100">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            {/* Background track */}
            <path
              d="M 10 95 A 90 90 0 0 1 190 95"
              fill="none"
              stroke="rgba(100, 116, 139, 0.2)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Colored progress */}
            <path
              d="M 10 95 A 90 90 0 0 1 190 95"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * data.score) / 100}
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Needle */}
          <div
            className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-1000 ease-out"
            style={{ transform: `translateX(-50%) rotate(${gaugeRotation - 90}deg)` }}
          >
            <div className="w-1 h-16 bg-gradient-to-t from-white to-transparent rounded-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg" />
          </div>

          {/* Center Score */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
            <div className={cn('flex items-center justify-center gap-1', config.color)}>
              <SentimentIcon className="w-5 h-5" />
              <span className="text-2xl font-bold font-[Outfit]">{data.score}</span>
            </div>
            <p className={cn('text-xs font-[Tajawal]', config.color)}>{config.label}</p>
          </div>

          {/* Min/Max labels */}
          <span className="absolute bottom-0 left-0 text-xs text-rose-400 font-[Outfit]">0</span>
          <span className="absolute bottom-0 right-0 text-xs text-emerald-400 font-[Outfit]">100</span>
        </div>

        {/* Breakdown Bars */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3">
            <Smile className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400 font-[Tajawal]">إيجابي</span>
                <span className="text-xs font-bold text-emerald-400 font-[Outfit]">{data.breakdown.positive}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-out"
                  style={{ width: `${data.breakdown.positive}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Meh className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400 font-[Tajawal]">محايد</span>
                <span className="text-xs font-bold text-slate-400 font-[Outfit]">{data.breakdown.neutral}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-500 transition-all duration-1000 ease-out"
                  style={{ width: `${data.breakdown.neutral}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Frown className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400 font-[Tajawal]">سلبي</span>
                <span className="text-xs font-bold text-rose-400 font-[Outfit]">{data.breakdown.negative}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-500 transition-all duration-1000 ease-out"
                  style={{ width: `${data.breakdown.negative}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Topics */}
        <div className="mt-4 pt-4 border-t border-white/[0.05] grid grid-cols-2 gap-4">
          {/* Positive Topics */}
          <div>
            <p className="text-xs text-emerald-400 font-[Tajawal] mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              المواضيع الإيجابية
            </p>
            <div className="flex flex-wrap gap-1">
              {data.topPositiveTopics.slice(0, 3).map((topic, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-[Tajawal]"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Negative Topics */}
          <div>
            <p className="text-xs text-rose-400 font-[Tajawal] mb-2 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              المواضيع السلبية
            </p>
            <div className="flex flex-wrap gap-1">
              {data.topNegativeTopics.slice(0, 3).map((topic, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-[Tajawal]"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
