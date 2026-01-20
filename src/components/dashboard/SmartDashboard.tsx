import React from 'react';
import { RefreshCw, Clock, Brain, MessageSquare, BarChart3, Users, Maximize2, Minimize2, CheckCircle2, DollarSign, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Dashboard Data Hook
import { useDashboardData, MOCK_DASHBOARD_DATA } from '@/hooks/useDashboardData';

// Widget Components
import { KPICard, ExecutiveOverview, SectionCard, AlertsPanel, RecommendationsCard } from './widgets';

const SmartDashboard = () => {
  const { data: dashboardData, isLoading, error, refresh, timerSeconds, isTimerActive } = useDashboardData();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Use mock data in development or when no data is available
  const data = dashboardData || MOCK_DASHBOARD_DATA;

  // Format timer display
  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="min-h-[400px] bg-background flex items-center justify-center rounded-2xl border border-border">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-accent/20 border-t-accent animate-spin mx-auto" />
            <Brain className="absolute inset-0 m-auto w-8 h-8 text-accent" />
          </div>
          <p className="mt-4 text-lg text-muted-foreground font-[Tajawal]">جاري تحميل الداشبورد الذكي...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[400px] bg-background flex items-center justify-center rounded-2xl border border-border">
        <div className="text-center p-8 rounded-2xl bg-card border border-error/20 max-w-md">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-error" />
          </div>
          <h3 className="text-xl font-bold text-foreground font-[Tajawal] mb-2">خطأ في التحميل</h3>
          <p className="text-muted-foreground font-[Tajawal] mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={isTimerActive}>
            {isTimerActive ? (
              <>
                <Clock className="h-4 w-4 ml-2" />
                {formatTimer(timerSeconds)}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 ml-2" />
                إعادة المحاولة
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const dashboardContent = (
    <div className={cn(
      'min-h-screen p-4 md:p-6',
      'bg-background',
      isFullscreen && 'fixed inset-0 z-50 overflow-auto'
    )} dir="rtl" lang="ar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 text-accent">
              <Brain className="w-6 h-6" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-[Tajawal]">
              الداشبورد الذكي
            </h1>
            <p className="text-sm text-muted-foreground font-[Tajawal]">
              تحليل شامل بواسطة الذكاء الاصطناعي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isTimerActive}
          >
            {isTimerActive ? (
              <>
                <Clock className="h-4 w-4 ml-2 animate-pulse" />
                {formatTimer(timerSeconds)}
              </>
            ) : (
              <>
                <RefreshCw className={cn('h-4 w-4 ml-2', isLoading && 'animate-spin')} />
                تحديث
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4 ml-2" />
                <span className="hidden sm:inline">تصغير</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 ml-2" />
                <span className="hidden sm:inline">ملء الشاشة</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Meta Info Bar */}
      {data.meta && (
        <div className="mb-4 px-4 py-2 rounded-xl bg-muted/50 border border-border flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-[Tajawal]">
          <span>الفترة: {new Date(data.meta.periodStart).toLocaleDateString('ar-EG')} - {new Date(data.meta.periodEnd).toLocaleDateString('ar-EG')}</span>
          <span className="hidden sm:inline">|</span>
          <span>اكتمال البيانات: <span className="text-accent font-[Outfit]">{data.meta.dataCompleteness}%</span></span>
          <span className="hidden sm:inline">|</span>
          <span>آخر تحديث: {new Date(data.meta.generatedAt).toLocaleTimeString('ar-EG')}</span>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="space-y-6">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="إجمالي التفاعلات"
            icon={<Users className="w-5 h-5" />}
            metric={data.kpis.totalInteractions}
          />
          <KPICard
            title="معدل الإنجاز"
            icon={<CheckCircle2 className="w-5 h-5" />}
            metric={data.kpis.completionRate}
          />
          <KPICard
            title="متوسط زمن الرد"
            icon={<Timer className="w-5 h-5" />}
            metric={data.kpis.avgResponseTime}
          />
          <KPICard
            title="الإيرادات"
            icon={<DollarSign className="w-5 h-5" />}
            metric={data.kpis.revenue}
          />
        </div>

        {/* Executive Overview and Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ExecutiveOverview data={data.executiveOverview} />
          </div>
          <div>
            <AlertsPanel alerts={data.alerts} />
          </div>
        </div>

        {/* Section Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard
            title="واتساب"
            icon={<MessageSquare className="w-5 h-5" />}
            summary={data.sections.whatsapp.summary}
            accentColor="success"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-lg font-bold text-foreground font-[Outfit]">
                  {data.sections.whatsapp.metrics.totalCustomers?.value?.toLocaleString('ar-EG') ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground font-[Tajawal]">إجمالي العملاء</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-lg font-bold text-success font-[Outfit]">
                  {data.sections.whatsapp.metrics.newCustomers?.value?.toLocaleString('ar-EG') ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground font-[Tajawal]">عملاء جدد</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-lg font-bold text-accent font-[Outfit]">
                  {data.sections.whatsapp.metrics.avgResponseTime?.value ?? '—'} {data.sections.whatsapp.metrics.avgResponseTime?.unit ?? ''}
                </p>
                <p className="text-xs text-muted-foreground font-[Tajawal]">متوسط زمن الرد</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-lg font-bold text-warning font-[Outfit]">
                  {data.sections.whatsapp.metrics.resolutionRate?.value ?? '—'}%
                </p>
                <p className="text-xs text-muted-foreground font-[Tajawal]">معدل الحل</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="الإنتاجية"
            icon={<BarChart3 className="w-5 h-5" />}
            summary={data.sections.productivity.summary}
            accentColor="warning"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-lg font-bold text-foreground font-[Outfit]">
                  {data.sections.productivity.metrics.tasksCompleted?.value?.toLocaleString('ar-EG') ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground font-[Tajawal]">مهام مكتملة</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-lg font-bold text-error font-[Outfit]">
                  {data.sections.productivity.metrics.tasksLate?.value?.toLocaleString('ar-EG') ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground font-[Tajawal]">مهام متأخرة</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-lg font-bold text-success font-[Outfit]">
                  {data.sections.productivity.metrics.completionRate?.value ?? '—'}%
                </p>
                <p className="text-xs text-muted-foreground font-[Tajawal]">معدل الإنجاز</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-lg font-bold text-accent font-[Outfit]">
                  {data.sections.productivity.metrics.avgTaskDuration?.value ?? '—'} {data.sections.productivity.metrics.avgTaskDuration?.unit ?? ''}
                </p>
                <p className="text-xs text-muted-foreground font-[Tajawal]">متوسط المدة</p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Recommendations */}
        <RecommendationsCard recommendations={data.recommendations} />
      </div>
    </div>
  );

  return dashboardContent;
};

export default SmartDashboard;
