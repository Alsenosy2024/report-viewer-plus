import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, BarChart3, MessageSquare, Bot, Mail, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLocation, useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const navigationItems = [
    { icon: BarChart3, label: 'Overview', path: '/dashboard' },
    { icon: MessageSquare, label: 'WhatsApp Reports', path: '/whatsapp-reports', section: 'whatsapp_reports' },
    { icon: TrendingUp, label: 'Productivity Reports', path: '/productivity-reports', section: 'productivity_reports' },
    { icon: BarChart3, label: 'Ads Analysis', path: '/ads-reports', section: 'ads_reports' },
    { icon: Mail, label: 'Mail Reports', path: '/mail-reports', section: 'mail_reports' },
    ...(profile?.role === 'admin' ? [{ icon: Settings, label: 'Settings', path: '/admin/settings' }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-card-border h-header sticky top-0 z-50 backdrop-blur-sm bg-card/80">
        <div className="flex items-center justify-between px-6 h-full">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-dashboard-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Analytics & Control Center</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-dashboard-primary text-dashboard-primary-foreground">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-dashboard-primary text-dashboard-primary-foreground text-sm">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">{profile?.full_name || user?.email}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-sidebar bg-sidebar border-r border-sidebar-border min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-2">
            {navigationItems.map((item, index) => {
              const isActive = item.path ? location.pathname === item.path : false;
              return (
                <Button
                  key={index}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start transition-smooth ${
                    isActive 
                      ? 'bg-gradient-primary text-dashboard-primary-foreground shadow-md' 
                      : 'hover:bg-sidebar-accent text-sidebar-foreground'
                  }`}
                  onClick={() => item.path && navigate(item.path)}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};