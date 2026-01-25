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
    color: 'text-error',
    bg: 'bg-error/10',
    border: 'border-error/30',
    label: 'فوري',
  },
  short_term: {
    icon: Clock,
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    label: 'قريب المدى',
  },
  long_term: {
    icon: Calendar,
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    label: 'بعيد المدى',
  },
};

const priorityColors = [
  'bg-error',      // Priority 1
  'bg-warning',    // Priority 2
  'bg-warning/80', // Priority 3
  'bg-accent',     // Priority 4
  'bg-muted-foreground', // Priority 5
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
      'bg-card border border-border',
      'hover:shadow-lg transition-shadow'
    )}>
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-warning/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      {/* Header */}
      <div
        className="relative flex items-center justify-between p-5 cursor-pointer hover:bg-muted/30 transition-colors border-b border-border"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-warning/20 to-accent/20 text-warning">
            <Lightbulb className="w-5 h-5" />
            <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-warning animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground font-[Tajawal] flex items-center gap-2">
              التوصيات الذكية
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-[Outfit]">
                {recommendations.length}
              </span>
            </h3>
            {immediateCount > 0 && (
              <p className="text-xs text-error font-[Tajawal]">
                {immediateCount} توصية تحتاج إجراء فوري
              </p>
            )}
          </div>
        </div>
        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className={cn(
        'relative overflow-hidden transition-all duration-500 ease-out',
        isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
          {sortedRecommendations.map((rec, index) => {
            const config = categoryConfig[rec.category] || categoryConfig.long_term;
            const CategoryIcon = config.icon;
            const isItemExpanded = expandedItems.has(rec.id);

            return (
              <div
                key={rec.id}
                className={cn(
                  'group p-4 rounded-xl border transition-all duration-300',
                  'bg-card hover:bg-muted/50',
                  config.border,
                  'hover:shadow-md cursor-pointer'
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
                      <h4 className="font-semibold text-foreground font-[Tajawal] text-sm">
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
                      'text-xs text-muted-foreground font-[Tajawal] leading-relaxed',
                      !isItemExpanded && 'line-clamp-2'
                    )}>
                      {rec.description}
                    </p>

                    {/* Expanded Content */}
                    {isItemExpanded && (
                      <div className="mt-3 space-y-2">
                        {/* Expected Impact */}
                        <div className="p-2 rounded-lg bg-success/10 border border-success/20">
                          <p className="text-xs font-[Tajawal]">
                            <span className="text-success flex items-center gap-1 mb-1">
                              <TrendingUp className="w-3 h-3" />
                              التأثير المتوقع
                            </span>
                            <span className="text-foreground">{rec.expectedImpact}</span>
                          </p>
                        </div>

                        {/* Related Metrics */}
                        <div className="flex flex-wrap gap-1">
                          {rec.relatedMetrics.map((metric, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-[Tajawal]"
                            >
                              {metric}
                            </span>
                          ))}
                        </div>

                        {/* Confidence */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-[Tajawal]">
                            مستوى الثقة:
                          </span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent transition-all duration-500"
                              style={{ width: `${rec.confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-accent font-[Outfit]">
                            {rec.confidence}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expand/Collapse Button */}
                  <button className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0">
                    {isItemExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {recommendations.length === 0 && (
            <div className="text-center py-8">
              <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-[Tajawal]">لا توجد توصيات حالياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
