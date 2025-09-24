interface NavigationResponse {
  success: boolean;
  message: string;
}

export class NavigationController {
  static navigate(path: string): NavigationResponse {
    try {
      window.location.href = path;
      return {
        success: true,
        message: `Navigated to ${path}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to navigate to ${path}: ${error}`
      };
    }
  }

  static refreshDashboard(): NavigationResponse {
    try {
      // Trigger the dashboard refresh button click
      const refreshButton = document.querySelector('[data-refresh-dashboard]') as HTMLButtonElement;
      if (refreshButton && !refreshButton.disabled) {
        refreshButton.click();
        return {
          success: true,
          message: "Dashboard refresh initiated - 5 minute timer started"
        };
      } else if (refreshButton?.disabled) {
        return {
          success: false,
          message: "Dashboard is currently refreshing, please wait"
        };
      } else {
        return {
          success: false,
          message: "Dashboard refresh button not found - make sure you're on the dashboard page"
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to refresh dashboard: ${error}`
      };
    }
  }

  static scrollToTop(): NavigationResponse {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return {
        success: true,
        message: "Scrolled to top of page"
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to scroll: ${error}`
      };
    }
  }

  static getCurrentPage(): NavigationResponse {
    try {
      const path = window.location.pathname;
      const pageNames: { [key: string]: string } = {
        '/': 'Home/Index',
        '/dashboard': 'Smart Dashboard',
        '/whatsapp-reports': 'WhatsApp Reports',
        '/productivity-reports': 'Productivity Reports',
        '/ads-reports': 'Ads Reports',
        '/mail-reports': 'Mail Reports',
        '/admin/settings': 'Admin Settings',
        '/bots': 'Bot Controls',
        '/social-posts': 'Social Media Posts',
        '/courses-prices': 'Courses & Prices',
        '/auth': 'Authentication',
        '/awaiting-approval': 'Awaiting Approval'
      };
      
      const pageName = pageNames[path] || 'Unknown Page';
      return {
        success: true,
        message: `Currently on: ${pageName} (${path})`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get current page: ${error}`
      };
    }
  }
}