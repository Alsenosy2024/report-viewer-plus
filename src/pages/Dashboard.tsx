import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import SmartDashboard from '@/components/dashboard/SmartDashboard';
import { Button } from '@/components/ui/button';
import { LiquidGlassCard, LiquidGlassCardContent, LiquidGlassCardHeader, LiquidGlassCardTitle } from '@/components/ui/liquid-glass-card';
import { Bot, BarChart3, ArrowLeft, Maximize2, Minimize2, ExternalLink } from 'lucide-react';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'agentMood'>('dashboard');
  const [iframeError, setIframeError] = useState(false);
  const [isAgentMoodFullscreen, setIsAgentMoodFullscreen] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);

  const toggleAgentMoodFullscreen = () => {
    setIsAgentMoodFullscreen(!isAgentMoodFullscreen);
  };

  const handlePreloadComplete = () => {
    setIsPreloaded(true);
    console.log('Agent Mood preloaded successfully');
  };

  const handlePreloadError = () => {
    console.log('Agent Mood preload failed, will fallback to regular loading');
  };

  const renderAgentMood = () => {
    const handleIframeError = () => {
      console.error('Failed to load Agent Mood interface');
      setIframeError(true);
    };

    const handleIframeLoad = () => {
      console.log('Agent Mood interface loaded successfully');
      setIframeError(false);
    };

    if (isAgentMoodFullscreen) {
      return (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">Agent Mood - وضع ملء الشاشة</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://open-webui-production-7478.up.railway.app/', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                فتح في نافذة جديدة
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAgentMoodFullscreen}
              >
                <Minimize2 className="h-4 w-4 mr-2" />
                إغلاق ملء الشاشة
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-80px)]">
            <iframe
              src="https://open-webui-production-7478.up.railway.app/"
              className="w-full h-full border-0"
              title="Agent Mood Fullscreen"
              onError={handleIframeError}
              onLoad={handleIframeLoad}
            />
          </div>
        </div>
      );
    }

    if (iframeError) {
      return (
        <LiquidGlassCard intensity="strong" floating shimmer glow className="h-full glass-breathe">
          <LiquidGlassCardHeader>
            <div className="flex items-center justify-between">
              <LiquidGlassCardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Agent Mood
              </LiquidGlassCardTitle>
              <Button
                variant="glass"
                size="sm"
                onClick={() => setCurrentView('dashboard')}
                className="glass-hover"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                العودة للداشبورد
              </Button>
            </div>
          </LiquidGlassCardHeader>
          <LiquidGlassCardContent>
            <div className="text-center py-12">
              <Bot className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">خطأ في تحميل واجهة Agent Mood</h3>
              <p className="text-muted-foreground mb-6">
                لا يمكن تحميل الواجهة في هذا الإطار بسبب قيود الأمان
              </p>
              <Button 
                onClick={() => window.open('https://open-webui-production-7478.up.railway.app/', '_blank')}
                size="lg"
                variant="glass-primary"
                className="glass-glow-pulse"
              >
                فتح في نافذة جديدة
              </Button>
            </div>
          </LiquidGlassCardContent>
        </LiquidGlassCard>
      );
    }

    return (
      <LiquidGlassCard intensity="strong" interactive floating glow className="h-full glass-morph">
        <LiquidGlassCardHeader>
          <div className="flex items-center justify-between">
            <LiquidGlassCardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Agent Mood
            </LiquidGlassCardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="glass"
                size="sm"
                onClick={() => window.open('https://open-webui-production-7478.up.railway.app/', '_blank')}
                className="glass-hover glass-stagger"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                فتح في نافذة جديدة
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={toggleAgentMoodFullscreen}
                className="glass-hover glass-stagger"
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                ملء الشاشة
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() => setCurrentView('dashboard')}
                className="glass-hover glass-stagger"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                العودة للداشبورد
              </Button>
            </div>
          </div>
        </LiquidGlassCardHeader>
        <LiquidGlassCardContent className="p-0">
          <iframe
            src="https://open-webui-production-7478.up.railway.app/"
            className="w-full h-[calc(100vh-200px)] rounded-md"
            title="Agent Mood Interface"
            onError={handleIframeError}
            onLoad={handleIframeLoad}
          />
        </LiquidGlassCardContent>
      </LiquidGlassCard>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant={currentView === 'dashboard' ? 'glass-primary' : 'glass'}
            onClick={() => setCurrentView('dashboard')}
            className="glass-stagger glass-hover"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            الداشبورد الذكي
          </Button>
          <Button
            variant={currentView === 'agentMood' ? 'glass-primary' : 'glass'}
            onClick={() => setCurrentView('agentMood')}
            className="glass-stagger glass-hover"
          >
            <Bot className="h-4 w-4 mr-2" />
            Agent Mood
          </Button>
        </div>
        
        {currentView === 'dashboard' ? <SmartDashboard /> : renderAgentMood()}
      </div>
      
      {/* Preload Agent Mood iframe in background */}
      <iframe
        src="https://open-webui-production-7478.up.railway.app/"
        className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
        title="Agent Mood Preload"
        onLoad={handlePreloadComplete}
        onError={handlePreloadError}
      />
    </DashboardLayout>
  );
};

export default Dashboard;