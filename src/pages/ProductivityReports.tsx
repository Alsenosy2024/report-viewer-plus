import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, TrendingUp, TrendingDown, Users, Target, CheckCircle, AlertCircle, BarChart3, Activity, Zap, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductivityReport {
  id: string;
  report_date: string;
  content: string;
  created_at: string;
  updated_at: string;
  content_type: string;
}

interface ProcessedProductivityData {
  summary?: string;
  analysis?: string;
  metrics?: {
    efficiency_score?: number;
    tasks_completed?: number;
    response_time?: string;
    team_performance?: number;
    goal_achievement?: number;
  };
  insights?: string[];
  recommendations?: string[];
  trends?: {
    weekly_performance?: number;
    monthly_growth?: number;
    productivity_trend?: 'up' | 'down' | 'stable';
  };
  original?: string;
}

const ProductivityReports = () => {
  const [reports, setReports] = useState<ProductivityReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ProductivityReport | null>(null);
  const [processedContent, setProcessedContent] = useState<ProcessedProductivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('section', 'productivity_reports')
        .order('report_date', { ascending: false });

      if (error) throw error;
      setReports(data || []);
      
      if (data && data.length > 0) {
        setSelectedReport(data[0]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch productivity reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processReport = async (report: ProductivityReport) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-whatsapp-reports', {
        body: { content: report.content, type: 'productivity' }
      });

      if (error) throw error;

      setProcessedContent(data);
      toast({
        title: "Success",
        description: "Productivity report processed successfully",
      });
    } catch (error) {
      console.error('Error processing report:', error);
      toast({
        title: "Error",
        description: "Failed to process productivity report with AI",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Productivity Reports</h1>
              <p className="text-muted-foreground mt-2">Monitor team performance and productivity metrics</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Productivity Reports</h1>
            <p className="text-muted-foreground mt-2">
              Monitor team performance, efficiency metrics, and productivity insights
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="px-3 py-1">
              <BarChart3 className="w-3 h-3 mr-1" />
              {reports.length} Reports
            </Badge>
          </div>
        </div>

        {reports.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No Productivity Reports Found</h3>
                  <p className="text-muted-foreground mt-1">
                    Productivity reports will appear here once they are available.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Reports List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reports</CardTitle>
                  <CardDescription>Select a report to view details</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className={`p-4 border-b cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedReport?.id === report.id ? 'bg-muted/80 border-l-4 border-l-primary' : ''
                        }`}
                        onClick={() => setSelectedReport(report)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(report.report_date)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {report.content.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report Details */}
            <div className="lg:col-span-3">
              {selectedReport && (
                <Tabs defaultValue="overview" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="analysis">Analysis</TabsTrigger>
                      <TabsTrigger value="raw">Raw Data</TabsTrigger>
                    </TabsList>
                    <Button 
                      onClick={() => processReport(selectedReport)} 
                      disabled={processing}
                      size="sm"
                    >
                      {processing ? (
                        <>
                          <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Process with AI
                        </>
                      )}
                    </Button>
                  </div>

                  <TabsContent value="overview" className="space-y-6">
                    {/* Metrics Cards */}
                    {processedContent?.metrics && (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Efficiency Score</p>
                                <p className={`text-2xl font-bold ${getPerformanceColor(processedContent.metrics.efficiency_score || 0)}`}>
                                  {processedContent.metrics.efficiency_score || 0}%
                                </p>
                              </div>
                              <Target className="w-8 h-8 text-blue-500" />
                            </div>
                            {processedContent.metrics.efficiency_score && (
                              <Progress value={processedContent.metrics.efficiency_score} className="mt-3" />
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
                                <p className="text-2xl font-bold">{processedContent.metrics.tasks_completed || 0}</p>
                              </div>
                              <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                                <p className="text-2xl font-bold">{processedContent.metrics.response_time || 'N/A'}</p>
                              </div>
                              <Clock className="w-8 h-8 text-orange-500" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Team Performance</p>
                                <p className={`text-2xl font-bold ${getPerformanceColor(processedContent.metrics.team_performance || 0)}`}>
                                  {processedContent.metrics.team_performance || 0}%
                                </p>
                              </div>
                              <Users className="w-8 h-8 text-purple-500" />
                            </div>
                            {processedContent.metrics.team_performance && (
                              <Progress value={processedContent.metrics.team_performance} className="mt-3" />
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Summary */}
                    {processedContent?.summary && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5" />
                            Executive Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed">{processedContent.summary}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Trends */}
                    {processedContent?.trends && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {getTrendIcon(processedContent.trends.productivity_trend || 'stable')}
                            Performance Trends
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 md:grid-cols-3">
                            {processedContent.trends.weekly_performance && (
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Weekly Performance</p>
                                <p className={`text-xl font-bold ${getPerformanceColor(processedContent.trends.weekly_performance)}`}>
                                  {processedContent.trends.weekly_performance}%
                                </p>
                              </div>
                            )}
                            {processedContent.trends.monthly_growth && (
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Monthly Growth</p>
                                <p className={`text-xl font-bold ${processedContent.trends.monthly_growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {processedContent.trends.monthly_growth > 0 ? '+' : ''}{processedContent.trends.monthly_growth}%
                                </p>
                              </div>
                            )}
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Trend Direction</p>
                              <div className="flex items-center justify-center mt-1">
                                {getTrendIcon(processedContent.trends.productivity_trend || 'stable')}
                                <span className="ml-2 font-medium capitalize">
                                  {processedContent.trends.productivity_trend || 'Stable'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="analysis" className="space-y-6">
                    {processedContent ? (
                      <div className="space-y-6">
                        {/* Analysis */}
                        {processedContent.analysis && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Detailed Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {processedContent.analysis}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Insights */}
                        {processedContent.insights && processedContent.insights.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Key Insights
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2">
                                {processedContent.insights.map((insight, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                    <span className="text-sm">{insight}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                        {/* Recommendations */}
                        {processedContent.recommendations && processedContent.recommendations.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Recommendations
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-3">
                                {processedContent.recommendations.map((recommendation, index) => (
                                  <li key={index} className="flex items-start gap-3">
                                    <Badge variant="secondary" className="min-w-fit">
                                      {index + 1}
                                    </Badge>
                                    <span className="text-sm">{recommendation}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <Card className="text-center py-12">
                        <CardContent>
                          <div className="flex flex-col items-center space-y-4">
                            <Zap className="w-12 h-12 text-muted-foreground" />
                            <div>
                              <h3 className="text-lg font-semibold">No Analysis Available</h3>
                              <p className="text-muted-foreground mt-1">
                                Click "Process with AI" to generate detailed analysis and insights.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="raw">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Raw Report Content</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-60 overflow-y-auto">
                          <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg break-words leading-relaxed" dir="auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            {selectedReport?.content || 'No content available'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProductivityReports;