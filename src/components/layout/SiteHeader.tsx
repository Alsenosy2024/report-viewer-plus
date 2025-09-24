import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { Sparkles, Home } from "lucide-react";
import { cn } from "@/lib/utils";

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
    location.pathname.startsWith('/social-posts');

  return (
    <>
      <header className={cn(
        "sticky top-0 z-40 w-full border-b border-primary/20",
        "glass-intense backdrop-blur-xl shadow-glass h-header",
        "transition-all duration-300"
      )}>
        <div className="container flex h-full items-center justify-between">
          <div className="flex items-center gap-4">
            {isDashboard && <SidebarTrigger className="animate-bounce-in" />}
            
            <Link 
              to="/" 
              className={cn(
                "flex items-center gap-3 text-xl font-bold",
                "hover:scale-105 transition-all duration-300",
                "text-shimmer group"
              )}
            >
              <div className="relative">
                <Sparkles className="w-6 h-6 text-primary animate-pulse-glow" />
                <div className="absolute inset-0 animate-spin-slow">
                  <Sparkles className="w-6 h-6 text-accent/50" />
                </div>
              </div>
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Professional Engineers
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="glass" 
                    className={cn(
                      "relative h-10 w-auto px-4 rounded-full",
                      "hover:shadow-glow transition-all duration-300 stagger-fade"
                    )}
                  >
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {getInitials(profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {profile?.full_name || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-64 glass-intense border-primary/20 animate-scale-in"
                >
                  <div className="p-3 border-b border-primary/20">
                    <p className="font-medium text-shimmer">
                      {profile?.full_name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuItem 
                    onClick={() => navigate('/dashboard')}
                    className="hover:bg-primary/10 interactive"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate('/social-posts')}
                    className="hover:bg-primary/10 interactive"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Social Posts
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={signOut}
                    className="text-error hover:bg-error/10 interactive"
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => navigate('/auth')}
                variant="neon"
                className="animate-pulse-glow"
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {isDashboard && <FloatingActionButton />}
    </>
  );
}
