import { LiquidGlassCard, LiquidGlassCardContent, LiquidGlassCardHeader, LiquidGlassCardTitle } from '@/components/ui/liquid-glass-card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const AwaitingApproval = () => {
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();

  // Redirect approved users away from this page
  useEffect(() => {
    if (profile?.is_approved === true) {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  // Don't render anything for approved users (they'll be redirected)
  if (profile?.is_approved === true) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center glass-medium backdrop-blur-[32px] p-4">
      <LiquidGlassCard 
        intensity="strong" 
        interactive 
        floating 
        shimmer 
        glow 
        className="max-w-lg w-full glass-morph glass-breathe"
      >
        <LiquidGlassCardHeader>
          <LiquidGlassCardTitle className="text-center">Awaiting Approval</LiquidGlassCardTitle>
        </LiquidGlassCardHeader>
        <LiquidGlassCardContent className="space-y-4 text-center">
          <p>Your account ({user?.email}) has been created and is pending admin approval.</p>
          <p className="text-muted-foreground">You will be able to access the dashboard once approved.</p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="glass" 
              onClick={() => navigate('/')}
              className="glass-hover"
            >
              Go to Home
            </Button>
            <Button 
              variant="destructive" 
              onClick={async () => { await signOut(); navigate('/auth'); }}
              className="glass-hover"
            >
              Sign out
            </Button>
          </div>
        </LiquidGlassCardContent>
      </LiquidGlassCard>
    </div>
  );
};

export default AwaitingApproval;