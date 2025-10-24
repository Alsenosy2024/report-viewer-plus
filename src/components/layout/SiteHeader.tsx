import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Settings } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function SiteHeader() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name.split(' ').map((n) => n.charAt(0)).join('').toUpperCase();
  };

  const isDashboard = location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/whatsapp-reports') ||
    location.pathname.startsWith('/productivity-reports') ||
    location.pathname.startsWith('/ads-reports') ||
    location.pathname.startsWith('/mail-reports') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/bots') ||
    location.pathname.startsWith('/social-posts') ||
    location.pathname.startsWith('/meeting-summary');

  return (
    <header className="bg-card border-b border-card-border h-header sticky top-0 z-50 backdrop-blur-sm bg-card/80">
      <div className="container h-full flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
          {isDashboard && (
            <SidebarTrigger className="mr-1" aria-label="Open menu" />
          )}
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group min-w-0" aria-label="Professional Engineers home">
            <img
              src="/lovable-uploads/7022dd5f-ca4d-4d4b-83f0-c5811cbca595.png"
              alt="Professional Engineers logo"
              className="h-8 w-auto"
              loading="lazy"
            />
            <span className="hidden sm:inline text-sm md:text-lg font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors max-w-[40vw] md:max-w-none truncate">
              Professional Engineers
            </span>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!user && (
            <Button variant="default" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/auth')}>
              Sign in
            </Button>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full" aria-label="Account menu">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-dashboard-primary text-dashboard-primary-foreground">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || user.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/dashboard')}>Go to Dashboard</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/social-posts')}>Social Media Posts</DropdownMenuItem>
                {profile?.role === 'admin' && (
                  <DropdownMenuItem onSelect={() => navigate('/admin/settings')}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {!isDashboard && (
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
