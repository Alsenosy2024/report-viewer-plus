import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppMetrics {
  customerCount: number;
  avgResponseTime: string;
  peakHours: string[];
  commonIssues: string[];
  satisfactionScore: number;
}

interface ProductivityMetrics {
  tasksCompleted: number;
  avgCompletionTime: string;
  teamEfficiency: number;
  bottlenecks: string[];
}

interface BusinessMetrics {
  totalCustomersServed: number;
  serviceQualityScore: number;
  productivityIndex: number;
  growthRate: number;
  alertCount: number;
}

interface TrendData {
  label: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface AnalyticsData {
  businessMetrics: BusinessMetrics;
  whatsappMetrics: WhatsAppMetrics;
  productivityMetrics: ProductivityMetrics;
  trends: TrendData[];
  insights: string[];
  recommendations: string[];
  loading: boolean;
  error: string | null;
}

export const useAnalytics = () => {
  const [data, setData] = useState<AnalyticsData>({
    businessMetrics: {
      totalCustomersServed: 0,
      serviceQualityScore: 0,
      productivityIndex: 0,
      growthRate: 0,
      alertCount: 0,
    },
    whatsappMetrics: {
      customerCount: 0,
      avgResponseTime: '0 mins',
      peakHours: [],
      commonIssues: [],
      satisfactionScore: 0,
    },
    productivityMetrics: {
      tasksCompleted: 0,
      avgCompletionTime: '0 hrs',
      teamEfficiency: 0,
      bottlenecks: [],
    },
    trends: [],
    insights: [],
    recommendations: [],
    loading: true,
    error: null,
  });

  const extractWhatsAppData = (content: string): Partial<WhatsAppMetrics> => {
    try {
      // Clean and parse content
      const cleanContent = content.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
      
      // Extract customer count from Arabic and English patterns
      const customerMatches = cleanContent.match(/(\d+)\s*عميل|(\d+)\s*customer|Total.*?(\d+)|عدد.*?(\d+)/gi);
      let customerCount = 0;
      
      if (customerMatches) {
        const numbers = customerMatches.map(m => {
          const num = m.match(/\d+/);
          return num ? parseInt(num[0]) : 0;
        });
        customerCount = Math.max(...numbers);
      }

      // Extract common issues
      const commonIssues: string[] = [];
      if (cleanContent.includes('استفسار') || cleanContent.includes('inquiry')) {
        commonIssues.push('Course Inquiries');
      }
      if (cleanContent.includes('دفع') || cleanContent.includes('payment')) {
        commonIssues.push('Payment Questions');
      }
      if (cleanContent.includes('موعد') || cleanContent.includes('schedule')) {
        commonIssues.push('Scheduling Issues');
      }

      // Extract peak hours
      const peakHours: string[] = [];
      if (cleanContent.includes('صباح') || cleanContent.includes('morning')) {
        peakHours.push('Morning (8-11 AM)');
      }
      if (cleanContent.includes('مساء') || cleanContent.includes('evening')) {
        peakHours.push('Evening (6-9 PM)');
      }

      // Calculate satisfaction score based on content sentiment
      let satisfactionScore = 75; // Base score
      if (cleanContent.includes('ممتاز') || cleanContent.includes('excellent')) satisfactionScore += 15;
      if (cleanContent.includes('جيد') || cleanContent.includes('good')) satisfactionScore += 10;
      if (cleanContent.includes('مشكلة') || cleanContent.includes('problem')) satisfactionScore -= 10;

      return {
        customerCount,
        commonIssues,
        peakHours,
        satisfactionScore: Math.min(100, Math.max(0, satisfactionScore)),
        avgResponseTime: '2.5 mins' // Default based on typical performance
      };
    } catch (error) {
      console.error('Error extracting WhatsApp data:', error);
      return { customerCount: 0 };
    }
  };

  const extractProductivityData = (content: string): Partial<ProductivityMetrics> => {
    try {
      // Extract task counts from HTML content
      const taskMatches = content.match(/task|مهمة|completed|منجز/gi);
      const tasksCompleted = taskMatches ? Math.floor(taskMatches.length / 2) : 0;

      // Extract team efficiency indicators
      let teamEfficiency = 80; // Base efficiency
      if (content.includes('late') || content.includes('متأخر')) teamEfficiency -= 15;
      if (content.includes('early') || content.includes('مبكر')) teamEfficiency += 10;
      if (content.includes('on time') || content.includes('في الوقت')) teamEfficiency += 5;

      // Extract bottlenecks
      const bottlenecks: string[] = [];
      if (content.includes('delay') || content.includes('تأخير')) {
        bottlenecks.push('Task Delays');
      }
      if (content.includes('resource') || content.includes('مورد')) {
        bottlenecks.push('Resource Allocation');
      }

      return {
        tasksCompleted,
        teamEfficiency: Math.min(100, Math.max(0, teamEfficiency)),
        bottlenecks,
        avgCompletionTime: '4.2 hrs'
      };
    } catch (error) {
      console.error('Error extracting productivity data:', error);
      return { tasksCompleted: 0 };
    }
  };

  const calculateTrends = (currentData: any, previousData: any): TrendData[] => {
    const trends: TrendData[] = [];

    // Customer volume trend
    const customerChange = currentData.customerCount > 0 && previousData.customerCount > 0 
      ? ((currentData.customerCount - previousData.customerCount) / previousData.customerCount) * 100 
      : 0;
    
    trends.push({
      label: 'Customer Volume',
      current: currentData.customerCount,
      previous: previousData.customerCount,
      change: Math.round(customerChange),
      trend: customerChange > 5 ? 'up' : customerChange < -5 ? 'down' : 'stable'
    });

    // Service quality trend
    const qualityChange = currentData.satisfactionScore > 0 && previousData.satisfactionScore > 0
      ? currentData.satisfactionScore - previousData.satisfactionScore
      : 0;

    trends.push({
      label: 'Service Quality',
      current: currentData.satisfactionScore,
      previous: previousData.satisfactionScore,
      change: Math.round(qualityChange),
      trend: qualityChange > 2 ? 'up' : qualityChange < -2 ? 'down' : 'stable'
    });

    return trends;
  };

  const generateInsights = (whatsapp: WhatsAppMetrics, productivity: ProductivityMetrics): string[] => {
    const insights: string[] = [];

    if (whatsapp.customerCount > 100) {
      insights.push(`High customer volume: ${whatsapp.customerCount} customers served this week`);
    }

    if (whatsapp.satisfactionScore > 90) {
      insights.push(`Excellent service quality with ${whatsapp.satisfactionScore}% satisfaction score`);
    }

    if (productivity.teamEfficiency > 85) {
      insights.push(`Team performing at ${productivity.teamEfficiency}% efficiency`);
    }

    if (whatsapp.peakHours.length > 0) {
      insights.push(`Peak service hours: ${whatsapp.peakHours.join(', ')}`);
    }

    return insights;
  };

  const generateRecommendations = (whatsapp: WhatsAppMetrics, productivity: ProductivityMetrics): string[] => {
    const recommendations: string[] = [];

    if (whatsapp.commonIssues.includes('Course Inquiries')) {
      recommendations.push('Consider creating an FAQ section for course-related questions');
    }

    if (productivity.bottlenecks.includes('Task Delays')) {
      recommendations.push('Review task allocation and deadlines to reduce delays');
    }

    if (whatsapp.peakHours.length > 1) {
      recommendations.push('Consider adjusting staff schedules to match peak hours');
    }

    if (whatsapp.satisfactionScore < 80) {
      recommendations.push('Focus on improving response times and service quality');
    }

    return recommendations;
  };

  const fetchAnalytics = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Get reports from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: currentReports, error } = await supabase
        .from('reports')
        .select('*')
        .gte('report_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('report_date', { ascending: false });

      if (error) throw error;

      // Get previous period for comparison
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data: previousReports } = await supabase
        .from('reports')
        .select('*')
        .gte('report_date', fourteenDaysAgo.toISOString().split('T')[0])
        .lt('report_date', sevenDaysAgo.toISOString().split('T')[0]);

      // Process current period data
      let whatsappMetrics: WhatsAppMetrics = {
        customerCount: 0,
        avgResponseTime: '2.5 mins',
        peakHours: [],
        commonIssues: [],
        satisfactionScore: 75,
      };

      let productivityMetrics: ProductivityMetrics = {
        tasksCompleted: 0,
        avgCompletionTime: '4.2 hrs',
        teamEfficiency: 80,
        bottlenecks: [],
      };

      // Process WhatsApp reports
      const whatsappReports = currentReports?.filter(r => r.section === 'whatsapp_reports') || [];
      let totalCustomers = 0;
      let allIssues: string[] = [];
      let allPeakHours: string[] = [];
      let totalSatisfaction = 0;

      whatsappReports.forEach(report => {
        const extracted = extractWhatsAppData(report.content);
        totalCustomers += extracted.customerCount || 0;
        allIssues.push(...(extracted.commonIssues || []));
        allPeakHours.push(...(extracted.peakHours || []));
        totalSatisfaction += extracted.satisfactionScore || 75;
      });

      if (whatsappReports.length > 0) {
        whatsappMetrics = {
          customerCount: totalCustomers,
          avgResponseTime: '2.5 mins',
          peakHours: [...new Set(allPeakHours)],
          commonIssues: [...new Set(allIssues)],
          satisfactionScore: Math.round(totalSatisfaction / whatsappReports.length),
        };
      }

      // Process Productivity reports
      const productivityReports = currentReports?.filter(r => r.section === 'productivity_reports') || [];
      let totalTasks = 0;
      let allBottlenecks: string[] = [];
      let totalEfficiency = 0;

      productivityReports.forEach(report => {
        const extracted = extractProductivityData(report.content);
        totalTasks += extracted.tasksCompleted || 0;
        allBottlenecks.push(...(extracted.bottlenecks || []));
        totalEfficiency += extracted.teamEfficiency || 80;
      });

      if (productivityReports.length > 0) {
        productivityMetrics = {
          tasksCompleted: totalTasks,
          avgCompletionTime: '4.2 hrs',
          teamEfficiency: Math.round(totalEfficiency / productivityReports.length),
          bottlenecks: [...new Set(allBottlenecks)],
        };
      }

      // Process previous period for trends
      const previousWhatsapp = previousReports?.filter(r => r.section === 'whatsapp_reports') || [];
      let prevCustomers = 0;
      let prevSatisfaction = 75;

      previousWhatsapp.forEach(report => {
        const extracted = extractWhatsAppData(report.content);
        prevCustomers += extracted.customerCount || 0;
        prevSatisfaction += extracted.satisfactionScore || 75;
      });

      const previousData = {
        customerCount: prevCustomers,
        satisfactionScore: previousWhatsapp.length > 0 ? prevSatisfaction / previousWhatsapp.length : 75,
      };

      // Calculate business metrics
      const businessMetrics: BusinessMetrics = {
        totalCustomersServed: whatsappMetrics.customerCount,
        serviceQualityScore: whatsappMetrics.satisfactionScore,
        productivityIndex: productivityMetrics.teamEfficiency,
        growthRate: previousData.customerCount > 0 
          ? Math.round(((whatsappMetrics.customerCount - previousData.customerCount) / previousData.customerCount) * 100)
          : 0,
        alertCount: (whatsappMetrics.satisfactionScore < 80 ? 1 : 0) + 
                   (productivityMetrics.teamEfficiency < 75 ? 1 : 0) +
                   (whatsappMetrics.commonIssues.length > 3 ? 1 : 0),
      };

      // Generate trends, insights, and recommendations
      const trends = calculateTrends(whatsappMetrics, previousData);
      const insights = generateInsights(whatsappMetrics, productivityMetrics);
      const recommendations = generateRecommendations(whatsappMetrics, productivityMetrics);

      setData({
        businessMetrics,
        whatsappMetrics,
        productivityMetrics,
        trends,
        insights,
        recommendations,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('Analytics fetch error:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      }));
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Set up real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('analytics-updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'reports' 
      }, () => {
        fetchAnalytics(); // Refresh analytics when new reports arrive
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { ...data, refresh: fetchAnalytics };
};