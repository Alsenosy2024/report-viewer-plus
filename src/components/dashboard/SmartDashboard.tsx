import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Maximize2, Minimize2, Workflow, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface N8nDashboard {
  id: string;
  dashboard_name: string;
  html_content: string;
  workflow_id: string | null;
  version: number;
  is_active: boolean;
  metadata: any;
  created_by_workflow: string | null;
  created_at: string;
  updated_at: string;
}

const SmartDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [dashboard, setDashboard] = useState<N8nDashboard | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string>('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const { toast } = useToast();

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

  // Format timer display
  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const loadLatestDashboard = async () => {
    setIsLoading(true);
    setError('');
    console.log('Loading latest n8n dashboard...');

    try {
      const { data, error } = await supabase
        .from('n8n_dashboards')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading n8n dashboard:', error);
        setError('خطأ في تحميل الداشبورد');
        toast({
          title: "خطأ في التحميل",
          description: "فشل في تحميل الداشبورد من n8n",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setDashboard(data);
        console.log(`Loaded dashboard: ${data.dashboard_name} v${data.version}`);
        toast({
          title: "تم التحميل بنجاح",
          description: `تم تحميل الداشبورد: ${data.dashboard_name} v${data.version}`,
        });
      } else {
        setError('لم يتم العثور على أي داشبورد نشط');
        toast({
          title: "لا يوجد داشبورد",
          description: "لم يتم العثور على أي داشبورد نشط من n8n",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error loading n8n dashboard:', error);
      setError(error.message);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الداشبورد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      // Start 5-minute timer
      setTimerSeconds(300); // 5 minutes = 300 seconds
      setIsTimerActive(true);
      
      // Trigger the webhook first
      console.log('Triggering dashboard refresh webhook...');
      await fetch('https://primary-production-245af.up.railway.app/webhook/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'refresh_dashboard',
          timestamp: new Date().toISOString()
        })
      });
      
      toast({
        title: "تم تفعيل التحديث",
        description: "تم إرسال طلب تحديث الداشبورد بنجاح - سيتم التحديث خلال 5 دقائق",
      });
      
      // Then load the latest dashboard
      await loadLatestDashboard();
    } catch (error) {
      console.error('Error triggering webhook:', error);
      setIsTimerActive(false);
      setTimerSeconds(0);
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تفعيل تحديث الداشبورد",
        variant: "destructive",
      });
    }
  };

  // Subscribe to real-time updates for new n8n dashboards
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
        async (payload) => {
          console.log('New n8n dashboard detected:', payload);
          // Reload the latest dashboard
          await loadLatestDashboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load latest dashboard on component mount
  useEffect(() => {
    loadLatestDashboard();
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            خطأ في داشبورد n8n
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
          <Button 
            onClick={() => handleRefresh()} 
            className="mt-4"
            disabled={isLoading || isTimerActive}
          >
            {isTimerActive ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                {formatTimer(timerSeconds)}
              </>
            ) : (
              <>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                إعادة المحاولة
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !dashboard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            داشبورد n8n الذكي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">جاري تحميل الداشبورد...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dashboard) {
    if (isFullscreen) {
      return (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              <span className="font-semibold">{dashboard.dashboard_name} - وضع ملء الشاشة</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                v{dashboard.version}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRefresh()}
                disabled={isLoading || isTimerActive}
                data-refresh-dashboard
              >
                {isTimerActive ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    {formatTimer(timerSeconds)}
                  </>
                ) : (
                  <>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    تحديث
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
              >
                <Minimize2 className="h-4 w-4 mr-2" />
                إغلاق ملء الشاشة
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-80px)]">
            <iframe
              srcDoc={dashboard.html_content}
              className="w-full h-full border-0"
              title="n8n Dashboard Fullscreen"
            />
          </div>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              {dashboard.dashboard_name}
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                v{dashboard.version}
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
               <Button
                variant="outline"
                size="sm"
                onClick={() => handleRefresh()}
                disabled={isLoading || isTimerActive}
                data-refresh-dashboard
              >
                {isTimerActive ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    {formatTimer(timerSeconds)}
                  </>
                ) : (
                  <>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    تحديث
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                ملء الشاشة
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96 mb-4">
            <iframe
              srcDoc={dashboard.html_content}
              className="w-full h-full border border-border rounded-md"
              title="n8n Dashboard"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>آخر تحديث: {formatDate(dashboard.updated_at)}</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              {dashboard.workflow_id && (
                <span>Workflow: {dashboard.workflow_id}</span>
              )}
              {dashboard.created_by_workflow && (
                <span>مُولد بواسطة: {dashboard.created_by_workflow}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="h-5 w-5" />
          داشبورد n8n الذكي
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Workflow className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">لم يتم العثور على داشبورد نشط</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            قم بتشغيل سير عمل n8n الخاص بك لإنشاء وتحميل داشبورد جديد
          </p>
           <Button 
            onClick={() => handleRefresh()} 
            disabled={isLoading || isTimerActive}
            size="lg"
            data-refresh-dashboard
          >
            {isTimerActive ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                {formatTimer(timerSeconds)}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                البحث عن داشبورد
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartDashboard;