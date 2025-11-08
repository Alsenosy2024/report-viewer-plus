import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, BarChart3, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductivityReport {
  id: string;
  report_date: string;
  content: string;
  created_at: string;
  updated_at: string;
  content_type: string;
}

const ProductivityReports = () => {
  const [reports, setReports] = useState<ProductivityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('section', 'productivity_reports')
        .order('report_date', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch productivity reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openReport = (report: ProductivityReport) => {
    if (report.content_type === 'html') {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(report.content);
        newWindow.document.close();
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Productivity Reports</h1>
              <p className="text-muted-foreground mt-2">Daily productivity reports</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Productivity Reports</h1>
            <p className="text-muted-foreground mt-2">
              Daily productivity reports and insights
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="px-3 py-1">
              <BarChart3 className="w-3 h-3 mr-1" />
              {reports.length} Reports
            </Badge>
          </div>
        </div>

        {reports.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No Productivity Reports Found</h3>
                  <p className="text-muted-foreground mt-1">
                    Productivity reports will appear here once they are available.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openReport(report)}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-lg">{formatDate(report.report_date)}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>
                    {report.content_type === 'html' ? 'Interactive HTML Report' : 'Text Report'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant={report.content_type === 'html' ? 'default' : 'secondary'}>
                      {report.content_type === 'html' ? 'HTML' : 'TEXT'}
                    </Badge>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        openReport(report);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      View Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProductivityReports;