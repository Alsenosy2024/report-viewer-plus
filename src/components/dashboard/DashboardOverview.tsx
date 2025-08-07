import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, MessageSquare, TrendingUp, Mail, Bot, Users } from 'lucide-react';

export const DashboardOverview = () => {
  const stats = [
    {
      title: "WhatsApp Reports",
      value: "12",
      change: "+2 from yesterday",
      icon: MessageSquare,
      color: "success"
    },
    {
      title: "Productivity Score",
      value: "87%",
      change: "+5% from last week",
      icon: TrendingUp,
      color: "info"
    },
    {
      title: "Active Bots",
      value: "3/3",
      change: "All systems operational",
      icon: Bot,
      color: "success"
    },
    {
      title: "Mail Reports",
      value: "156",
      change: "+12 today",
      icon: Mail,
      color: "warning"
    }
  ];

  const recentActivity = [
    {
      title: "WhatsApp Daily Report Generated",
      time: "2 minutes ago",
      status: "success"
    },
    {
      title: "Productivity Report Updated",
      time: "15 minutes ago", 
      status: "info"
    },
    {
      title: "Instagram Bot Status Changed",
      time: "1 hour ago",
      status: "warning"
    },
    {
      title: "Mail Report Processed",
      time: "2 hours ago",
      status: "success"
    }
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-card-border hover:shadow-md transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-dashboard-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  );
};