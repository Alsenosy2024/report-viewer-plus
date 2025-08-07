import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Send, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const WhatsAppReports = () => {
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

        <div className="grid gap-6 md:grid-cols-2">
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

          {/* Message Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Message Analytics</CardTitle>
              <CardDescription>Performance metrics for the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppReports;