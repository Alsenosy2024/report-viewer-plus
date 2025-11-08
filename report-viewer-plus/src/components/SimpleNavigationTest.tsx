import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// Initialize immediately on module load
if (typeof window !== 'undefined') {
  (window as any).navTest = (window as any).navTest || {};
  console.log('[SimpleNavTest] Module loaded - navTest object initialized');
}

/**
 * Simplified navigation tester - registers navigation functions on window
 * This is a debug component to test if navigation tools can be registered
 */
export const SimpleNavigationTest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('[SimpleNavTest] Component mounted, registering navigation tools...');

    // Ensure window.navTest exists
    if (!(window as any).navTest) {
      (window as any).navTest = {};
    }

    // Register navigation tools
    (window as any).navTest = {
      open_dashboard: () => {
        console.log('[SimpleNavTest] open_dashboard called!');
        navigate('/dashboard');
        toast({ title: "Navigation Test", description: "Navigating to dashboard" });
        return "Success";
      },
      show_whatsapp_reports: () => {
        console.log('[SimpleNavTest] show_whatsapp_reports called!');
        navigate('/whatsapp-reports');
        toast({ title: "Navigation Test", description: "Navigating to WhatsApp reports" });
        return "Success";
      },
      test: () => {
        console.log('[SimpleNavTest] Test function called!');
        toast({ title: "Navigation Test", description: "Test successful!" });
        return "Test function works!";
      }
    };

    console.log('[SimpleNavTest] Tools registered on window.navTest');
    console.log('[SimpleNavTest] Try: window.navTest.test()');

    return () => {
      console.log('[SimpleNavTest] Cleanup - but NOT removing tools');
      // Intentionally not removing tools so they persist
    };
  }, [navigate, toast]);

  return null;
};
