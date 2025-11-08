import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-center">Awaiting Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p>Your account ({user?.email}) has been created and is pending admin approval.</p>
          <p className="text-muted-foreground">You will be able to access the dashboard once approved.</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>Go to Home</Button>
            <Button variant="destructive" onClick={async () => { await signOut(); navigate('/auth'); }}>Sign out</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AwaitingApproval;
