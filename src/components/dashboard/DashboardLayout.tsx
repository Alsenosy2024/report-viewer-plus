import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, BarChart3, MessageSquare, Bot, Mail, TrendingUp, Share2, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const isMobile = useIsMobile();

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
    { icon: Share2, label: 'Social Posts', path: '/social-posts' },
    { icon: BookOpen, label: 'Courses & Prices', path: '/courses-prices' },
    ...(profile?.role === 'admin' ? [{ icon: Settings, label: 'Settings', path: '/admin/settings' }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {/* Header removed: global SiteHeader used */}

      <div className="flex">
        {/* Sidebar */}
        <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuButton asChild>
                         <NavLink
                           to={item.path || "#"}
                           end
                           className={({ isActive }) =>
                             isActive
                               ? "bg-muted text-primary font-medium"
                               : "hover:bg-muted/50"
                           }
                           onClick={(e) => {
                             if (!item.path) e.preventDefault();
                             // Close sidebar on mobile after navigation
                             if (isMobile && item.path) {
                               setTimeout(() => setOpenMobile(false), 100);
                             }
                           }}
                        >
                          <item.icon className="mr-3 h-4 w-4" />
                          {!isCollapsed && <span>{item.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};