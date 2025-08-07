import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Send, CheckCircle, XCircle, Clock, Eye, X, Brain, TrendingUp, AlertTriangle, Target, BarChart3, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const WhatsAppReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWhatsAppReports();
  }, []);

  const fetchWhatsAppReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('section', 'whatsapp_reports')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching WhatsApp reports:', error);
        toast({
          title: "Error fetching reports",
          description: "Failed to load WhatsApp reports data",
          variant: "destructive"
        });
        return;
      }

      setReports(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processWithDeepseek = async (reportId: string) => {
    try {
      setProcessing(reportId);
      
      const { data, error } = await supabase.functions.invoke('process-whatsapp-reports', {
        body: { reportId }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Report Processed",
          description: "WhatsApp report has been analyzed with Deepseek R1",
        });
        
        // Refresh reports to show updated content
        await fetchWhatsAppReports();
      } else {
        throw new Error(data.error || 'Failed to process report');
      }
    } catch (error) {
      console.error('Error processing report:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process report with Deepseek R1",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const isProcessedReport = (report: any) => {
    return report.content_type === 'processed_analysis';
  };

  const getProcessedContent = (report: any) => {
    try {
      return JSON.parse(report.content);
    } catch {
      return null;
    }
  };

  const statsCards = [
    {
      title: 'Total Messages',
      value: '2,847',
      change: '+12.5%',
      icon: MessageSquare,
      color: 'text-dashboard-primary'
    },
    {
      title: 'Active Contacts',
      value: '1,234',
      change: '+8.2%',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Messages Sent',
      value: '1,956',
      change: '+15.3%',
      icon: Send,
      color: 'text-blue-600'
    },
    {
      title: 'Delivery Rate',
      value: '98.7%',
      change: '+2.1%',
      icon: CheckCircle,
      color: 'text-green-500'
    }
  ];

  const recentMessages = [
    {
      id: 1,
      contact: 'John Smith',
      message: 'Thank you for the quick response!',
      time: '2 minutes ago',
      status: 'delivered',
      type: 'received'
    },
    {
      id: 2,
      contact: 'Sarah Johnson',
      message: 'Meeting confirmed for tomorrow',
      time: '5 minutes ago',
      status: 'read',
      type: 'sent'
    },
    {
      id: 3,
      contact: 'Mike Wilson',
      message: 'Can you send me the project details?',
      time: '12 minutes ago',
      status: 'delivered',
      type: 'received'
    },
    {
      id: 4,
      contact: 'Emma Davis',
      message: 'Project update has been sent',
      time: '25 minutes ago',
      status: 'read',
      type: 'sent'
    },
    {
      id: 5,
      contact: 'Alex Brown',
      message: 'Thanks for the information',
      time: '1 hour ago',
      status: 'pending',
      type: 'sent'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'read':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-3 h-3" />;
      case 'read':
        return <CheckCircle className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'failed':
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading WhatsApp reports...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">WhatsApp Reports</h1>
            <p className="text-muted-foreground mt-2">Monitor your WhatsApp messaging activity and engagement</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No WhatsApp Reports Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                There are no WhatsApp reports in your database yet. Reports will appear here once they are added to the system.
              </p>
              <Badge variant="outline" className="text-sm">
                Section: whatsapp_reports
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Database Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Database Reports</CardTitle>
                <CardDescription>Reports from your Supabase database</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.map((report) => {
                    const processedContent = getProcessedContent(report);
                    const isProcessed = isProcessedReport(report);
                    
                    return (
                      <div key={report.id} className={`p-4 rounded-lg border transition-all duration-300 ${
                        isProcessed 
                          ? 'border-primary/20 bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10' 
                          : 'border-border hover:bg-muted/50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">
                              Report #{report.id.slice(0, 8)}
                            </p>
                            {isProcessed && (
                              <Badge variant="default" className="text-xs bg-primary/10 text-primary border-primary/20">
                                <Brain className="w-3 h-3 mr-1" />
                                AI Analyzed
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {new Date(report.created_at).toLocaleDateString()}
                            </Badge>
                            {isProcessed ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => processWithDeepseek(report.id)}
                                disabled={processing === report.id}
                                className="h-7 px-2 text-xs"
                                title="إعادة تحليل التقرير"
                              >
                                {processing === report.id ? (
                                  <>
                                    <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full mr-1" />
                                    جاري المعالجة...
                                  </>
                                ) : (
                                  <>
                                    <Brain className="w-3 h-3 mr-1" />
                                    إعادة تحليل
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => processWithDeepseek(report.id)}
                                disabled={processing === report.id}
                                className="h-7 px-2 text-xs"
                              >
                                {processing === report.id ? (
                                  <>
                                    <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full mr-1" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <Brain className="w-3 h-3 mr-1" />
                                    Analyze
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report);
                                setDialogOpen(true);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {isProcessed && processedContent?.analysis ? (
                          <div className="space-y-3" dir="rtl">
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                الملخص التنفيذي
                              </h4>
                              <p className="text-sm text-muted-foreground text-right">
                                {processedContent.analysis.executiveSummary || 'ملخص التحليل غير متوفر'}
                              </p>
                            </div>
                            
                            {processedContent.analysis.performanceMetrics?.length > 0 && (
                              <div className="grid grid-cols-2 gap-2">
                                {processedContent.analysis.performanceMetrics.slice(0, 4).map((metric: any, idx: number) => (
                                  <div key={idx} className="p-2 bg-background/50 rounded border">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium">{metric.metric}</span>
                                      <Badge variant={metric.trend === 'positive' ? 'default' : metric.trend === 'negative' ? 'destructive' : 'secondary'} className="text-xs">
                                        {metric.value}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {typeof report.content === 'string' ? report.content : JSON.stringify(report.content).substring(0, 100) + '...'}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-3">
                          <Badge variant="secondary" className="text-xs">
                            {isProcessed ? 'AI Processed' : report.content_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.report_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Messages */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
                <CardDescription>Latest WhatsApp message activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">
                            {message.contact}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusColor(message.status)}`}
                            >
                              {getStatusIcon(message.status)}
                              <span className="ml-1 capitalize">{message.status}</span>
                            </Badge>
                            <Badge variant={message.type === 'sent' ? 'default' : 'secondary'} className="text-xs">
                              {message.type}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {message.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">{message.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Message Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Message Analytics</CardTitle>
            <CardDescription>Performance metrics for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Successful Deliveries</p>
                    <p className="text-xs text-muted-foreground">2,810 messages</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">98.7%</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Pending Messages</p>
                    <p className="text-xs text-muted-foreground">25 messages</p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">0.9%</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Failed Messages</p>
                    <p className="text-xs text-muted-foreground">12 messages</p>
                  </div>
                </div>
                <Badge className="bg-red-100 text-red-800 border-red-200">0.4%</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Average Response Time</p>
                    <p className="text-xs text-muted-foreground">Last 7 days</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">2.3 min</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Viewer Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>WhatsApp Report Analysis</span>
                  {selectedReport && isProcessedReport(selectedReport) && (
                    <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                      <Brain className="w-3 h-3 mr-1" />
                      AI Processed
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDialogOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[75vh] w-full">
              <div className="p-6 space-y-6">
                {selectedReport && isProcessedReport(selectedReport) ? (
                  // Processed Report View
                  (() => {
                    const processedContent = getProcessedContent(selectedReport);
                    const analysis = processedContent?.analysis;
                    
                    if (!analysis) {
                      return (
                        <div className="text-center py-8">
                          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                          <p className="text-muted-foreground">Analysis data could not be loaded</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-6">
                         {/* Executive Summary */}
                        <Card className="border-primary/20" dir="rtl">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary">
                              <TrendingUp className="w-5 h-5" />
                              الملخص التنفيذي
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-foreground leading-relaxed text-right">{analysis.executiveSummary}</p>
                          </CardContent>
                        </Card>

                         {/* Performance Metrics */}
                        {analysis.performanceMetrics?.length > 0 && (
                          <Card dir="rtl">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-500" />
                                مقاييس الأداء
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid gap-4 md:grid-cols-2">
                                {analysis.performanceMetrics.map((metric: any, idx: number) => (
                                  <div key={idx} className="p-4 border rounded-lg bg-muted/30">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold text-sm text-right">{metric.metric}</h4>
                                      <Badge variant={metric.trend === 'positive' ? 'default' : metric.trend === 'negative' ? 'destructive' : 'secondary'}>
                                        {metric.value}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right">{metric.description}</p>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                         {/* Trends & Patterns */}
                        {analysis.trendsAndPatterns?.length > 0 && (
                          <Card dir="rtl">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                الاتجاهات والأنماط
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {analysis.trendsAndPatterns.map((trend: any, idx: number) => (
                                  <div key={idx} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold text-right">{trend.title}</h4>
                                      <Badge variant={trend.impact === 'high' ? 'destructive' : trend.impact === 'medium' ? 'default' : 'secondary'}>
                                        {trend.impact === 'high' ? 'تأثير عالي' : trend.impact === 'medium' ? 'تأثير متوسط' : 'تأثير منخفض'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground text-right">{trend.description}</p>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                         {/* Recommendations */}
                        {analysis.recommendations?.length > 0 && (
                          <Card dir="rtl">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-purple-500" />
                                التوصيات القابلة للتنفيذ
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {analysis.recommendations.map((rec: any, idx: number) => (
                                  <div key={idx} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                                        {rec.priority === 'high' ? 'أولوية عالية' : rec.priority === 'medium' ? 'أولوية متوسطة' : 'أولوية منخفضة'}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">{rec.timeframe}</span>
                                    </div>
                                    <h4 className="font-semibold mb-1 text-right">{rec.action}</h4>
                                    <p className="text-sm text-muted-foreground text-right">{rec.expectedImpact}</p>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                         {/* Risk Assessment */}
                        {analysis.riskAssessment && (
                          <Card className="border-yellow-200" dir="rtl">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                تقييم المخاطر
                                <Badge variant={analysis.riskAssessment.overallRisk === 'high' ? 'destructive' : 'secondary'}>
                                  {analysis.riskAssessment.level === 'high' ? 'مخاطر عالية' : analysis.riskAssessment.level === 'medium' ? 'مخاطر متوسطة' : 'مخاطر منخفضة'}
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {analysis.riskAssessment.factors?.length > 0 && (
                                <div className="space-y-3">
                                  {analysis.riskAssessment.factors.map((factor: string, idx: number) => (
                                    <div key={idx} className="p-3 border rounded-lg bg-yellow-50/50">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-right">{factor}</span>
                                      </div>
                                    </div>
                                  ))}
                                  {analysis.riskAssessment.mitigation && (
                                    <div className="mt-4 p-3 border rounded-lg bg-blue-50/50">
                                      <h5 className="font-medium mb-2 text-right">استراتيجية التخفيف:</h5>
                                      <p className="text-sm text-muted-foreground text-right">{analysis.riskAssessment.mitigation}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}

                         {/* Original Report */}
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">Original Report Data</CardTitle>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDialogOpen(false);
                                  processWithDeepseek(selectedReport.id);
                                }}
                                disabled={processing === selectedReport?.id}
                                className="h-8 px-3 text-xs"
                              >
                                {processing === selectedReport?.id ? (
                                  <>
                                    <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full mr-1" />
                                    إعادة المعالجة...
                                  </>
                                ) : (
                                  <>
                                    <Brain className="w-3 h-3 mr-1" />
                                    إعادة تحليل
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <pre className="whitespace-pre-wrap text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto max-h-40">
                              {processedContent?.original || 'Original content not available'}
                            </pre>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()
                ) : (
                  // Original Report View
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Report ID:</span>
                        <Badge variant="outline">{selectedReport?.id}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Created:</span>
                        <span>{selectedReport?.created_at ? new Date(selectedReport.created_at).toLocaleString() : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Type:</span>
                        <Badge variant="secondary">{selectedReport?.content_type}</Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center p-6 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                      <div className="text-center">
                        <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">This report hasn't been processed with AI yet</p>
                        <Button
                          onClick={() => {
                            setDialogOpen(false);
                            processWithDeepseek(selectedReport.id);
                          }}
                          disabled={processing === selectedReport?.id}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {processing === selectedReport?.id ? (
                            <>
                              <div className="animate-spin w-4 h-4 border border-current border-t-transparent rounded-full mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4 mr-2" />
                              Analyze with Deepseek R1
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Raw Report Content</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg overflow-x-auto">
                          {selectedReport?.content}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppReports;