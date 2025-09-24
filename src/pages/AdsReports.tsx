import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LiquidGlassCard, LiquidGlassCardContent, LiquidGlassCardDescription, LiquidGlassCardHeader, LiquidGlassCardTitle } from '@/components/ui/liquid-glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, BarChart3, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdsReport {
  id: string;
  report_date: string;
  content: string;
  created_at: string;
  updated_at: string;
  content_type: string;
}

const AdsReports = () => {
  const [reports, setReports] = useState<AdsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // SEO tags
  useEffect(() => {
    document.title = 'Ads Analysis Reports | Dashboard';
    const description = 'Ads analysis reports and insights';

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;

    const canonicalHref = `${window.location.origin}/ads-reports`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalHref;
  }, []);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('section', 'ads_reports')
        .order('report_date', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching ads reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch ads analysis reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openReport = (report: AdsReport) => {
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
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Ads Analysis</h1>
              <p className="text-muted-foreground mt-2">Daily ads analysis reports</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <LiquidGlassCard key={i} intensity="medium" className="glass-shimmer glass-stagger">
                <LiquidGlassCardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2 animate-pulse"></div>
                  <div className="h-8 bg-muted rounded animate-pulse"></div>
                </LiquidGlassCardContent>
              </LiquidGlassCard>
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
            <h1 className="text-3xl font-bold tracking-tight">Ads Analysis</h1>
            <p className="text-muted-foreground mt-2">Daily ads analysis reports and insights</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="px-3 py-1">
              <BarChart3 className="w-3 h-3 mr-1" />
              {reports.length} Reports
            </Badge>
          </div>
        </div>

        {reports.length === 0 ? (
          <LiquidGlassCard intensity="medium" floating shimmer className="text-center py-12 glass-breathe">
            <LiquidGlassCardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 glass-light rounded-full flex items-center justify-center glass-glow-pulse">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No Ads Reports Found</h3>
                  <p className="text-muted-foreground mt-1">
                    Ads analysis reports will appear here once they are available.
                  </p>
                </div>
              </div>
            </LiquidGlassCardContent>
          </LiquidGlassCard>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report, index) => (
              <LiquidGlassCard
                key={report.id}
                intensity="medium"
                interactive
                floating
                shimmer
                glow
                className="cursor-pointer glass-stagger"
                style={{animationDelay: `${index * 0.1}s`}}
                onClick={() => openReport(report)}
              >
                <LiquidGlassCardHeader>
                  <LiquidGlassCardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary animate-pulse" />
                      <span className="text-lg">{formatDate(report.report_date)}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </LiquidGlassCardTitle>
                  <LiquidGlassCardDescription>
                    {report.content_type === 'html' ? 'Interactive HTML Report' : 'Text Report'}
                  </LiquidGlassCardDescription>
                </LiquidGlassCardHeader>
                <LiquidGlassCardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant={report.content_type === 'html' ? 'default' : 'secondary'} className="glass-light">
                      {report.content_type === 'html' ? 'HTML' : 'TEXT'}
                    </Badge>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        openReport(report);
                      }}
                      size="sm"
                      variant="glass"
                      className="glass-hover"
                    >
                      View Report
                    </Button>
                  </div>
                </LiquidGlassCardContent>
              </LiquidGlassCard>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdsReports;
