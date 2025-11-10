import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Brain, TrendingUp, AlertTriangle, Target, BarChart3, Eye, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import DOMPurify from 'dompurify';
import { withPageAccessibility } from '@/lib/withPageAccessibility';

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
            <p className="text-muted-foreground mt-2">Monitor your WhatsApp messaging activity and reports</p>
          </div>
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
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Reports Database</CardTitle>
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
                                    <span className="text-xs font-medium text-right">{metric.metric}</span>
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
        )}

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
                            <div className="max-h-60 overflow-y-auto">
                              <div className="text-sm bg-muted p-4 rounded-lg leading-relaxed break-words" dir="rtl" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(((processedContent?.original || selectedReport?.content || 'Original content not available') as string).replace(/\n/g, '<br/>')) }} />
                              </div>
                            </div>
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
                        <div className="max-h-60 overflow-y-auto">
                          {selectedReport?.content_type === 'html' ? (
                            <div className="text-sm bg-muted p-4 rounded-lg leading-relaxed break-words" dir="rtl">
                              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(((selectedReport?.content || '') as string).replace(/\n/g, '<br/>')) }} />
                            </div>
                          ) : (
                            <pre className="whitespace-pre-wrap text-xs font-mono bg-muted p-4 rounded-lg break-words">
                              {(() => {
                                try {
                                  if (typeof selectedReport?.content === 'string') {
                                    try {
                                      const parsed = JSON.parse(selectedReport.content);
                                      return JSON.stringify(parsed, null, 2);
                                    } catch {
                                      return selectedReport.content;
                                    }
                                  }
                                  return JSON.stringify(selectedReport?.content, null, 2);
                                } catch {
                                  return selectedReport?.content || 'No content available';
                                }
                              })()}
                            </pre>
                          )}
                        </div>
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

export default withPageAccessibility(WhatsAppReports);