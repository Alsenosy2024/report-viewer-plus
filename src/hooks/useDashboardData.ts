import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardData } from '@/types/dashboard';
import { useToast } from './use-toast';

interface N8nDashboardRow {
  id: string;
  dashboard_name: string;
  html_content: string;
  json_content: DashboardData | null;
  workflow_id: string | null;
  version: number;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_by_workflow: string | null;
  created_at: string;
  updated_at: string;
}

export function useDashboardData() {
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(seconds => {
          if (seconds <= 1) {
            setIsTimerActive(false);
            return 0;
          }
          return seconds - 1;
        });
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timerSeconds]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: dbData, error: dbError } = await supabase
        .from('n8n_dashboards')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbError) {
        console.error('Error loading dashboard data:', dbError);
        throw new Error('فشل في تحميل بيانات الداشبورد');
      }

      if (!dbData) {
        setData(null);
        return;
      }

      // Check if we have JSON content (new format)
      if (dbData.json_content) {
        setData(dbData.json_content as unknown as DashboardData);
        return;
      }

      // Fallback: Try to parse html_content as JSON (for transition period)
      try {
        const parsed = JSON.parse(dbData.html_content);
        if (parsed.meta && parsed.kpis) {
          setData(parsed as DashboardData);
          return;
        }
      } catch {
        // Not JSON, return null to indicate legacy HTML format
      }

      setData(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      // Start 5-minute timer
      setTimerSeconds(300);
      setIsTimerActive(true);

      // Trigger the webhook
      await fetch('https://primary-production-245af.up.railway.app/webhook/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'refresh_dashboard',
          timestamp: new Date().toISOString(),
        }),
      });

      toast({
        title: 'تم تفعيل التحديث',
        description: 'سيتم تحديث البيانات خلال دقائق',
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error triggering refresh:', error);
      setIsTimerActive(false);
      setTimerSeconds(0);
      toast({
        title: 'خطأ في التحديث',
        description: 'فشل في تفعيل تحديث البيانات',
        variant: 'destructive',
      });
      throw error;
    }
  }, [loadData, toast]);

  // Load on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('n8n-dashboards-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'n8n_dashboards'
        },
        async () => {
          console.log('New n8n dashboard detected');
          await loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  return {
    data,
    isLoading,
    error,
    refresh,
    timerSeconds,
    isTimerActive,
  };
}

// Mock data for development/preview
export const MOCK_DASHBOARD_DATA: DashboardData = {
  meta: {
    generatedAt: new Date().toISOString(),
    periodStart: '2025-01-04',
    periodEnd: '2025-01-10',
    dataCompleteness: 85,
    version: '1.0',
  },
  executiveOverview: {
    summary: `شهد هذا الأسبوع أداءً متميزاً على صعيد التفاعلات عبر واتساب مع تسجيل 577 تفاعل نشط، بزيادة 12% عن الأسبوع الماضي. الطلب على دبلومة الذكاء الاصطناعي يمثل 48% من إجمالي الاستفسارات.

لوحظ تحسن في معدل الإنجاز وإن كان لا يزال دون المستهدف بنسبة 4%. أبرز التحديات تتمثل في تذبذب أوقات الرد خارج ساعات الدوام الرسمي.

التوصية الرئيسية: تعزيز فريق الدعم في الفترات المسائية لضمان استجابة أسرع.`,
    strategicActions: [
      {
        priority: 1,
        title: 'تعزيز فريق الرد المسائي',
        description: 'إضافة مناوبة مسائية لتغطية الفترة من 6 مساءً حتى 10 مساءً',
        category: 'efficiency',
        impact: 'high',
      },
      {
        priority: 2,
        title: 'تحسين صفحة دبلومة الذكاء الاصطناعي',
        description: 'تحديث محتوى الصفحة وإضافة فيديو تعريفي لتقليل الاستفسارات المتكررة',
        category: 'growth',
        impact: 'medium',
      },
      {
        priority: 3,
        title: 'مراجعة آلية الدفع',
        description: 'توضيح الفرق بين رسوم الكورس ورسوم الجامعة في صفحة الدفع',
        category: 'risk',
        impact: 'medium',
      },
    ],
    overallSentiment: 'positive',
    confidenceScore: 82,
  },
  kpis: {
    totalInteractions: {
      value: 577,
      trend: 'up',
      changePercent: 12,
      changeLabel: 'مقارنة بالأسبوع الماضي',
      status: 'good',
      sparkline: [68, 88, 74, 65, 78, 70, 134],
    },
    completionRate: {
      value: 71,
      unit: '%',
      trend: 'down',
      changePercent: -4,
      changeLabel: 'مقارنة بالأسبوع الماضي',
      status: 'warning',
      sparkline: [75, 72, 70, 68, 71, 73, 71],
    },
    avgResponseTime: {
      value: 17,
      unit: 'دقيقة',
      trend: 'stable',
      status: 'warning',
      sparkline: [15, 18, 22, 14, 19, 16, 17],
    },
    revenue: {
      value: 125000,
      unit: 'ج.م',
      trend: 'up',
      changePercent: 8,
      status: 'good',
      sparkline: [95000, 110000, 105000, 120000, 115000, 130000, 125000],
    },
  },
  sections: {
    whatsapp: {
      summary: 'نشاط واتساب يشهد ارتفاعاً ملحوظاً مع تركيز الطلب على دورات الذكاء الاصطناعي',
      metrics: {
        totalCustomers: { value: 149, trend: 'up', changePercent: 15, status: 'good' },
        newCustomers: { value: 88, trend: 'up', changePercent: 214, status: 'good' },
        avgResponseTime: { value: 17, unit: 'دقيقة', trend: 'stable', status: 'warning' },
        conversationVolume: { value: 577, trend: 'up', changePercent: 12, status: 'good' },
        resolutionRate: { value: 85, unit: '%', trend: 'up', status: 'good' },
      },
      topConversationTopics: [
        { topic: 'دبلومة الذكاء الاصطناعي', count: 278 },
        { topic: 'شهادة PMP', count: 185 },
        { topic: 'ماجستير إدارة الأعمال', count: 87 },
        { topic: 'استفسارات الدفع', count: 27 },
      ],
      peakHours: [
        { hour: 10, volume: 45 },
        { hour: 14, volume: 62 },
        { hour: 18, volume: 78 },
        { hour: 20, volume: 55 },
      ],
      dailyBreakdown: [
        { day: 'السبت', customers: 33, messages: 82 },
        { day: 'الأحد', customers: 28, messages: 75 },
        { day: 'الاثنين', customers: 88, messages: 134 },
        { day: 'الثلاثاء', customers: 42, messages: 95 },
        { day: 'الأربعاء', customers: 38, messages: 88 },
        { day: 'الخميس', customers: 45, messages: 103 },
        { day: 'الجمعة', customers: 15, messages: 42 },
      ],
    },
    productivity: {
      summary: 'معدل الإنجاز يحتاج تحسين مع وجود تأخر في بعض المهام',
      metrics: {
        tasksCompleted: { value: 145, trend: 'up', status: 'good' },
        tasksLate: { value: 12, trend: 'down', changePercent: -8, status: 'warning' },
        completionRate: { value: 71, unit: '%', trend: 'down', status: 'warning' },
        avgTaskDuration: { value: 2.5, unit: 'ساعة', trend: 'stable', status: 'good' },
      },
      employeePerformance: [
        { name: 'أحمد محمد', tasksCompleted: 45, tasksLate: 1, score: 95, trend: 'up' },
        { name: 'سارة أحمد', tasksCompleted: 42, tasksLate: 2, score: 88, trend: 'up' },
        { name: 'محمد علي', tasksCompleted: 38, tasksLate: 3, score: 82, trend: 'stable' },
        { name: 'فاطمة حسن', tasksCompleted: 35, tasksLate: 4, score: 78, trend: 'down' },
        { name: 'عمر خالد', tasksCompleted: 30, tasksLate: 2, score: 72, trend: 'up' },
      ],
      dailyBreakdown: [
        { day: 'السبت', completed: 18, late: 2 },
        { day: 'الأحد', completed: 22, late: 1 },
        { day: 'الاثنين', completed: 25, late: 3 },
        { day: 'الثلاثاء', completed: 20, late: 2 },
        { day: 'الأربعاء', completed: 28, late: 1 },
        { day: 'الخميس', completed: 32, late: 3 },
        { day: 'الجمعة', completed: 0, late: 0 },
      ],
    },
    ads: {
      summary: 'أداء الإعلانات جيد مع عائد مقبول على الإنفاق',
      metrics: {
        totalSpend: { value: 15000, unit: 'ج.م', trend: 'up', status: 'good' },
        totalResults: { value: 320, trend: 'up', changePercent: 18, status: 'good' },
        costPerResult: { value: 46.9, unit: 'ج.م', trend: 'down', status: 'good' },
        roas: { value: 3.2, trend: 'up', status: 'good' },
        impressions: { value: 125000, trend: 'up', status: 'good' },
        clicks: { value: 4500, trend: 'up', status: 'good' },
        ctr: { value: 3.6, unit: '%', trend: 'up', status: 'good' },
      },
      campaignBreakdown: [
        { name: 'دبلومة AI - تحويلات', spend: 8000, results: 180, cpr: 44.4, status: 'active' },
        { name: 'PMP - وعي', spend: 4500, results: 95, cpr: 47.4, status: 'active' },
        { name: 'MBA - إعادة استهداف', spend: 2500, results: 45, cpr: 55.6, status: 'paused' },
      ],
      dailyBreakdown: [
        { day: 'السبت', spend: 2100, results: 42 },
        { day: 'الأحد', spend: 2400, results: 55 },
        { day: 'الاثنين', spend: 2200, results: 48 },
        { day: 'الثلاثاء', spend: 2300, results: 52 },
        { day: 'الأربعاء', spend: 2500, results: 58 },
        { day: 'الخميس', spend: 2800, results: 65 },
        { day: 'الجمعة', spend: 700, results: 0 },
      ],
    },
    email: {
      summary: 'أداء البريد الإلكتروني يفوق المستهدف مع معدل فتح جيد',
      metrics: {
        totalSent: { value: 12500, trend: 'up', status: 'good' },
        openRate: { value: 28, unit: '%', trend: 'up', status: 'good' },
        clickRate: { value: 4.2, unit: '%', trend: 'up', status: 'good' },
        conversionRate: { value: 1.8, unit: '%', trend: 'stable', status: 'good' },
        bounceRate: { value: 1.2, unit: '%', trend: 'down', status: 'good' },
        unsubscribeRate: { value: 0.3, unit: '%', trend: 'stable', status: 'good' },
      },
      topPerformingEmails: [
        { subject: 'عرض حصري: دبلومة الذكاء الاصطناعي', openRate: 42, clickRate: 8.5, sent: 3200 },
        { subject: 'آخر فرصة للتسجيل في PMP', openRate: 38, clickRate: 6.2, sent: 2800 },
        { subject: 'دليلك الشامل للماجستير', openRate: 32, clickRate: 4.8, sent: 2500 },
      ],
      dailyBreakdown: [
        { day: 'السبت', sent: 1500, opens: 420, clicks: 63 },
        { day: 'الأحد', sent: 2200, opens: 616, clicks: 92 },
        { day: 'الاثنين', sent: 2500, opens: 700, clicks: 105 },
        { day: 'الثلاثاء', sent: 2000, opens: 560, clicks: 84 },
        { day: 'الأربعاء', sent: 2300, opens: 644, clicks: 97 },
        { day: 'الخميس', sent: 2000, opens: 560, clicks: 84 },
        { day: 'الجمعة', sent: 0, opens: 0, clicks: 0 },
      ],
    },
  },
  crossChannelFunnel: {
    stages: [
      { name: 'مشاهدات الإعلانات', value: 125000, percentage: 100 },
      { name: 'نقرات', value: 4500, percentage: 3.6, dropoff: 96.4 },
      { name: 'تواصل واتساب', value: 577, percentage: 12.8, dropoff: 87.2 },
      { name: 'اهتمام فعلي', value: 320, percentage: 55.5, dropoff: 44.5 },
      { name: 'تحويل/تسجيل', value: 45, percentage: 14.1, dropoff: 85.9 },
    ],
    conversionRate: 0.036,
  },
  alerts: [
    {
      id: 'alert-1',
      severity: 'critical',
      type: 'anomaly',
      title: 'تذبذب حاد في وقت الرد',
      description: 'تفاوت بين 1 دقيقة و 6 ساعات في أوقات الاستجابة، خاصة في الفترات الليلية',
      affectedMetric: 'avgResponseTime',
      section: 'whatsapp',
      suggestedAction: 'تعيين مناوبة مسائية أو تفعيل الرد الآلي',
      detectedAt: new Date().toISOString(),
    },
    {
      id: 'alert-2',
      severity: 'high',
      type: 'trend',
      title: 'انخفاض معدل الإنجاز',
      description: 'انخفاض 4% في معدل إنجاز المهام مقارنة بالأسبوع الماضي',
      affectedMetric: 'completionRate',
      section: 'productivity',
      suggestedAction: 'مراجعة توزيع المهام وتحديد أسباب التأخير',
      detectedAt: new Date().toISOString(),
    },
    {
      id: 'alert-3',
      severity: 'medium',
      type: 'anomaly',
      title: 'ارتباك في هيكل الدفع',
      description: 'شكاوى متكررة حول الفرق بين رسوم الجامعة ورسوم الكورس',
      affectedMetric: 'customerSatisfaction',
      section: 'general',
      suggestedAction: 'توضيح التفاصيل في صفحة الدفع والمحادثات',
      detectedAt: new Date().toISOString(),
    },
  ],
  charts: [],
  leaderboard: [
    { rank: 1, employeeName: 'أحمد محمد', score: 95, tasksCompleted: 45, trend: 'up', badge: 'trophy' },
    { rank: 2, employeeName: 'سارة أحمد', score: 88, tasksCompleted: 42, trend: 'up', badge: 'medal' },
    { rank: 3, employeeName: 'محمد علي', score: 82, tasksCompleted: 38, trend: 'stable', badge: 'medal' },
    { rank: 4, employeeName: 'فاطمة حسن', score: 78, tasksCompleted: 35, trend: 'down' },
    { rank: 5, employeeName: 'عمر خالد', score: 72, tasksCompleted: 30, trend: 'up' },
  ],
  goals: [
    { id: 'g1', title: 'عملاء واتساب الأسبوعي', target: 100, current: 149, unit: 'عميل', percentage: 149, status: 'exceeded' },
    { id: 'g2', title: 'معدل الإنجاز', target: 80, current: 71, unit: '%', percentage: 88.75, status: 'at_risk' },
    { id: 'g3', title: 'زمن الرد', target: 15, current: 17, unit: 'دقيقة', percentage: 88.2, status: 'at_risk' },
    { id: 'g4', title: 'معدل فتح البريد', target: 25, current: 28, unit: '%', percentage: 112, status: 'exceeded' },
  ],
  sentimentGauge: {
    overall: 'positive',
    score: 72,
    breakdown: { positive: 72, neutral: 18, negative: 10 },
    trend: 'improving',
    topPositiveTopics: ['جودة المحتوى', 'سرعة الرد صباحاً', 'وضوح المعلومات'],
    topNegativeTopics: ['تأخر الرد مساءً', 'ارتباك الأسعار', 'مشاكل الدفع'],
  },
  activityHeatmap: {
    title: 'نشاط واتساب الأسبوعي',
    type: 'weekly',
    data: [
      { label: 'السبت', value: 82, intensity: 0.6 },
      { label: 'الأحد', value: 75, intensity: 0.55 },
      { label: 'الاثنين', value: 134, intensity: 1 },
      { label: 'الثلاثاء', value: 95, intensity: 0.7 },
      { label: 'الأربعاء', value: 88, intensity: 0.65 },
      { label: 'الخميس', value: 103, intensity: 0.75 },
      { label: 'الجمعة', value: 42, intensity: 0.3 },
    ],
  },
  recommendations: [
    {
      id: 'r1',
      priority: 1,
      category: 'immediate',
      title: 'تعزيز المناوبات المسائية',
      description: 'إضافة موظف للرد على الاستفسارات من 6-10 مساءً',
      expectedImpact: 'تقليل وقت الرد بنسبة 40%',
      relatedMetrics: ['avgResponseTime'],
      confidence: 92,
    },
    {
      id: 'r2',
      priority: 2,
      category: 'short_term',
      title: 'تحديث صفحة الأسعار',
      description: 'توضيح الفرق بين رسوم الكورس ورسوم الجامعة',
      expectedImpact: 'تقليل استفسارات الأسعار بنسبة 30%',
      relatedMetrics: ['customerSatisfaction'],
      confidence: 85,
    },
    {
      id: 'r3',
      priority: 3,
      category: 'short_term',
      title: 'إنشاء فيديو تعريفي لدبلومة AI',
      description: 'فيديو 3 دقائق يشرح تفاصيل الدبلومة',
      expectedImpact: 'زيادة التحويلات بنسبة 15%',
      relatedMetrics: ['conversionRate'],
      confidence: 78,
    },
  ],
  predictions: [
    {
      id: 'p1',
      metric: 'عملاء واتساب',
      currentValue: 149,
      predictedValue: 180,
      predictedDate: '2025-01-17',
      confidence: 75,
      trend: 'up',
      reasoning: 'استمرار الحملات الإعلانية وموسم التسجيل',
    },
    {
      id: 'p2',
      metric: 'معدل الإنجاز',
      currentValue: 71,
      predictedValue: 75,
      predictedDate: '2025-01-17',
      confidence: 68,
      trend: 'up',
      reasoning: 'تحسن متوقع مع تطبيق التوصيات',
    },
  ],
};
