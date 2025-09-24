import { NavigationController } from '@/utils/NavigationController';
import { useEffect } from 'react';

export const useNavigationTools = () => {
  const clientTools = {
    // Navigation tools
    navigate_to_dashboard: () => {
      return NavigationController.navigate('/dashboard').message;
    },

    navigate_to_home: () => {
      return NavigationController.navigate('/').message;
    },

    open_whatsapp_reports: () => {
      return NavigationController.navigate('/whatsapp-reports').message;
    },

    open_productivity_reports: () => {
      return NavigationController.navigate('/productivity-reports').message;
    },

    open_ads_reports: () => {
      return NavigationController.navigate('/ads-reports').message;
    },

    open_mail_reports: () => {
      return NavigationController.navigate('/mail-reports').message;
    },

    open_admin_settings: () => {
      return NavigationController.navigate('/admin/settings').message;
    },

    open_bot_controls: () => {
      return NavigationController.navigate('/bots').message;
    },

    open_social_posts: () => {
      return NavigationController.navigate('/social-posts').message;
    },

    open_courses_prices: () => {
      return NavigationController.navigate('/courses-prices').message;
    },

    // Dashboard actions
    refresh_dashboard: () => {
      return NavigationController.refreshDashboard().message;
    },

    // Utility tools
    scroll_to_top: () => {
      return NavigationController.scrollToTop().message;
    },

    get_current_page: () => {
      return NavigationController.getCurrentPage().message;
    },

    // Help tool
    list_available_pages: () => {
      return `Available pages you can navigate to:
      - Dashboard (/dashboard) - Main analytics dashboard
      - WhatsApp Reports (/whatsapp-reports) - WhatsApp analytics
      - Productivity Reports (/productivity-reports) - Productivity analytics  
      - Ads Reports (/ads-reports) - Advertisement analytics
      - Mail Reports (/mail-reports) - Email analytics
      - Admin Settings (/admin/settings) - System administration
      - Bot Controls (/bots) - Bot management
      - Social Posts (/social-posts) - Social media management
      - Courses & Prices (/courses-prices) - Course pricing management
      - Home (/) - Main landing page
      
      You can also refresh the dashboard or scroll to top of any page.`;
    }
  };

  // Register client tools globally so ElevenLabs can access them
  useEffect(() => {
    // Ensure window object exists (for SSR compatibility)
    if (typeof window !== 'undefined') {
      console.log('🔧 Registering navigation tools...');
      
      // Register each tool on the window object
      Object.entries(clientTools).forEach(([key, func]) => {
        (window as any)[key] = func;
        console.log(`✅ Registered: ${key}`);
      });

      console.log('✅ All navigation tools registered:', Object.keys(clientTools));
      
      // Test one tool to make sure it works
      setTimeout(() => {
        try {
          console.log('🧪 Testing navigation tools...');
          const testResult = (window as any).get_current_page();
          console.log('✅ Navigation tools test successful:', testResult);
          
          // Verify all tools are accessible
          Object.keys(clientTools).forEach(key => {
            if (typeof (window as any)[key] === 'function') {
              console.log(`✓ ${key} is available`);
            } else {
              console.error(`✗ ${key} is NOT available`);
            }
          });
        } catch (error) {
          console.error('❌ Navigation tools test failed:', error);
        }
      }, 500);
    }
  }, []);

  return { clientTools };
};