import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-dashboard-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/auth';
    return null;
  }

  // Admins always have access
  if (profile?.role === 'admin') {
    return <>{children}</>;
  }

  // If not approved (or profile not ready yet), send to awaiting page (avoid loop)
  const isAwaiting = location.pathname === '/awaiting-approval';
  if (!isAwaiting && (profile?.is_approved === false || profile == null)) {
    window.location.href = '/awaiting-approval';
    return null;
  }

  return <>{children}</>;
};