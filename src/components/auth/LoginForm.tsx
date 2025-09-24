import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LiquidGlassCard, LiquidGlassCardContent, LiquidGlassCardDescription, LiquidGlassCardHeader, LiquidGlassCardTitle } from '@/components/ui/liquid-glass-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield } from 'lucide-react';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, signInWithGoogle, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);
      
      if (error) {
        setError(error.message);
      } else if (isSignUp) {
        setError('Please check your email to confirm your account.');
      } else {
        // Successful sign in - navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center glass-medium backdrop-blur-[32px] p-4">
      <LiquidGlassCard 
        intensity="strong" 
        interactive 
        floating 
        shimmer 
        glow 
        className="w-full max-w-md glass-morph glass-glow-pulse"
      >
        <LiquidGlassCardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 glass-strong rounded-full flex items-center justify-center glass-glow-pulse">
            <Shield className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <LiquidGlassCardTitle className="text-2xl font-bold text-foreground">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </LiquidGlassCardTitle>
            <LiquidGlassCardDescription className="text-muted-foreground">
              {isSignUp ? 'Sign up to get started' : 'Sign in to access your dashboard'}
            </LiquidGlassCardDescription>
          </div>
        </LiquidGlassCardHeader>
        <LiquidGlassCardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="transition-all duration-300 focus:ring-2 focus:ring-dashboard-primary/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="transition-all duration-300 focus:ring-2 focus:ring-dashboard-primary/20"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full glass-primary glass-hover glass-glow-pulse"
              variant="glass-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </Button>

            <Button
              type="button"
              variant="glass"
              className="w-full glass-hover"
              disabled={loading}
              onClick={async () => {
                setError('');
                setLoading(true);
                const { error } = await signInWithGoogle();
                if (error) {
                  setError(error.message);
                  setLoading(false);
                }
              }}
            >
              Continue with Google
            </Button>
            
            <div className="text-center">
              <Button
                type="button"
                variant="glass"
                className="text-sm text-muted-foreground hover:text-foreground glass-hover"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                disabled={loading}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </Button>
            </div>
          </form>
        </LiquidGlassCardContent>
      </LiquidGlassCard>
    </div>
  );
};