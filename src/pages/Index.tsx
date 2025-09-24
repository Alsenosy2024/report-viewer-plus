import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LiquidGlassCard, LiquidGlassCardContent, LiquidGlassCardDescription, LiquidGlassCardHeader, LiquidGlassCardTitle } from '@/components/ui/liquid-glass-card';
import { BarChart3, Shield, Users, Bot, Sparkles, Zap } from 'lucide-react';
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
    document.title = 'Professional Engineers Dashboard - Liquid Glass';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Experience the future of professional analytics with Apple Liquid Glass design - Professional Engineers dashboard.');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LiquidGlassCard intensity="medium" className="p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </LiquidGlassCard>
      </div>
    );
  }

  const features = [
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive reporting with Liquid Glass interface for crystal-clear data visualization"
    },
    {
      icon: Shield,
      title: "Secure Access Control",
      description: "Role-based permissions with translucent security layers and adaptive authentication"
    },
    {
      icon: Users,
      title: "Collaborative Workspace",
      description: "Multi-user support with glass-morphic interfaces that adapt to team workflows"
    },
    {
      icon: Bot,
      title: "AI-Powered Automation",
      description: "Next-generation bot management with liquid glass effects and intelligent responses"
    }
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Ambient Background with Liquid Glass Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-primary/5 to-accent/5 -z-10" />
      <div className="fixed inset-0 bg-gradient-glass-radial opacity-30 -z-10" />
      
      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 relative" role="main">
        {/* Floating Navigation Header */}
        <header className="fixed top-6 left-6 right-6 z-50">
          <LiquidGlassCard 
            intensity="medium" 
            interactive={false} 
            className="px-8 py-4 backdrop-blur-glass-strong"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/lovable-uploads/7022dd5f-ca4d-4d4b-83f0-c5811cbca595.png"
                  alt="Professional Engineers logo"
                  className="h-8 w-auto"
                  loading="lazy"
                />
                <span className="font-semibold text-foreground">Professional Engineers</span>
              </div>
              <Button 
                variant="glass" 
                size="sm"
                onClick={() => navigate('/auth')}
                className="glass-shimmer"
              >
                <Sparkles className="w-4 h-4" />
                Access Dashboard
              </Button>
            </div>
          </LiquidGlassCard>
        </header>

        <div className="pt-32 text-center mb-20">
          {/* Hero Icon with Glass Effect */}
          <div className="mx-auto mb-8 relative">
            <LiquidGlassCard 
              intensity="strong" 
              floating 
              glow
              className="w-20 h-20 flex items-center justify-center mx-auto"
            >
              <BarChart3 className="w-10 h-10 text-primary" />
            </LiquidGlassCard>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 leading-tight">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Liquid Glass
            </span>
            <br />
            <span className="text-foreground/90">Dashboard</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
            Experience the future of professional analytics with Apple's revolutionary 
            <span className="text-primary font-medium"> Liquid Glass </span>
            design language — where transparency meets intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button 
              variant="glass-primary" 
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-4"
            >
              <Zap className="w-5 h-5" />
              Enter Experience
            </Button>
            <Button 
              variant="floating" 
              size="lg"
              className="text-lg px-8 py-4"
            >
              <Sparkles className="w-5 h-5" />
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid with Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => (
            <LiquidGlassCard 
              key={index} 
              intensity="medium" 
              interactive 
              floating={index % 2 === 0}
              shimmer={index === 1}
              className="text-center h-full"
            >
              <LiquidGlassCardHeader>
                <div className="mx-auto mb-4">
                  <LiquidGlassCard 
                    intensity="light" 
                    className="w-14 h-14 flex items-center justify-center mx-auto"
                  >
                    <feature.icon className="w-7 h-7 text-primary" />
                  </LiquidGlassCard>
                </div>
                <LiquidGlassCardTitle className="text-xl">{feature.title}</LiquidGlassCardTitle>
              </LiquidGlassCardHeader>
              <LiquidGlassCardContent>
                <LiquidGlassCardDescription className="text-base leading-relaxed">
                  {feature.description}
                </LiquidGlassCardDescription>
              </LiquidGlassCardContent>
            </LiquidGlassCard>
          ))}
        </div>

        {/* CTA Section with Intense Glass Effect */}
        <LiquidGlassCard 
          intensity="strong" 
          glow 
          className="relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-primary opacity-10" />
          <LiquidGlassCardContent className="p-12 text-center relative">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              Ready for the Future?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Step into tomorrow's interface today. Contact your administrator to unlock access 
              to the most advanced dashboard experience ever created.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                variant="glass-accent" 
                size="lg"
                className="text-lg px-8"
              >
                <Shield className="w-5 h-5" />
                Request Access
              </Button>
              <p className="text-sm text-muted-foreground/80">
                Administrator approval required
              </p>
            </div>
          </LiquidGlassCardContent>
        </LiquidGlassCard>
      </main>
    </div>
  );
};

export default Index;
