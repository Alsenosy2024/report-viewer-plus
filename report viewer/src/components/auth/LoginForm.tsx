import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dashboard-secondary to-background p-3 sm:p-4">
      <Card className="w-full max-w-md shadow-lg border-card-border">
        <CardHeader className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6">
          <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-dashboard-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm sm:text-base">
              {isSignUp ? 'Sign up to get started' : 'Sign in to access your dashboard'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-dashboard-primary/20"
                inputMode="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-dashboard-primary/20"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-glow text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="text-sm sm:text-base">
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </span>
                </>
              ) : (
                <span className="text-sm sm:text-base">
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </span>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base font-medium"
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
            
            <div className="text-center pt-2">
              <Button
                type="button"
                variant="ghost"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground h-auto p-2 min-h-[44px]"
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
        </CardContent>
      </Card>
    </div>
  );
};