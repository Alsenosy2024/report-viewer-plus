import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Send, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const WhatsAppReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
                  {reports.map((report) => (
                    <div key={report.id} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-foreground">
                          Report #{report.id.slice(0, 8)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {new Date(report.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.content}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {report.content_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.report_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
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
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppReports;