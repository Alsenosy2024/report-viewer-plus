import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { InteractiveCard } from '@/components/InteractiveCard';
import { BarChart3, Shield, Users, Bot, Sparkles, Zap, MousePointer, Layers, Palette } from 'lucide-react';
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
        <InteractiveCard intensity="medium" className="p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </InteractiveCard>
      </div>
    );
  }

  const features = [
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time data visualization with liquid glass morphing effects and adaptive theming",
      color: "text-blue-400"
    },
    {
      icon: Shield,
      title: "Secure Glass Layers",
      description: "Multi-layered security with translucent authentication and biometric glass interfaces",
      color: "text-green-400"
    },
    {
      icon: Users,
      title: "Collaborative Interface",
      description: "Team synchronization through shared glass workspaces with magnetic interactions",
      color: "text-purple-400"
    },
    {
      icon: Bot,
      title: "AI Glass Assistant",
      description: "Intelligent automation with liquid responses and contextual glass overlays",
      color: "text-orange-400"
    },
    {
      icon: MousePointer,
      title: "Magnetic Interactions",
      description: "Elements that respond to your presence with fluid motion and glass distortion",
      color: "text-pink-400"
    },
    {
      icon: Layers,
      title: "Depth Dynamics",
      description: "Multiple glass planes that create stunning parallax effects and visual hierarchy",
      color: "text-cyan-400"
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
        <header className="fixed top-6 left-6 right-6 z-50 animate-fade-in">
          <InteractiveCard 
            intensity="medium" 
            magnetic={true}
            className="px-8 py-4"
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
              <div className="flex items-center gap-3">
                <ThemeSwitcher />
                <Button 
                  variant="glass" 
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="glass-hover animate-pulse"
                >
                  <Sparkles className="w-4 h-4" />
                  Access Dashboard
                </Button>
              </div>
            </div>
          </InteractiveCard>
        </header>

        <div className="pt-32 text-center mb-20">
          {/* Hero Icon with Glass Effect */}
          <div className="mx-auto mb-8 relative">
            <InteractiveCard 
              intensity="strong"
              magnetic={true}
              tilt={true}
              className="w-20 h-20 flex items-center justify-center mx-auto glass-float"
            >
              <BarChart3 className="w-10 h-10 text-primary animate-pulse" />
            </InteractiveCard>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 leading-tight animate-fade-in">
            <span className="bg-gradient-to-r from-theme-primary via-theme-secondary to-theme-accent bg-clip-text text-transparent animate-pulse">
              Liquid Glass
            </span>
            <br />
            <span className="text-foreground/90">Experience</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in" style={{animationDelay: "0.2s"}}>
            Immerse yourself in Apple's revolutionary 
            <span className="text-primary font-medium"> Liquid Glass </span>
            design language — where advanced interactions meet stunning visual depth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{animationDelay: "0.4s"}}>
            <Button 
              variant="glass-primary" 
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-4 glass-hover"
            >
              <Zap className="w-5 h-5" />
              Enter Experience
            </Button>
            <Button 
              variant="floating" 
              size="lg"
              className="text-lg px-8 py-4"
            >
              <Palette className="w-5 h-5" />
              Explore Themes
            </Button>
          </div>
        </div>

        {/* Enhanced Features Grid with Interactive Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <InteractiveCard 
              key={index} 
              intensity="medium" 
              magnetic={true}
              tilt={true}
              className="text-center h-full p-8 animate-scale-in"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="mx-auto mb-6">
                <InteractiveCard 
                  intensity="light" 
                  magnetic={true}
                  className="w-16 h-16 flex items-center justify-center mx-auto"
                >
                  <feature.icon className={`w-8 h-8 ${feature.color} animate-pulse`} />
                </InteractiveCard>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">{feature.title}</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </InteractiveCard>
          ))}
        </div>

        {/* Enhanced CTA Section with Advanced Glass Effects */}
        <InteractiveCard 
          intensity="strong"
          magnetic={true}
          tilt={true} 
          className="relative overflow-hidden animate-fade-in"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-theme-primary/10 via-theme-secondary/10 to-theme-accent/10" />
          <div className="p-12 text-center relative">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              Ready for the Glass Revolution?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Step into tomorrow's interface today. Experience the most advanced liquid glass dashboard 
              with dynamic theming, magnetic interactions, and immersive visual depth.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                variant="glass-accent" 
                size="lg"
                className="text-lg px-8 glass-hover"
              >
                <Shield className="w-5 h-5" />
                Request Access
              </Button>
              <Button 
                variant="glass" 
                size="lg"
                className="text-lg px-8"
              >
                <Sparkles className="w-5 h-5" />
                Live Demo
              </Button>
            </div>
          </div>
        </InteractiveCard>
      </main>
    </div>
  );
};

export default Index;
