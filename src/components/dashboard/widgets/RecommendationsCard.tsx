import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, Zap, Clock, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { Recommendation } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface RecommendationsCardProps {
  recommendations: Recommendation[];
}

const categoryConfig = {
  immediate: {
    icon: Zap,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    label: 'فوري',
    glow: 'shadow-rose-500/20',
  },
  short_term: {
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    label: 'قريب المدى',
    glow: 'shadow-amber-500/20',
  },
  long_term: {
    icon: Calendar,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    label: 'بعيد المدى',
    glow: 'shadow-cyan-500/20',
  },
};

const priorityColors = [
  'bg-rose-500',    // Priority 1
  'bg-amber-500',   // Priority 2
  'bg-yellow-500',  // Priority 3
  'bg-cyan-500',    // Priority 4
  'bg-slate-500',   // Priority 5
];

export function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const sortedRecommendations = [...recommendations].sort((a, b) => a.priority - b.priority);

  const immediateCount = recommendations.filter(r => r.category === 'immediate').length;

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl h-full',
      'bg-gradient-to-br from-slate-900/90 via-slate-800/60 to-slate-900/90',
      'backdrop-blur-xl border border-white/[0.08]',
      'shadow-[0_0_60px_rgba(6,182,212,0.08)]'
    )}>
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      {/* Header */}
      <div
        className="relative flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.02] transition-colors border-b border-white/[0.05]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400">
            <Lightbulb className="w-5 h-5" />
            <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-[Tajawal] flex items-center gap-2">
              التوصيات الذكية
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-[Outfit]">
                {recommendations.length}
              </span>
            </h3>
            {immediateCount > 0 && (
              <p className="text-xs text-rose-400 font-[Tajawal]">
                {immediateCount} توصية تحتاج إجراء فوري
              </p>
            )}
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
        isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
          {sortedRecommendations.map((rec, index) => {
            const config = categoryConfig[rec.category];
            const CategoryIcon = config.icon;
            const isItemExpanded = expandedItems.has(rec.id);

            return (
              <div
                key={rec.id}
                className={cn(
                  'group p-4 rounded-xl border transition-all duration-300',
                  'bg-slate-800/30 hover:bg-slate-800/50',
                  config.border,
                  'hover:shadow-lg cursor-pointer'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={(e) => toggleItem(rec.id, e)}
              >
                <div className="flex items-start gap-3">
                  {/* Priority Badge */}
                  <div className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-[Outfit] text-white',
                    priorityColors[rec.priority - 1] || priorityColors[4]
                  )}>
                    {rec.priority}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title and Category */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <CategoryIcon className={cn('w-4 h-4', config.color)} />
                      <h4 className="font-semibold text-white font-[Tajawal] text-sm">
                        {rec.title}
                      </h4>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full',
                        config.bg,
                        config.color
                      )}>
                        {config.label}
                      </span>
                    </div>

                    {/* Description */}
                    <p className={cn(
                      'text-xs text-slate-400 font-[Tajawal] leading-relaxed',
                      !isItemExpanded && 'line-clamp-2'
                    )}>
                      {rec.description}
                    </p>

                    {/* Expanded Content */}
                    {isItemExpanded && (
                      <div className="mt-3 space-y-2">
                        {/* Expected Impact */}
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-xs font-[Tajawal]">
                            <span className="text-emerald-400 flex items-center gap-1 mb-1">
                              <TrendingUp className="w-3 h-3" />
                              التأثير المتوقع
                            </span>
                            <span className="text-slate-300">{rec.expectedImpact}</span>
                          </p>
                        </div>

                        {/* Related Metrics */}
                        <div className="flex flex-wrap gap-1">
                          {rec.relatedMetrics.map((metric, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-white/[0.05] font-[Tajawal]"
                            >
                              {metric}
                            </span>
                          ))}
                        </div>

                        {/* Confidence */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-[Tajawal]">
                            مستوى الثقة:
                          </span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                              style={{ width: `${rec.confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-cyan-400 font-[Outfit]">
                            {rec.confidence}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expand/Collapse Button */}
                  <button className="p-1 hover:bg-white/5 rounded transition-colors flex-shrink-0">
                    {isItemExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {recommendations.length === 0 && (
            <div className="text-center py-8">
              <Lightbulb className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-[Tajawal]">لا توجد توصيات حالياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
