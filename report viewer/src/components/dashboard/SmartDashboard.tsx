import React, { useState, useCallback, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import {
  RefreshCw, Clock, Brain, MessageSquare, BarChart3, Mail,
  Users, Maximize2, Minimize2, LayoutGrid, Save, RotateCcw,
  TrendingUp, CheckCircle2, DollarSign, Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Dashboard Data Hook
import { useDashboardData, MOCK_DASHBOARD_DATA } from '@/hooks/useDashboardData';

// Widget Components
import { KPICard } from './widgets/KPICard';
import { ExecutiveOverview } from './widgets/ExecutiveOverview';
import { SectionCard } from './widgets/SectionCard';
import { AlertsPanel } from './widgets/AlertsPanel';
import { CrossChannelFunnel } from './widgets/CrossChannelFunnel';
import { EmployeeLeaderboard } from './widgets/EmployeeLeaderboard';
import { GoalProgressTracker } from './widgets/GoalProgressTracker';
import { SentimentGauge } from './widgets/SentimentGauge';
import { ActivityHeatmap } from './widgets/ActivityHeatmap';
import { RecommendationsCard } from './widgets/RecommendationsCard';

// Import react-grid-layout styles
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = GridLayout.WidthProvider(GridLayout.Responsive);

// Default layout for different breakpoints
const defaultLayouts = {
  lg: [
    { i: 'kpi-1', x: 0, y: 0, w: 3, h: 4 },
    { i: 'kpi-2', x: 3, y: 0, w: 3, h: 4 },
    { i: 'kpi-3', x: 6, y: 0, w: 3, h: 4 },
    { i: 'kpi-4', x: 9, y: 0, w: 3, h: 4 },
    { i: 'executive', x: 0, y: 4, w: 8, h: 6 },
    { i: 'alerts', x: 8, y: 4, w: 4, h: 6 },
    { i: 'whatsapp', x: 0, y: 10, w: 6, h: 5 },
    { i: 'productivity', x: 6, y: 10, w: 6, h: 5 },
    { i: 'funnel', x: 0, y: 15, w: 6, h: 6 },
    { i: 'leaderboard', x: 6, y: 15, w: 6, h: 6 },
    { i: 'goals', x: 0, y: 21, w: 4, h: 6 },
    { i: 'sentiment', x: 4, y: 21, w: 4, h: 6 },
    { i: 'heatmap', x: 8, y: 21, w: 4, h: 6 },
    { i: 'recommendations', x: 0, y: 27, w: 12, h: 5 },
  ],
  md: [
    { i: 'kpi-1', x: 0, y: 0, w: 3, h: 4 },
    { i: 'kpi-2', x: 3, y: 0, w: 3, h: 4 },
    { i: 'kpi-3', x: 0, y: 4, w: 3, h: 4 },
    { i: 'kpi-4', x: 3, y: 4, w: 3, h: 4 },
    { i: 'executive', x: 0, y: 8, w: 6, h: 6 },
    { i: 'alerts', x: 0, y: 14, w: 6, h: 5 },
    { i: 'whatsapp', x: 0, y: 19, w: 6, h: 5 },
    { i: 'productivity', x: 0, y: 24, w: 6, h: 5 },
    { i: 'funnel', x: 0, y: 29, w: 6, h: 6 },
    { i: 'leaderboard', x: 0, y: 35, w: 6, h: 6 },
    { i: 'goals', x: 0, y: 41, w: 3, h: 6 },
    { i: 'sentiment', x: 3, y: 41, w: 3, h: 6 },
    { i: 'heatmap', x: 0, y: 47, w: 6, h: 6 },
    { i: 'recommendations', x: 0, y: 53, w: 6, h: 5 },
  ],
  sm: [
    { i: 'kpi-1', x: 0, y: 0, w: 2, h: 4 },
    { i: 'kpi-2', x: 2, y: 0, w: 2, h: 4 },
    { i: 'kpi-3', x: 0, y: 4, w: 2, h: 4 },
    { i: 'kpi-4', x: 2, y: 4, w: 2, h: 4 },
    { i: 'executive', x: 0, y: 8, w: 4, h: 6 },
    { i: 'alerts', x: 0, y: 14, w: 4, h: 5 },
    { i: 'whatsapp', x: 0, y: 19, w: 4, h: 5 },
    { i: 'productivity', x: 0, y: 24, w: 4, h: 5 },
    { i: 'funnel', x: 0, y: 29, w: 4, h: 6 },
    { i: 'leaderboard', x: 0, y: 35, w: 4, h: 6 },
    { i: 'goals', x: 0, y: 41, w: 4, h: 6 },
    { i: 'sentiment', x: 0, y: 47, w: 4, h: 6 },
    { i: 'heatmap', x: 0, y: 53, w: 4, h: 6 },
    { i: 'recommendations', x: 0, y: 59, w: 4, h: 5 },
  ],
};

const LAYOUT_STORAGE_KEY = 'smart-dashboard-layouts';

const SmartDashboard = () => {
  const { toast } = useToast();
  const { data: dashboardData, isLoading, error, refresh, timerSeconds, isTimerActive } = useDashboardData();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultLayouts;
  });
  const [isEditMode, setIsEditMode] = useState(false);

  // Use mock data in development or when no data is available
  const data = dashboardData || MOCK_DASHBOARD_DATA;

  // Format timer display
  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle layout changes
  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    if (isEditMode) {
      setLayouts(allLayouts);
    }
  }, [isEditMode]);

  // Save layout to localStorage
  const saveLayout = useCallback(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
    toast({
      title: 'تم الحفظ',
      description: 'تم حفظ تخطيط الداشبورد بنجاح',
    });
    setIsEditMode(false);
  }, [layouts, toast]);

  // Reset layout to default
  const resetLayout = useCallback(() => {
    setLayouts(defaultLayouts);
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
    toast({
      title: 'تم الإستعادة',
      description: 'تم إستعادة التخطيط الافتراضي',
    });
    setIsEditMode(false);
  }, [toast]);

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refresh();
      toast({
        title: 'تم تفعيل التحديث',
        description: 'تم إرسال طلب تحديث الداشبورد بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ في التحديث',
        description: 'فشل في تفعيل تحديث الداشبورد',
        variant: 'destructive',
      });
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin mx-auto" />
            <Brain className="absolute inset-0 m-auto w-8 h-8 text-cyan-400" />
          </div>
          <p className="mt-4 text-lg text-slate-400 font-[Tajawal]">جاري تحميل الداشبورد الذكي...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-rose-500/20 max-w-md">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-rose-400" />
          </div>
          <h3 className="text-xl font-bold text-white font-[Tajawal] mb-2">خطأ في التحميل</h3>
          <p className="text-slate-400 font-[Tajawal] mb-4">{error}</p>
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
      'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
      isFullscreen && 'fixed inset-0 z-50 overflow-auto'
    )} dir="rtl" lang="ar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400">
              <Brain className="w-6 h-6" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-[Tajawal]">
              الداشبورد الذكي
            </h1>
            <p className="text-sm text-slate-500 font-[Tajawal]">
              تحليل شامل بواسطة الذكاء الاصطناعي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isEditMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={saveLayout}
                className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              >
                <Save className="h-4 w-4 ml-2" />
                حفظ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetLayout}
                className="bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
              >
                <RotateCcw className="h-4 w-4 ml-2" />
                إستعادة
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(false)}
                className="bg-slate-500/10 border-slate-500/30 text-slate-400 hover:bg-slate-500/20"
              >
                إلغاء
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(true)}
              className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
            >
              <LayoutGrid className="h-4 w-4 ml-2" />
              تخصيص
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isTimerActive}
            className="bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50"
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
            className="bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50"
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
        <div className="mb-4 px-4 py-2 rounded-xl bg-slate-800/30 border border-white/[0.05] flex flex-wrap items-center gap-4 text-xs text-slate-500 font-[Tajawal]">
          <span>الفترة: {new Date(data.meta.periodStart).toLocaleDateString('ar-EG')} - {new Date(data.meta.periodEnd).toLocaleDateString('ar-EG')}</span>
          <span className="hidden sm:inline">|</span>
          <span>اكتمال البيانات: <span className="text-cyan-400 font-[Outfit]">{data.meta.dataCompleteness}%</span></span>
          <span className="hidden sm:inline">|</span>
          <span>آخر تحديث: {new Date(data.meta.generatedAt).toLocaleTimeString('ar-EG')}</span>
        </div>
      )}

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 768, sm: 480 }}
        cols={{ lg: 12, md: 6, sm: 4 }}
        rowHeight={40}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        compactType="vertical"
        preventCollision={false}
      >
        {/* KPI Cards */}
        <div key="kpi-1">
          <KPICard
            title="إجمالي التفاعلات"
            icon={<Users className="w-5 h-5" />}
            metric={data.kpis.totalInteractions}
          />
        </div>
        <div key="kpi-2">
          <KPICard
            title="معدل الإنجاز"
            icon={<CheckCircle2 className="w-5 h-5" />}
            metric={data.kpis.completionRate}
          />
        </div>
        <div key="kpi-3">
          <KPICard
            title="متوسط زمن الرد"
            icon={<Timer className="w-5 h-5" />}
            metric={data.kpis.avgResponseTime}
          />
        </div>
        <div key="kpi-4">
          <KPICard
            title="الإيرادات"
            icon={<DollarSign className="w-5 h-5" />}
            metric={data.kpis.revenue}
          />
        </div>

        {/* Executive Overview */}
        <div key="executive">
          <ExecutiveOverview data={data.executiveOverview} />
        </div>

        {/* Alerts Panel */}
        <div key="alerts">
          <AlertsPanel alerts={data.alerts} />
        </div>

        {/* WhatsApp Section */}
        <div key="whatsapp">
          <SectionCard
            title="واتساب"
            icon={<MessageSquare className="w-5 h-5" />}
            summary={data.sections.whatsapp.summary}
            accentColor="emerald"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-white/[0.05]">
                <p className="text-lg font-bold text-white font-[Outfit]">
                  {data.sections.whatsapp.metrics.totalCustomers.value.toLocaleString('ar-EG')}
                </p>
                <p className="text-xs text-slate-500 font-[Tajawal]">إجمالي العملاء</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-white/[0.05]">
                <p className="text-lg font-bold text-emerald-400 font-[Outfit]">
                  {data.sections.whatsapp.metrics.newCustomers.value.toLocaleString('ar-EG')}
                </p>
                <p className="text-xs text-slate-500 font-[Tajawal]">عملاء جدد</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-white/[0.05]">
                <p className="text-lg font-bold text-cyan-400 font-[Outfit]">
                  {data.sections.whatsapp.metrics.avgResponseTime.value} {data.sections.whatsapp.metrics.avgResponseTime.unit}
                </p>
                <p className="text-xs text-slate-500 font-[Tajawal]">متوسط زمن الرد</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-white/[0.05]">
                <p className="text-lg font-bold text-amber-400 font-[Outfit]">
                  {data.sections.whatsapp.metrics.resolutionRate.value}%
                </p>
                <p className="text-xs text-slate-500 font-[Tajawal]">معدل الحل</p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Productivity Section */}
        <div key="productivity">
          <SectionCard
            title="الإنتاجية"
            icon={<BarChart3 className="w-5 h-5" />}
            summary={data.sections.productivity.summary}
            accentColor="amber"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-white/[0.05]">
                <p className="text-lg font-bold text-white font-[Outfit]">
                  {data.sections.productivity.metrics.tasksCompleted.value.toLocaleString('ar-EG')}
                </p>
                <p className="text-xs text-slate-500 font-[Tajawal]">مهام مكتملة</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-white/[0.05]">
                <p className="text-lg font-bold text-rose-400 font-[Outfit]">
                  {data.sections.productivity.metrics.tasksLate.value.toLocaleString('ar-EG')}
                </p>
                <p className="text-xs text-slate-500 font-[Tajawal]">مهام متأخرة</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-white/[0.05]">
                <p className="text-lg font-bold text-emerald-400 font-[Outfit]">
                  {data.sections.productivity.metrics.completionRate.value}%
                </p>
                <p className="text-xs text-slate-500 font-[Tajawal]">معدل الإنجاز</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-white/[0.05]">
                <p className="text-lg font-bold text-cyan-400 font-[Outfit]">
                  {data.sections.productivity.metrics.avgTaskDuration.value} {data.sections.productivity.metrics.avgTaskDuration.unit}
                </p>
                <p className="text-xs text-slate-500 font-[Tajawal]">متوسط المدة</p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Cross Channel Funnel */}
        <div key="funnel">
          <CrossChannelFunnel data={data.crossChannelFunnel} />
        </div>

        {/* Employee Leaderboard */}
        <div key="leaderboard">
          <EmployeeLeaderboard entries={data.leaderboard} />
        </div>

        {/* Goal Progress Tracker */}
        <div key="goals">
          <GoalProgressTracker goals={data.goals} />
        </div>

        {/* Sentiment Gauge */}
        <div key="sentiment">
          <SentimentGauge data={data.sentimentGauge} />
        </div>

        {/* Activity Heatmap */}
        <div key="heatmap">
          <ActivityHeatmap data={data.activityHeatmap} />
        </div>

        {/* Recommendations */}
        <div key="recommendations">
          <RecommendationsCard recommendations={data.recommendations} />
        </div>
      </ResponsiveGridLayout>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-[Tajawal] shadow-lg backdrop-blur-sm">
          <LayoutGrid className="inline-block w-4 h-4 ml-2" />
          وضع التحرير - اسحب العناصر لإعادة ترتيبها
        </div>
      )}
    </div>
  );

  return dashboardContent;
};

export default SmartDashboard;
