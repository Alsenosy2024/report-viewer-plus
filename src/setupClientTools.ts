import { NavigationController } from '@/utils/NavigationController';

// Eagerly register ElevenLabs client tools on window so the widget can call them
(() => {
  if (typeof window === 'undefined') return;

  const clientTools = {
    // Navigation tools
    navigate_to_dashboard: () => NavigationController.navigate('/dashboard').message,
    navigate_to_home: () => NavigationController.navigate('/').message,
    open_whatsapp_reports: () => NavigationController.navigate('/whatsapp-reports').message,
    open_productivity_reports: () => NavigationController.navigate('/productivity-reports').message,
    open_ads_reports: () => NavigationController.navigate('/ads-reports').message,
    open_mail_reports: () => NavigationController.navigate('/mail-reports').message,
    open_admin_settings: () => NavigationController.navigate('/admin/settings').message,
    open_bot_controls: () => NavigationController.navigate('/bots').message,
    open_social_posts: () => NavigationController.navigate('/social-posts').message,
    open_courses_prices: () => NavigationController.navigate('/courses-prices').message,

    // Dashboard actions
    refresh_dashboard: () => NavigationController.refreshDashboard().message,

    // Utility tools
    scroll_to_top: () => NavigationController.scrollToTop().message,
    get_current_page: () => NavigationController.getCurrentPage().message,

    // Help tool
    list_available_pages: () => `Available pages you can navigate to:
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
      
      You can also refresh the dashboard or scroll to top of any page.`,
  } as const;

  Object.entries(clientTools).forEach(([key, func]) => {
    (window as any)[key] = func;
  });

  // Also expose under a dedicated namespace for ElevenLabs
  (window as any).elevenlabsClientTools = clientTools;

  // Mark as ready and notify listeners
  (window as any).__client_tools_registered__ = true;
  try {
    window.dispatchEvent(new Event('client-tools-ready'));
  } catch (e) {
    console.warn('⚠️ Unable to dispatch client-tools-ready event', e);
  }
  console.log('✅ (eager) Navigation tools registered globally:', Object.keys(clientTools));
  console.log('✅ (eager) elevenlabsClientTools namespace available:', typeof (window as any).elevenlabsClientTools);
})();

export {};
