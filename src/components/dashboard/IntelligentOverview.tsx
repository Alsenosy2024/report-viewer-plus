import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  Star, 
  Zap, 
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  Clock,
  Target,
  RefreshCw
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  icon: React.ElementType;
  color: 'success' | 'warning' | 'info' | 'error';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  change, 
  icon: Icon, 
  color 
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-error" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-success';
      case 'down': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'success': return 'border-success/20 bg-success/5';
      case 'warning': return 'border-warning/20 bg-warning/5'; 
      case 'info': return 'border-info/20 bg-info/5';
      case 'error': return 'border-error/20 bg-error/5';
      default: return 'border-card-border';
    }
  };

  return (
    <Card className={`${getColorClasses()} hover:shadow-md transition-smooth`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${
                color === 'success' ? 'bg-success/10' :
                color === 'warning' ? 'bg-warning/10' :
                color === 'info' ? 'bg-info/10' :
                color === 'error' ? 'bg-error/10' : 'bg-muted/10'
              }`}>
                <Icon className={`h-6 w-6 ${
                  color === 'success' ? 'text-success' :
                  color === 'warning' ? 'text-warning' :
                  color === 'info' ? 'text-info' :
                  color === 'error' ? 'text-error' : 'text-muted-foreground'
                }`} />
              </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {trend && change !== undefined && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const IntelligentOverview: React.FC = () => {
  const analytics = useAnalytics();

  if (analytics.loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Analyzing reports and generating insights...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analytics.error) {
    return (
      <Card className="border-error/20 bg-error/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-error" />
            <div>
              <p className="font-medium text-error">Analytics Error</p>
              <p className="text-sm text-muted-foreground">{analytics.error}</p>
            </div>
            <Button 
              onClick={analytics.refresh} 
              variant="outline" 
              size="sm"
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { businessMetrics, whatsappMetrics, productivityMetrics, trends, insights, recommendations } = analytics;

  // Get trend for customer volume
  const customerTrend = trends.find(t => t.label === 'Customer Volume');
  const qualityTrend = trends.find(t => t.label === 'Service Quality');

  return (
    <div className="space-y-6">
      {/* Key Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Customers Served"
          value={businessMetrics.totalCustomersServed}
          subtitle="Last 7 days"
          trend={customerTrend?.trend}
          change={customerTrend?.change}
          icon={Users}
          color="success"
        />
        
        <MetricCard
          title="Service Quality"
          value={`${businessMetrics.serviceQualityScore}%`}
          subtitle="Satisfaction score"
          trend={qualityTrend?.trend}
          change={qualityTrend?.change}
          icon={Star}
          color="info"
        />
        
        <MetricCard
          title="Team Efficiency"
          value={`${businessMetrics.productivityIndex}%`}
          subtitle="Productivity index"
          icon={Zap}
          color="warning"
        />
        
        <MetricCard
          title="Growth Rate"
          value={`${businessMetrics.growthRate > 0 ? '+' : ''}${businessMetrics.growthRate}%`}
          subtitle="Week over week"
          trend={businessMetrics.growthRate > 5 ? 'up' : businessMetrics.growthRate < -5 ? 'down' : 'stable'}
          icon={TrendingUp}
          color={businessMetrics.growthRate > 0 ? 'success' : 'error'}
        />
      </div>

      {/* Insights and Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Business Insights */}
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-dashboard-primary" />
              Business Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-dashboard-secondary/50">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">{insight}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No insights available yet</p>
                <p className="text-xs text-muted-foreground">Add more reports to generate insights</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Details */}
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-dashboard-primary" />
              Service Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Response Time</p>
                <p className="text-lg font-semibold text-success">{whatsappMetrics.avgResponseTime}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Tasks Completed</p>
                <p className="text-lg font-semibold text-info">{productivityMetrics.tasksCompleted}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Peak Hours</p>
                <div className="flex flex-wrap gap-1">
                  {whatsappMetrics.peakHours.map((hour, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {hour}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Alert Level</p>
                <div className="flex items-center gap-2">
                  {businessMetrics.alertCount > 0 ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="text-warning font-medium">{businessMetrics.alertCount} alerts</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-success font-medium">All good</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Common Issues and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Common Issues */}
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Common Customer Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            {whatsappMetrics.commonIssues.length > 0 ? (
              <div className="space-y-2">
                {whatsappMetrics.commonIssues.map((issue, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <div className="w-2 h-2 rounded-full bg-warning"></div>
                    <span className="text-sm font-medium text-foreground">{issue}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No common issues identified</p>
                <p className="text-xs text-muted-foreground">Great customer service performance!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-dashboard-primary" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="p-3 rounded-lg bg-dashboard-primary/5 border border-dashboard-primary/20">
                    <p className="text-sm text-foreground">{recommendation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No recommendations at this time</p>
                <p className="text-xs text-muted-foreground">Your operations are running smoothly</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productivity Bottlenecks */}
      {productivityMetrics.bottlenecks.length > 0 && (
        <Card className="border-error/20 bg-error/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-error" />
              Productivity Bottlenecks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {productivityMetrics.bottlenecks.map((bottleneck, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-error/10 border border-error/20">
                  <AlertTriangle className="h-4 w-4 text-error flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{bottleneck}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button 
          onClick={analytics.refresh}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Analytics
        </Button>
      </div>
    </div>
  );
};