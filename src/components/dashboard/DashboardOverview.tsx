import React, { lazy, Suspense, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart3, Bot, Calendar, RefreshCw, Maximize2, TrendingUpIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { IntelligentOverview } from './IntelligentOverview';

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
          <IntelligentOverview />
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