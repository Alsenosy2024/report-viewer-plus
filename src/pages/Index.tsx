import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Shield, Users, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // SEO
  useEffect(() => {
    document.title = 'Professional Engineers Dashboard';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Professional Engineers analytics dashboard for reports and bot management.');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-dashboard-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive reporting and analytics for all your business metrics"
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Secure access control with admin-managed user permissions"
    },
    {
      icon: Users,
      title: "Multi-User Support",
      description: "Collaborative dashboard with granular section-level permissions"
    },
    {
      icon: Bot,
      title: "Bot Management",
      description: "Control and monitor your WhatsApp, Messenger, and Instagram bots"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dashboard-secondary to-background">
      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16" role="main">
        <div className="text-center mb-16">
          <header className="mb-8 flex items-center justify-center">
            <img
              src="/lovable-uploads/7022dd5f-ca4d-4d4b-83f0-c5811cbca595.png"
              alt="Professional Engineers logo"
              className="h-14 w-auto drop-shadow-sm"
              loading="lazy"
            />
          </header>
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 shadow-glow animate-scale-in">
            <BarChart3 className="w-8 h-8 text-dashboard-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Professional Engineers Dashboard
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Unified analytics and reports with role-based access and bot management — designed for Professional Engineers.
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-glow text-base md:text-lg px-6 md:px-8 py-3"
          >
            Access Dashboard
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-card-border hover:shadow-md transition-smooth text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-dashboard-secondary rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-dashboard-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-primary text-dashboard-primary-foreground border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-dashboard-primary-foreground/90 mb-6">
              Contact your administrator to get access to the dashboard and start monitoring your business metrics.
            </p>
            <p className="text-sm text-dashboard-primary-foreground/80">
              Note: User registration is managed by administrators only.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
