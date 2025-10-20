import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/components/ui/sidebar';
import { NavigationTools, ElevenLabsConvAIMessage } from '@/types/elevenlabs';

export const ConvAINavigator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const { toggleSidebar, setOpen, setOpenMobile, isMobile } = useSidebar();

  useEffect(() => {
    // Define navigation functions that will be called by ElevenLabs agent
    const navigationTools: NavigationTools = {
      // ==================== PAGE NAVIGATION ====================
      open_dashboard: () => {
        navigate('/dashboard');
        toast({ title: "Opening Dashboard", description: "Navigating to your dashboard overview" });
        return "Navigated to dashboard successfully";
      },
      show_whatsapp_reports: () => {
        navigate('/whatsapp-reports');
        toast({ title: "Opening WhatsApp Reports", description: "Loading WhatsApp analytics" });
        return "Navigated to WhatsApp reports successfully";
      },
      show_productivity_reports: () => {
        navigate('/productivity-reports');
        toast({ title: "Opening Productivity Reports", description: "Loading productivity metrics" });
        return "Navigated to productivity reports successfully";
      },
      show_ads_reports: () => {
        navigate('/ads-reports');
        toast({ title: "Opening Ads Reports", description: "Loading advertising analytics" });
        return "Navigated to ads reports successfully";
      },
      show_mail_reports: () => {
        navigate('/mail-reports');
        toast({ title: "Opening Mail Reports", description: "Loading email analytics" });
        return "Navigated to mail reports successfully";
      },
      open_admin_settings: () => {
        navigate('/admin/settings');
        toast({ title: "Opening Admin Settings", description: "Loading administrative controls" });
        return "Navigated to admin settings successfully";
      },
      open_bots: () => {
        navigate('/bots');
        toast({ title: "Opening Bot Controls", description: "Loading bot management panel" });
        return "Navigated to bot controls successfully";
      },
      show_social_posts: () => {
        navigate('/social-posts');
        toast({ title: "Opening Social Posts", description: "Loading social media content" });
        return "Navigated to social media posts successfully";
      },
      show_content_ideas: () => {
        navigate('/content-ideas');
        toast({ title: "Opening Content Ideas", description: "Loading content suggestions" });
        return "Navigated to content ideas successfully";
      },
      show_courses_prices: () => {
        navigate('/courses-prices');
        toast({ title: "Opening Courses & Prices", description: "Loading course information" });
        return "Navigated to courses and prices successfully";
      },
      go_home: () => {
        navigate('/');
        toast({ title: "Going Home", description: "Navigating to home page" });
        return "Navigated to home successfully";
      },

      // ==================== BROWSER CONTROLS ====================
      go_back: () => {
        if (window.history.length > 1) {
          navigate(-1);
          toast({ title: "Going Back", description: "Navigating to previous page" });
          return "Navigated back successfully";
        }
        toast({ title: "Cannot Go Back", description: "No previous page in history", variant: "destructive" });
        return "No previous page to navigate to";
      },
      go_forward: () => {
        navigate(1);
        toast({ title: "Going Forward", description: "Navigating to next page" });
        return "Navigated forward successfully";
      },
      refresh_page: () => {
        window.location.reload();
        toast({ title: "Refreshing Page", description: "Reloading current page" });
        return "Page refresh initiated";
      },

      // ==================== UI CONTROLS ====================
      toggle_sidebar: () => {
        toggleSidebar();
        toast({ title: "Toggling Sidebar", description: "Sidebar visibility changed" });
        return "Sidebar toggled successfully";
      },
      open_sidebar: () => {
        if (isMobile) {
          setOpenMobile(true);
        } else {
          setOpen(true);
        }
        toast({ title: "Opening Sidebar", description: "Navigation sidebar opened" });
        return "Sidebar opened successfully";
      },
      close_sidebar: () => {
        if (isMobile) {
          setOpenMobile(false);
        } else {
          setOpen(false);
        }
        toast({ title: "Closing Sidebar", description: "Navigation sidebar closed" });
        return "Sidebar closed successfully";
      },

      // ==================== AUTHENTICATION ====================
      sign_out: async () => {
        try {
          await signOut();
          toast({ title: "Signing Out", description: "Logging you out..." });
          return "Successfully signed out";
        } catch (error) {
          console.error('Sign out error:', error);
          toast({
            title: "Sign Out Failed",
            description: "There was an error signing out. Please try again.",
            variant: "destructive"
          });
          return "Failed to sign out";
        }
      },
      logout: async () => {
        // Alias for sign_out
        try {
          await signOut();
          toast({ title: "Logging Out", description: "Goodbye!" });
          return "Successfully logged out";
        } catch (error) {
          console.error('Logout error:', error);
          toast({
            title: "Logout Failed",
            description: "There was an error logging out. Please try again.",
            variant: "destructive"
          });
          return "Failed to logout";
        }
      },

      // ==================== UTILITY COMMANDS ====================
      where_am_i: () => {
        const currentPath = location.pathname;
        const pageNames: Record<string, string> = {
          '/': 'Home Page',
          '/dashboard': 'Dashboard Overview',
          '/whatsapp-reports': 'WhatsApp Reports',
          '/productivity-reports': 'Productivity Reports',
          '/ads-reports': 'Ads Reports',
          '/mail-reports': 'Mail Reports',
          '/admin/settings': 'Admin Settings',
          '/bots': 'Bot Controls',
          '/social-posts': 'Social Media Posts',
          '/content-ideas': 'Content Ideas',
          '/courses-prices': 'Courses & Prices',
          '/auth': 'Authentication',
          '/awaiting-approval': 'Awaiting Approval',
        };
        const pageName = pageNames[currentPath] || 'Unknown Page';
        toast({
          title: "Current Location",
          description: `You are on: ${pageName}`
        });
        return `You are currently on the ${pageName}`;
      },
      help: () => {
        const helpMessage = `Available voice commands:

Navigation:
- "Open dashboard" or "Go to dashboard"
- "Show WhatsApp reports"
- "Show productivity reports"
- "Show ads reports"
- "Show mail reports"
- "Open bot controls"
- "Show social posts"
- "Show content ideas"
- "Show courses and prices"
- "Go home"
${user ? '- "Open admin settings" (admin only)' : ''}

Browser Controls:
- "Go back"
- "Go forward"
- "Refresh page"

UI Controls:
- "Toggle sidebar"
- "Open sidebar"
- "Close sidebar"

Other:
- "Where am I?" - Get current page
- "Sign out" or "Logout"
- "Help" - Show this message`;

        toast({
          title: "Voice Commands Help",
          description: "Available commands listed in console",
          duration: 5000
        });
        console.log(helpMessage);
        return helpMessage;
      },
    };

    // Register navigation tools globally for ElevenLabs ConvAI
    // ElevenLabs expects tools on window.client object
    if (!window.client) {
      (window as any).client = {};
    }

    // Register each tool on window.client for ElevenLabs ConvAI widget
    Object.keys(navigationTools).forEach(key => {
      (window as any).client[key] = navigationTools[key];
    });

    // Also keep the old reference for backward compatibility
    window.convaiNavigationTools = navigationTools;

    // Log available commands for debugging
    console.log('[ConvAI Navigator] Initialized with commands:', Object.keys(navigationTools));
    console.log('[ConvAI Navigator] Tools registered on window.client:', Object.keys((window as any).client));

    // Listen for custom events from ElevenLabs widget
    const handleConvAIMessage = (event: MessageEvent<ElevenLabsConvAIMessage>) => {
      if (event.data?.type === 'elevenlabs-convai-navigation' ||
          event.data?.type === 'elevenlabs-convai-command') {
        const command = event.data.command;
        console.log('[ConvAI Navigator] Received command:', command);

        const tool = navigationTools[command];
        if (tool) {
          try {
            const result = tool();
            console.log('[ConvAI Navigator] Command executed successfully:', command, result);
          } catch (error) {
            console.error('[ConvAI Navigator] Error executing command:', command, error);
            toast({
              title: "Command Error",
              description: `Failed to execute: ${command}`,
              variant: "destructive"
            });
          }
        } else {
          console.warn('[ConvAI Navigator] Unknown command:', command);
          toast({
            title: "Unknown Command",
            description: `Command not recognized: ${command}. Say "help" for available commands.`,
            variant: "destructive"
          });
        }
      }
    };

    window.addEventListener('message', handleConvAIMessage);

    return () => {
      window.removeEventListener('message', handleConvAIMessage);

      // Clean up window.client tools
      if ((window as any).client) {
        Object.keys(navigationTools).forEach(key => {
          delete (window as any).client[key];
        });
      }

      delete window.convaiNavigationTools;
      console.log('[ConvAI Navigator] Cleanup complete');
    };
  }, [navigate, toast, signOut, user, location, toggleSidebar, setOpen, setOpenMobile, isMobile]);

  return null;
};
