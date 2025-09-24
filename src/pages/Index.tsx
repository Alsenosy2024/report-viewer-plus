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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Fixed Navigation */}
      <nav className="fixed top-6 left-6 right-6 z-50">
        <LiquidGlassCard 
          intensity="medium" 
          interactive={false}
          glow={true}
          className="px-8 py-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center glass-float">
                <span className="text-white text-base font-bold">PE</span>
              </div>
              <span className="text-foreground font-semibold text-xl">Professional Engineers</span>
            </div>
            
            <Button 
              variant="glass-primary" 
              onClick={() => navigate('/auth')}
              className="glass-float px-6 py-3"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Access Dashboard
            </Button>
          </div>
        </LiquidGlassCard>
      </nav>

      {/* Hero Section */}
      <div className="pt-40 pb-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <LiquidGlassCard 
            intensity="strong" 
            floating={true}
            shimmer={true}
            glow={true}
            className="p-16 mb-16"
          >
            <h1 className="text-7xl font-bold text-foreground mb-8 leading-tight">
              Professional Engineers
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent mt-4 glass-float">
                Dashboard
              </span>
            </h1>
            <p className="text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
              Streamline your engineering workflows with intelligent reporting, automated insights, and comprehensive project management tools designed for modern professionals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                variant="glass-primary" 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="text-xl px-12 py-6 glass-float hover:glass-glow"
              >
                <Zap className="w-6 h-6 mr-3" />
                Get Started
              </Button>
              <Button 
                variant="glass-secondary" 
                size="lg" 
                className="text-xl px-12 py-6 glass-shimmer hover:glass-pulse"
              >
                <Sparkles className="w-6 h-6 mr-3" />
                Watch Demo
              </Button>
            </div>
          </LiquidGlassCard>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <LiquidGlassCard
                key={feature.title}
                intensity="medium"
                interactive={true}
                floating={true}
                glow={index % 2 === 0}
                className="p-10 text-center group hover:scale-105 transition-all duration-500"
                style={{ animationDelay: `${index * 300}ms` }}
              >
                <div className="mb-8">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center mb-6 glass-breathe group-hover:glass-pulse">
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-6 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">{feature.description}</p>
              </LiquidGlassCard>
            ))}
          </div>

        {/* Final CTA */}
        <div className="mt-24">
          <LiquidGlassCard 
            intensity="strong" 
            shimmer={true}
            glow={true}
            floating={true}
            className="p-16 text-center group"
          >
            <h2 className="text-5xl font-bold text-foreground mb-8 group-hover:text-primary transition-colors duration-500">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of professional engineers who have streamlined their processes with our comprehensive dashboard solution.
            </p>
            <Button 
              variant="glass-primary" 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-2xl px-16 py-8 glass-float hover:glass-pulse group"
            >
              <Shield className="w-7 h-7 mr-3 group-hover:translate-x-1 transition-transform duration-300" />
              Start Your Journey
            </Button>
          </LiquidGlassCard>
        </div>
      </div>
    </div>
  );
};

export default Index;
