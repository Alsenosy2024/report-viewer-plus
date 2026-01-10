import React from 'react';
import { Trophy, Medal, Star, TrendingUp, TrendingDown, Minus, Crown, Users } from 'lucide-react';
import { LeaderboardEntry } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface EmployeeLeaderboardProps {
  entries: LeaderboardEntry[];
}

const rankConfig = {
  1: {
    bg: 'bg-gradient-to-br from-amber-500/30 to-yellow-500/20',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    icon: Crown,
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]',
  },
  2: {
    bg: 'bg-gradient-to-br from-slate-400/20 to-slate-300/10',
    border: 'border-slate-400/30',
    text: 'text-slate-300',
    icon: Medal,
    glow: '',
  },
  3: {
    bg: 'bg-gradient-to-br from-amber-700/20 to-orange-700/10',
    border: 'border-amber-700/30',
    text: 'text-amber-600',
    icon: Medal,
    glow: '',
  },
};

const badgeConfig = {
  star: { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  trophy: { icon: Trophy, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  medal: { icon: Medal, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
};

const trendConfig = {
  up: { icon: TrendingUp, color: 'text-emerald-400' },
  down: { icon: TrendingDown, color: 'text-rose-400' },
  stable: { icon: Minus, color: 'text-slate-400' },
};

export function EmployeeLeaderboard({ entries }: EmployeeLeaderboardProps) {
  const sortedEntries = [...entries].sort((a, b) => a.rank - b.rank);

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl',
      'bg-gradient-to-br from-slate-900/90 via-slate-800/60 to-slate-900/90',
      'backdrop-blur-xl border border-white/[0.08]',
      'shadow-[0_0_60px_rgba(6,182,212,0.08)]'
    )}>
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      {/* Header */}
      <div className="relative p-5 border-b border-white/[0.05]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-[Tajawal]">
                قائمة المتصدرين
              </h3>
              <p className="text-xs text-slate-500 font-[Tajawal] flex items-center gap-1">
                <Users className="w-3 h-3" />
                {entries.length} موظف
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="relative p-4 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        {sortedEntries.map((entry, index) => {
          const isTopThree = entry.rank <= 3;
          const config = rankConfig[entry.rank as 1 | 2 | 3];
          const TrendIcon = trendConfig[entry.trend].icon;
          const RankIcon = isTopThree ? config?.icon : null;

          return (
            <div
              key={index}
              className={cn(
                'group relative p-4 rounded-xl border transition-all duration-300',
                'hover:scale-[1.01] hover:shadow-lg',
                isTopThree ? config.bg : 'bg-slate-800/30',
                isTopThree ? config.border : 'border-white/[0.05]',
                isTopThree && config.glow
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                  isTopThree ? 'bg-black/20' : 'bg-slate-700/50'
                )}>
                  {RankIcon ? (
                    <RankIcon className={cn('w-5 h-5', config.text)} />
                  ) : (
                    <span className="text-lg font-bold text-slate-400 font-[Outfit]">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Employee Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      'font-semibold font-[Tajawal]',
                      isTopThree ? 'text-white' : 'text-slate-300'
                    )}>
                      {entry.employeeName}
                    </h4>
                    {entry.badge && (
                      <div className={cn(
                        'p-1 rounded-lg',
                        badgeConfig[entry.badge].bg
                      )}>
                        {React.createElement(badgeConfig[entry.badge].icon, {
                          className: cn('w-3.5 h-3.5', badgeConfig[entry.badge].color)
                        })}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-[Tajawal]">
                    {entry.tasksCompleted} مهمة مكتملة
                  </p>
                </div>

                {/* Score and Trend */}
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className={cn(
                      'text-xl font-bold font-[Outfit]',
                      isTopThree ? config.text : 'text-white'
                    )}>
                      {entry.score}
                    </p>
                    <p className="text-[10px] text-slate-500 font-[Tajawal]">نقطة</p>
                  </div>
                  <div className={cn(
                    'p-1.5 rounded-lg',
                    entry.trend === 'up' ? 'bg-emerald-500/10' :
                    entry.trend === 'down' ? 'bg-rose-500/10' : 'bg-slate-500/10'
                  )}>
                    <TrendIcon className={cn('w-4 h-4', trendConfig[entry.trend].color)} />
                  </div>
                </div>
              </div>

              {/* Progress bar for top 3 */}
              {isTopThree && (
                <div className="mt-3 h-1 rounded-full bg-black/20 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-1000 ease-out',
                      entry.rank === 1 ? 'bg-amber-500' :
                      entry.rank === 2 ? 'bg-slate-400' : 'bg-amber-700'
                    )}
                    style={{ width: `${(entry.score / sortedEntries[0].score) * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {entries.length === 0 && (
          <div className="text-center py-8">
            <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-[Tajawal]">لا توجد بيانات</p>
          </div>
        )}
      </div>
    </div>
  );
}
