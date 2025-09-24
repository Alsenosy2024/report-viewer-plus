import { NavigationController } from '@/utils/NavigationController';

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

  return { clientTools };
};