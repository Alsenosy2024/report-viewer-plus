import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const ConvAINavigator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Define navigation functions that will be called by ElevenLabs agent
    const navigationTools = {
      open_dashboard: () => {
        navigate('/dashboard');
        toast({ title: "Navigating to Dashboard" });
        return "Navigated to dashboard successfully";
      },
      show_whatsapp_reports: () => {
        navigate('/whatsapp-reports');
        toast({ title: "Navigating to WhatsApp Reports" });
        return "Navigated to WhatsApp reports successfully";
      },
      show_productivity_reports: () => {
        navigate('/productivity-reports');
        toast({ title: "Navigating to Productivity Reports" });
        return "Navigated to productivity reports successfully";
      },
      show_ads_reports: () => {
        navigate('/ads-reports');
        toast({ title: "Navigating to Ads Reports" });
        return "Navigated to ads reports successfully";
      },
      show_mail_reports: () => {
        navigate('/mail-reports');
        toast({ title: "Navigating to Mail Reports" });
        return "Navigated to mail reports successfully";
      },
      open_admin_settings: () => {
        navigate('/admin/settings');
        toast({ title: "Navigating to Admin Settings" });
        return "Navigated to admin settings successfully";
      },
      open_bots: () => {
        navigate('/bots');
        toast({ title: "Navigating to Bot Controls" });
        return "Navigated to bot controls successfully";
      },
      show_social_posts: () => {
        navigate('/social-posts');
        toast({ title: "Navigating to Social Media Posts" });
        return "Navigated to social media posts successfully";
      },
      show_content_ideas: () => {
        navigate('/content-ideas');
        toast({ title: "Navigating to Content Ideas" });
        return "Navigated to content ideas successfully";
      },
      show_courses_prices: () => {
        navigate('/courses-prices');
        toast({ title: "Navigating to Courses & Prices" });
        return "Navigated to courses and prices successfully";
      },
      go_home: () => {
        navigate('/');
        toast({ title: "Navigating to Home" });
        return "Navigated to home successfully";
      }
    };

    // Register navigation tools globally for ElevenLabs ConvAI
    (window as any).convaiNavigationTools = navigationTools;

    // Listen for custom events from ElevenLabs widget (alternative approach)
    const handleConvAIMessage = (event: MessageEvent) => {
      if (event.data?.type === 'elevenlabs-convai-navigation') {
        const command = event.data.command;
        const tool = (navigationTools as any)[command];
        if (tool) {
          tool();
        }
      }
    };

    window.addEventListener('message', handleConvAIMessage);

    return () => {
      window.removeEventListener('message', handleConvAIMessage);
      delete (window as any).convaiNavigationTools;
    };
  }, [navigate, toast]);

  return null;
};
