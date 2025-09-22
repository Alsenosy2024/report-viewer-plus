import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Brain, Maximize2, Minimize2, AlertCircle } from 'lucide-react';

const SmartDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [lastGenerated, setLastGenerated] = useState<string>('');
  const [reportsCount, setReportsCount] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generateSmartDashboard = async (force = false) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Generating smart dashboard with GPT-5...');
      
      const { data, error } = await supabase.functions.invoke('generate-smart-dashboard', {
        body: { force }
      });
      
      if (error) {
        throw error;
      }

      if (data?.success) {
        setHtmlContent(data.html_content);
        setLastGenerated(data.generated_at);
        setReportsCount(data.reports_count || 0);
        
        toast({
          title: "🧠 تم إنشاء الداشبورد الذكي",
          description: `تم تحليل ${data.reports_count || 0} تقرير من آخر 7 أيام باستخدام GPT-5`,
        });
      } else {
        throw new Error(data?.details || 'Failed to generate dashboard');
      }
    } catch (error) {
      console.error('Error generating smart dashboard:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ في إنشاء الداشبورد');
      
      toast({
        title: "❌ فشل في إنشاء الداشبورد",
        description: "حدث خطأ أثناء تحليل البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExistingDashboard = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('smart_dashboards')
        .select('*')
        .eq('date_generated', today)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading existing dashboard:', error);
        return;
      }

      if (data) {
        setHtmlContent(data.html_content);
        setLastGenerated(data.generated_at);
        setReportsCount(data.reports_analyzed);
        
        console.log('Loaded existing dashboard for today');
      } else {
        // No dashboard for today, generate new one
        await generateSmartDashboard();
      }
    } catch (error) {
      console.error('Error in loadExistingDashboard:', error);
      // If loading fails, generate new dashboard
      await generateSmartDashboard();
    }
  };

  // Auto-refresh when new reports are added
  useEffect(() => {
    const channel = supabase
      .channel('smart-dashboard-updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'reports' 
      }, (payload) => {
        console.log('New report detected, updating dashboard...');
        // Regenerate dashboard when new report is added
        generateSmartDashboard(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load dashboard on component mount
  useEffect(() => {
    loadExistingDashboard();
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error && !htmlContent) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            خطأ في الداشبورد الذكي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={() => generateSmartDashboard(true)}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              إعادة المحاولة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''}`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-smart rounded-lg p-4 text-white shadow-smart ${isFullscreen ? 'mb-4' : ''}`}>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            الداشبورد الذكي المُحدث يومياً
          </h2>
          <p className="text-sm opacity-90">
            تحليل متطور لآخر 7 أيام باستخدام GPT-5 • 
            {lastGenerated && ` آخر تحديث: ${formatDate(lastGenerated)}`} • 
            تم تحليل {reportsCount} تقرير
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => generateSmartDashboard(true)}
            disabled={loading}
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 transition-bounce"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            تجديد التحليل
          </Button>
          <Button
            onClick={toggleFullscreen}
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 transition-bounce"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 mr-2" />
            ) : (
              <Maximize2 className="h-4 w-4 mr-2" />
            )}
            {isFullscreen ? 'تصغير' : 'ملء الشاشة'}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="shadow-ai">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <RefreshCw className="h-12 w-12 animate-spin text-primary" />
                <Brain className="h-6 w-6 text-primary absolute top-3 left-3" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold bg-gradient-ai bg-clip-text text-transparent">
                  جاري إنشاء الداشبورد الذكي...
                </h3>
                <p className="text-muted-foreground">
                  GPT-5 يقوم بتحليل بيانات آخر 7 أيام وإنتاج تقرير متطور
                </p>
                <div className="flex items-center justify-center gap-1 mt-4">
                  <div className="w-2 h-2 bg-gradient-ai rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gradient-ai rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gradient-ai rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Content */}
      {htmlContent && !loading && (
        <Card className={`${isFullscreen ? 'h-full' : 'min-h-[600px]'}`}>
          <CardContent className="p-0 h-full">
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              className="w-full h-full rounded-lg border-0"
              style={{ 
                minHeight: isFullscreen ? '100%' : '600px',
                height: isFullscreen ? '100%' : 'auto'
              }}
              title="Smart Dashboard"
              sandbox="allow-scripts allow-same-origin"
            />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!htmlContent && !loading && !error && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Brain className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold mb-2">مرحباً بك في الداشبورد الذكي</h3>
                <p className="text-muted-foreground mb-4">
                  انقر على "إنشاء الداشبورد" للحصول على تحليل متطور لآخر 7 أيام من تقاريرك
                </p>
                <Button 
                  onClick={() => generateSmartDashboard()}
                  disabled={loading}
                  className="bg-gradient-smart text-white shadow-smart hover:shadow-ai transition-bounce"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  إنشاء الداشبورد الذكي
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Info */}
      {htmlContent && !loading && (
        <div className="text-center text-xs text-muted-foreground bg-gradient-to-r from-muted/30 to-muted/60 rounded-lg p-3 border border-muted/20">
          <span className="inline-flex items-center gap-1">
            <Brain className="h-3 w-3" />
            يتم تحديث هذا الداشبورد تلقائياً عند إضافة تقارير جديدة • 
            مدعوم بتقنية GPT-5 للتحليل الذكي والمتطور
          </span>
        </div>
      )}
    </div>
  );
};

export default SmartDashboard;