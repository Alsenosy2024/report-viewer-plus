import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Sparkles, Target, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import { ExecutiveOverview as ExecutiveOverviewType } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface ExecutiveOverviewProps {
  data: ExecutiveOverviewType;
}

const categoryConfig = {
  growth: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  risk: { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  efficiency: { icon: Target, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  opportunity: { icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
};

const impactConfig = {
  high: 'bg-rose-500',
  medium: 'bg-amber-500',
  low: 'bg-slate-500',
};

export function ExecutiveOverview({ data }: ExecutiveOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const sentimentConfig = {
    positive: { color: 'text-emerald-400', label: 'إيجابي' },
    neutral: { color: 'text-slate-400', label: 'محايد' },
    negative: { color: 'text-rose-400', label: 'سلبي' },
  };

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl',
      'bg-gradient-to-br from-slate-900/90 via-slate-800/60 to-slate-900/90',
      'backdrop-blur-xl border border-white/[0.08]',
      'shadow-[0_0_60px_rgba(6,182,212,0.08)]'
    )}>
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <div
        className="relative flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400">
              <Brain className="w-5 h-5" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-[Tajawal] flex items-center gap-2">
              الملخص التنفيذي
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                sentimentConfig[data.overallSentiment].color,
                'bg-current/10'
              )}>
                {sentimentConfig[data.overallSentiment].label}
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-[Tajawal]">
              مستوى الثقة: {data.confidenceScore}%
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className={cn(
        'relative overflow-hidden transition-all duration-500 ease-out',
        isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="px-5 pb-5 space-y-5">
          {/* Summary */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-white/[0.05]">
            <p className="text-sm text-slate-300 leading-relaxed font-[Tajawal] whitespace-pre-wrap">
              {data.summary}
            </p>
          </div>

          {/* Strategic Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-400 font-[Tajawal] flex items-center gap-2">
              <Target className="w-4 h-4" />
              الإجراءات الاستراتيجية
            </h4>
            <div className="space-y-2">
              {data.strategicActions.map((action, index) => {
                const config = categoryConfig[action.category];
                const CategoryIcon = config.icon;

                return (
                  <div
                    key={index}
                    className={cn(
                      'group p-4 rounded-xl border transition-all duration-300',
                      'bg-slate-800/30 hover:bg-slate-800/50',
                      config.border,
                      'hover:shadow-lg'
                    )}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Priority indicator */}
                      <div className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-[Outfit]',
                        action.priority === 1 ? 'bg-rose-500/20 text-rose-400' :
                        action.priority === 2 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-500/20 text-slate-400'
                      )}>
                        {action.priority}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CategoryIcon className={cn('w-4 h-4', config.color)} />
                          <h5 className="font-semibold text-white font-[Tajawal] text-sm">
                            {action.title}
                          </h5>
                        </div>
                        <p className="text-xs text-slate-400 font-[Tajawal] leading-relaxed">
                          {action.description}
                        </p>
                      </div>

                      {/* Impact badge */}
                      <div className="flex-shrink-0">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          impactConfig[action.impact]
                        )} title={`تأثير ${action.impact === 'high' ? 'عالي' : action.impact === 'medium' ? 'متوسط' : 'منخفض'}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
