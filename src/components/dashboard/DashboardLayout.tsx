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
    { icon: Bot, label: 'Bot Controls', path: '/bots', section: 'bot_controls' },
    ...(profile?.role === 'admin' ? [{ icon: Settings, label: 'Settings', path: '/admin/settings' }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {/* Header removed: global SiteHeader used */}

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