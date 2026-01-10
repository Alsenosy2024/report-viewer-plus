import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Sparkles, Target, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import { ExecutiveOverview as ExecutiveOverviewType } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface ExecutiveOverviewProps {
  data: ExecutiveOverviewType;
}

const categoryConfig = {
  growth: { icon: TrendingUp, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  risk: { icon: AlertTriangle, color: 'text-error', bg: 'bg-error/10', border: 'border-error/30' },
  efficiency: { icon: Target, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
  opportunity: { icon: Lightbulb, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
};

const impactConfig = {
  high: 'bg-error',
  medium: 'bg-warning',
  low: 'bg-muted-foreground',
};

export function ExecutiveOverview({ data }: ExecutiveOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const sentimentConfig = {
    positive: { color: 'text-success', label: 'إيجابي' },
    neutral: { color: 'text-muted-foreground', label: 'محايد' },
    negative: { color: 'text-error', label: 'سلبي' },
  };

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl h-full',
      'bg-card border border-border',
      'hover:shadow-lg transition-shadow'
    )}>
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <div
        className="relative flex items-center justify-between p-5 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 text-accent">
              <Brain className="w-5 h-5" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-accent animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground font-[Tajawal] flex items-center gap-2">
              الملخص التنفيذي
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                sentimentConfig[data.overallSentiment].color,
                'bg-current/10'
              )}>
                {sentimentConfig[data.overallSentiment].label}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground font-[Tajawal]">
              مستوى الثقة: {data.confidenceScore}%
            </p>
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
        isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="px-5 pb-5 space-y-5">
          {/* Summary */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-foreground leading-relaxed font-[Tajawal] whitespace-pre-wrap">
              {data.summary}
            </p>
          </div>

          {/* Strategic Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground font-[Tajawal] flex items-center gap-2">
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
                      'bg-card hover:bg-muted/50',
                      config.border,
                      'hover:shadow-md'
                    )}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Priority indicator */}
                      <div className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-[Outfit]',
                        action.priority === 1 ? 'bg-error/20 text-error' :
                        action.priority === 2 ? 'bg-warning/20 text-warning' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {action.priority}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CategoryIcon className={cn('w-4 h-4', config.color)} />
                          <h5 className="font-semibold text-foreground font-[Tajawal] text-sm">
                            {action.title}
                          </h5>
                        </div>
                        <p className="text-xs text-muted-foreground font-[Tajawal] leading-relaxed">
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
