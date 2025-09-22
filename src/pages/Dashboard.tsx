import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import SmartDashboard from '@/components/dashboard/SmartDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, BarChart3, ArrowLeft } from 'lucide-react';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'agentMood'>('dashboard');

  const renderAgentMood = () => (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Agent Mood
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentView('dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للداشبورد
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <iframe
          src="https://open-webui-production-7478.up.railway.app/"
          className="w-full h-[calc(100vh-200px)] border-0"
          title="Agent Mood Interface"
        />
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setCurrentView('dashboard')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            الداشبورد الذكي
          </Button>
          <Button
            variant={currentView === 'agentMood' ? 'default' : 'outline'}
            onClick={() => setCurrentView('agentMood')}
          >
            <Bot className="h-4 w-4 mr-2" />
            Agent Mood
          </Button>
        </div>
        
        {currentView === 'dashboard' ? <SmartDashboard /> : renderAgentMood()}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;