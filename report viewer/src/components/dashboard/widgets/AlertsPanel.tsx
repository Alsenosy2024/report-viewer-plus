import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Bell, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Alert } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface AlertsPanelProps {
  alerts: Alert[];
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    glow: 'shadow-rose-500/20',
    label: 'حرج',
    pulse: true,
  },
  high: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    label: 'عالي',
    pulse: false,
  },
  medium: {
    icon: Info,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
    label: 'متوسط',
    pulse: false,
  },
  low: {
    icon: Bell,
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    glow: 'shadow-slate-500/20',
    label: 'منخفض',
    pulse: false,
  },
};

const typeLabels = {
  anomaly: 'شذوذ',
  threshold: 'تجاوز حد',
  trend: 'اتجاه',
  prediction: 'توقع',
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  const toggleAlert = (id: string) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAlerts(newExpanded);
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl',
      'bg-gradient-to-br from-slate-900/90 via-slate-800/60 to-slate-900/90',
      'backdrop-blur-xl border border-white/[0.08]',
      criticalCount > 0 && 'shadow-[0_0_60px_rgba(244,63,94,0.15)]'
    )}>
      {/* Animated gradient background for critical alerts */}
      {criticalCount > 0 && (
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-transparent to-rose-500/5 animate-pulse" />
      )}

      {/* Header */}
      <div
        className="relative flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'relative p-2.5 rounded-xl',
            criticalCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
          )}>
            <Zap className="w-5 h-5" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-[Tajawal] flex items-center gap-2">
              التنبيهات والإشعارات
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-[Outfit]">
                {alerts.length}
              </span>
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {criticalCount > 0 && (
                <span className="text-rose-400">{criticalCount} حرج</span>
              )}
              {highCount > 0 && (
                <span className="text-amber-400">{highCount} عالي</span>
              )}
            </div>
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
        <div className="px-4 pb-4 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
          {sortedAlerts.map((alert, index) => {
            const config = severityConfig[alert.severity];
            const SeverityIcon = config.icon;
            const isAlertExpanded = expandedAlerts.has(alert.id);

            return (
              <div
                key={alert.id}
                className={cn(
                  'group p-3 rounded-xl border transition-all duration-300 cursor-pointer',
                  config.bg,
                  config.border,
                  'hover:shadow-lg',
                  config.pulse && 'animate-pulse'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => toggleAlert(alert.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'flex-shrink-0 p-1.5 rounded-lg',
                    config.bg
                  )}>
                    <SeverityIcon className={cn('w-4 h-4', config.text)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn('font-semibold text-sm font-[Tajawal]', config.text)}>
                        {alert.title}
                      </h4>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full',
                        config.bg,
                        config.text
                      )}>
                        {config.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                        {typeLabels[alert.type]}
                      </span>
                    </div>

                    <p className={cn(
                      'text-xs text-slate-400 font-[Tajawal] leading-relaxed',
                      !isAlertExpanded && 'line-clamp-1'
                    )}>
                      {alert.description}
                    </p>

                    {isAlertExpanded && alert.suggestedAction && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <p className="text-xs text-cyan-400 font-[Tajawal]">
                          <span className="text-slate-500">الإجراء المقترح: </span>
                          {alert.suggestedAction}
                        </p>
                      </div>
                    )}
                  </div>

                  <button className="p-1 hover:bg-white/5 rounded transition-colors">
                    {isAlertExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {alerts.length === 0 && (
            <div className="text-center py-8">
              <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-[Tajawal]">لا توجد تنبيهات</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
