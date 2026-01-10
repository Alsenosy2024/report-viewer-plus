import React from 'react';
import { Target, CheckCircle2, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { GoalProgress } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface GoalProgressTrackerProps {
  goals: GoalProgress[];
}

const statusConfig = {
  on_track: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    progressColor: 'bg-emerald-500',
    label: 'على المسار',
  },
  at_risk: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    progressColor: 'bg-amber-500',
    label: 'في خطر',
  },
  behind: {
    icon: Clock,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    progressColor: 'bg-rose-500',
    label: 'متأخر',
  },
  exceeded: {
    icon: TrendingUp,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    progressColor: 'bg-cyan-500',
    label: 'تجاوز الهدف',
  },
};

export function GoalProgressTracker({ goals }: GoalProgressTrackerProps) {
  const completedGoals = goals.filter(g => g.percentage >= 100).length;
  const overallProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + Math.min(g.percentage, 100), 0) / goals.length)
    : 0;

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl',
      'bg-gradient-to-br from-slate-900/90 via-slate-800/60 to-slate-900/90',
      'backdrop-blur-xl border border-white/[0.08]',
      'shadow-[0_0_60px_rgba(6,182,212,0.08)]'
    )}>
      {/* Decorative gradient */}
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <div className="relative p-5 border-b border-white/[0.05]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-[Tajawal]">
                تتبع الأهداف
              </h3>
              <p className="text-xs text-slate-500 font-[Tajawal]">
                {completedGoals} من {goals.length} أهداف مكتملة
              </p>
            </div>
          </div>

          {/* Overall Progress Circle */}
          <div className="relative w-14 h-14">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                className="text-slate-700"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                cx="18"
                cy="18"
                r="16"
              />
              <circle
                className="text-cyan-400 transition-all duration-1000 ease-out"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                cx="18"
                cy="18"
                r="16"
                strokeDasharray={`${overallProgress} 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white font-[Outfit]">{overallProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div className="relative p-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {goals.map((goal, index) => {
          const config = statusConfig[goal.status];
          const StatusIcon = config.icon;
          const clampedPercentage = Math.min(goal.percentage, 100);

          return (
            <div
              key={goal.id}
              className={cn(
                'group p-4 rounded-xl border transition-all duration-300',
                'bg-slate-800/30 hover:bg-slate-800/50',
                'hover:shadow-lg hover:scale-[1.01]',
                config.border
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Header Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn('w-4 h-4', config.color)} />
                  <h4 className="font-semibold text-white font-[Tajawal] text-sm">
                    {goal.title}
                  </h4>
                </div>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-[Tajawal]',
                  config.bg,
                  config.color
                )}>
                  {config.label}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2.5 rounded-full bg-slate-700/50 overflow-hidden mb-2">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out',
                    config.progressColor
                  )}
                  style={{ width: `${clampedPercentage}%` }}
                >
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-[Tajawal]">
                    الحالي: <span className="text-white font-[Outfit]">{goal.current.toLocaleString('ar-EG')}</span>
                  </span>
                  <span className="text-slate-500">/</span>
                  <span className="text-slate-400 font-[Tajawal]">
                    الهدف: <span className="text-cyan-400 font-[Outfit]">{goal.target.toLocaleString('ar-EG')}</span>
                  </span>
                  <span className="text-slate-500 font-[Tajawal]">{goal.unit}</span>
                </div>
                <span className={cn(
                  'font-bold font-[Outfit]',
                  goal.percentage >= 100 ? 'text-emerald-400' :
                  goal.percentage >= 75 ? 'text-cyan-400' :
                  goal.percentage >= 50 ? 'text-amber-400' : 'text-rose-400'
                )}>
                  {goal.percentage}%
                </span>
              </div>

              {/* Deadline if exists */}
              {goal.deadline && (
                <div className="mt-2 pt-2 border-t border-white/[0.05]">
                  <p className="text-[10px] text-slate-500 font-[Tajawal] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    الموعد النهائي: {new Date(goal.deadline).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="text-center py-8">
            <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-[Tajawal]">لا توجد أهداف محددة</p>
          </div>
        )}
      </div>
    </div>
  );
}
