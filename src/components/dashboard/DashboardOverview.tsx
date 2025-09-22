import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart3, MessageSquare, TrendingUp, Mail, Bot, Users, Calendar, RefreshCw, Maximize2, TrendingUpIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const WeeklyOverview = lazy(() => import('./WeeklyOverview'));
const SmartDashboard = lazy(() => import('./SmartDashboard'));

export const DashboardOverview = () => {
  const [loading, setLoading] = useState(false);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const { toast } = useToast();

  const generateWeeklyOverview = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-overview', { body: { force: true } });
      
      if (error) {
        throw error;
      }

      toast({
        title: data?.fromCache ? "تم تحميل النظرة العامة" : "تم إنشاء النظرة العامة بنجاح",
        description: data?.fromCache
          ? "تم استرجاع التحليل المحفوظ مسبقاً"
          : "تم تحليل جميع تقارير الأسبوع باستخدام الذكاء الاصطناعي",
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
  const [counts, setCounts] = useState({ whatsapp: 0, productivity: 0, ads: 0, mail: 0 });
  type Activity = { title: string; time: string; status: 'success' | 'info' | 'warning' };
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  const sectionLabel = (section: string) => {
    switch (section) {
      case 'whatsapp_reports': return 'WhatsApp Report';
      case 'productivity_reports': return 'Productivity Report';
      case 'ads_reports': return 'Ads Report';
      case 'mail_reports': return 'Mail Report';
      default: return 'Report';
    }
  };

  const relativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} minutes ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const countFor = async (
    section: 'whatsapp_reports' | 'productivity_reports' | 'ads_reports' | 'mail_reports'
  ) => {
    const { count, error } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('section', section);
    if (error) console.error('Count error for', section, error);
    return count || 0;
  };

  const fetchDashboardData = async () => {
    try {
      const [whatsapp, productivity, ads, mail] = await Promise.all([
        countFor('whatsapp_reports'),
        countFor('productivity_reports'),
        countFor('ads_reports'),
        countFor('mail_reports'),
      ]);
      setCounts({ whatsapp, productivity, ads, mail });

      const { data } = await supabase
        .from('reports')
        .select('id, section, created_at, content_type')
        .order('created_at', { ascending: false })
        .limit(6);

      const items: Activity[] = (data || []).map((r: any) => ({
        title: `${sectionLabel(r.section)} ${r.content_type === 'processed_analysis' ? 'Processed' : 'Added'}`,
        time: relativeTime(r.created_at),
        status: (r.content_type === 'processed_analysis' ? 'success' : 'info') as Activity['status'],
      }));
      setRecentActivity(items);
    } catch (e) {
      console.error('Failed loading dashboard data', e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('reports-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (payload: any) => {
        const r: any = (payload as any).new;
        setCounts(prev => ({
          whatsapp: prev.whatsapp + (r.section === 'whatsapp_reports' ? 1 : 0),
          productivity: prev.productivity + (r.section === 'productivity_reports' ? 1 : 0),
          ads: prev.ads + (r.section === 'ads_reports' ? 1 : 0),
          mail: prev.mail + (r.section === 'mail_reports' ? 1 : 0),
        }));
        setRecentActivity(prev => ([
          {
            title: `${sectionLabel(r.section)} ${r.content_type === 'processed_analysis' ? 'Processed' : 'Added'}`,
            time: relativeTime(r.created_at),
            status: (r.content_type === 'processed_analysis' ? 'success' : 'info') as Activity['status'],
          },
          ...prev,
        ]).slice(0, 6));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = [
    { title: 'WhatsApp Reports', value: String(counts.whatsapp), change: '', icon: MessageSquare, color: 'success' },
    { title: 'Productivity Reports', value: String(counts.productivity), change: '', icon: TrendingUp, color: 'info' },
    { title: 'Ads Analysis', value: String(counts.ads), change: '', icon: BarChart3, color: 'success' },
    { title: 'Mail Reports', value: String(counts.mail), change: '', icon: Mail, color: 'warning' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success text-success-foreground';
      case 'warning': return 'bg-warning text-warning-foreground';
      case 'info': return 'bg-info text-info-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-lg p-6 text-dashboard-primary-foreground">
        <h2 className="text-2xl font-bold mb-2">Welcome to your Dashboard</h2>
        <p className="opacity-90">Monitor your reports, control your bots, and track performance metrics all in one place.</p>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard Overview
            </TabsTrigger>
            <TabsTrigger value="smart" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              الداشبورد الذكي
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Weekly Analysis
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => window.open('https://open-webui-production-7478.up.railway.app/', '_blank')}
              variant="default"
              size="sm"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Bot className="h-4 w-4" />
              AGENTS
            </Button>
            
            <Button 
              onClick={generateWeeklyOverview} 
              disabled={loading} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Generate Overview
            </Button>
            
            <Dialog open={fullScreenOpen} onOpenChange={setFullScreenOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Maximize2 className="h-4 w-4" />
                  Full Screen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full overflow-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TrendingUpIcon className="h-5 w-5" />
                    Weekly Analysis - Full Screen
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto">
                  <Suspense fallback={
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          Loading weekly analysis...
                        </div>
                      </CardContent>
                    </Card>
                  }>
                    <WeeklyOverview />
                  </Suspense>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Smart Insights Card */}
          <Card className="border-card-border hover:shadow-md transition-smooth">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-dashboard-primary" />
                Smart Content Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  View intelligent content analysis and insights in the Smart Dashboard tab
                </p>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => {
                    // Switch to smart tab - this would need proper tab switching logic
                    const smartTab = document.querySelector('[value="smart"]') as HTMLElement;
                    if (smartTab) smartTab.click();
                  }}
                >
                  <Bot className="h-4 w-4" />
                  View Smart Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-dashboard-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-dashboard-secondary/50">
                    <div className="flex items-center gap-3">
                      <Badge className={`w-2 h-2 rounded-full p-0 ${getStatusColor(activity.status)}`} />
                      <div>
                        <p className="font-medium text-sm text-foreground">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-dashboard-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 rounded-lg border border-card-border hover:bg-dashboard-secondary/50 transition-smooth cursor-pointer">
                  <h4 className="font-medium text-foreground">Generate New Report</h4>
                  <p className="text-sm text-muted-foreground">Create a custom report for today</p>
                </div>
                <div className="p-4 rounded-lg border border-card-border hover:bg-dashboard-secondary/50 transition-smooth cursor-pointer">
                  <h4 className="font-medium text-foreground">Manage Bot Settings</h4>
                  <p className="text-sm text-muted-foreground">Configure bot behavior and schedules</p>
                </div>
                <div className="p-4 rounded-lg border border-card-border hover:bg-dashboard-secondary/50 transition-smooth cursor-pointer">
                  <h4 className="font-medium text-foreground">View Analytics</h4>
                  <p className="text-sm text-muted-foreground">Deep dive into performance metrics</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="smart">
          <Suspense fallback={
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  جاري تحميل الداشبورد الذكي...
                </div>
              </CardContent>
            </Card>
          }>
            <SmartDashboard />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="weekly">
          <Suspense fallback={
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading weekly analysis...
                </div>
              </CardContent>
            </Card>
          }>
            <WeeklyOverview />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};