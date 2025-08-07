import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, RefreshCw, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KeyMetric {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
}

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
    }>;
  };
}

interface HeatmapData {
  title: string;
  data: Array<{
    day: string;
    value: number;
    color: string;
  }>;
}

interface OverviewData {
  overview: string;
  keyMetrics?: KeyMetric[];
  charts?: ChartData[];
  heatmapData?: HeatmapData;
  recommendations?: string[];
  lastReportDate?: string;
  reportsCount?: number;
  fromCache?: boolean;
}

const WeeklyOverview: React.FC = () => {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStoredOverview = async () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('weekly_analyses')
      .select('*')
      .eq('week_start', weekStart.toISOString().split('T')[0])
      .single();

    if (data && !error) {
      const analysisData = data.analysis_data as any;
      setOverviewData({
        overview: analysisData.overview || 'لا توجد بيانات متاحة',
        keyMetrics: analysisData.keyMetrics || [],
        charts: analysisData.charts || [],
        heatmapData: analysisData.heatmapData,
        recommendations: analysisData.recommendations || [],
        lastReportDate: data.created_at,
        reportsCount: data.reports_count,
        fromCache: true
      });
      return true;
    }
    return false;
  };

  const generateOverview = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-overview');
      
      if (error) {
        throw error;
      }

      setOverviewData(data);
      toast({
        title: data.fromCache ? "تم تحميل النظرة العامة" : "تم إنشاء النظرة العامة بنجاح",
        description: data.fromCache ? "تم استرجاع التحليل المحفوظ" : "تم تحليل جميع تقارير الأسبوع",
      });
    } catch (error) {
      console.error('Error generating overview:', error);
      toast({
        title: "خطأ في إنشاء النظرة العامة",
        description: "حدث خطأ أثناء تحليل التقارير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadOverview = async () => {
      const hasStoredData = await fetchStoredOverview();
      if (!hasStoredData) {
        generateOverview();
      }
    };
    loadOverview();
  }, []);

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderChart = (chart: ChartData, index: number) => {
    const chartData = chart.data.labels.map((label, i) => ({
      name: label,
      value: chart.data.datasets[0]?.data[i] || 0
    }));

    // Ensure we have valid colors with proper fallbacks
    const defaultColors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
      '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
    ];
    
    const rawColors = chart.data.datasets[0]?.backgroundColor;
    let colors: string[];
    
    if (Array.isArray(rawColors)) {
      colors = rawColors.map(color => 
        color && typeof color === 'string' && color.trim() !== '' ? color : defaultColors[0]
      );
    } else if (rawColors && typeof rawColors === 'string' && rawColors.trim() !== '') {
      colors = [rawColors];
    } else {
      colors = defaultColors;
    }

    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill={colors[0] || defaultColors[0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="value" stroke={colors[0] || defaultColors[0]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
      case 'doughnut':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={chart.type === 'doughnut' ? 60 : 0}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={colors[i % colors.length] || defaultColors[i % defaultColors.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            النظرة العامة الأسبوعية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="mr-2">جاري تحليل التقارير...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              النظرة العامة الأسبوعية
            </CardTitle>
            <Button onClick={generateOverview} disabled={loading} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              آخر تقرير: {formatDate(overviewData?.lastReportDate)}
            </div>
            <div className="flex gap-2">
              {overviewData?.reportsCount && (
                <Badge variant="secondary">
                  {overviewData.reportsCount} تقرير هذا الأسبوع
                </Badge>
              )}
              {overviewData?.fromCache && (
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  محفوظ مسبقاً
                </Badge>
              )}
            </div>
            <p className="text-foreground">{overviewData?.overview}</p>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {overviewData?.keyMetrics && overviewData.keyMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewData.keyMetrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{metric.value}</p>
                    {metric.change && (
                      <span className={`text-sm ${
                        metric.trend === 'up' ? 'text-green-600' : 
                        metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.change}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts */}
      {overviewData?.charts && overviewData.charts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {overviewData.charts.map((chart, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{chart.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}}>
                  {renderChart(chart, index)}
                </ChartContainer>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Heatmap */}
      {overviewData?.heatmapData && overviewData.heatmapData.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{overviewData.heatmapData.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {overviewData.heatmapData.data.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg text-center text-sm font-medium text-white"
                  style={{ backgroundColor: item.color }}
                >
                  <div>{item.day}</div>
                  <div className="text-xs mt-1">{item.value}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {overviewData?.recommendations && overviewData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>التوصيات</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {overviewData.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WeeklyOverview;