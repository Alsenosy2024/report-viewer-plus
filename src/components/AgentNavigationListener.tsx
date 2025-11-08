import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useRoomContext, useDataChannel } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { useVoiceAssistantContext } from '@/contexts/VoiceAssistantContext';

interface NavigationMessage {
  type: "agent-navigation-url";
  url: string;
  pathname?: string;  // Optional: direct pathname from agent
}

/**
 * Component that listens for navigation URLs from the LiveKit voice agent
 * and executes them on the frontend.
 *
 * This component hooks into the existing LiveKit room connection created by
 * the VoiceAssistantModal. No additional configuration needed - it will
 * automatically start listening when the user connects to the voice assistant.
 *
 * The agent sends full URLs (e.g., "https://preview--report-viewer-plus.lovable.app/dashboard")
 * and this component extracts the pathname and navigates using React Router.
 */
export const AgentNavigationListener = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const room = useRoomContext();
  const { transcript } = useVoiceAssistantContext();
  
  // Track navigation state to prevent duplicates and race conditions
  const lastNavigationRef = useRef<{ pathname: string; timestamp: number } | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingNavigationRef = useRef<string | null>(null);
  const navigationAttemptRef = useRef<number>(0);
  const lastNavigationPathRef = useRef<string | null>(null); // Track last navigated path to prevent duplicates
  const NAVIGATION_DEBOUNCE_MS = 0; // No debounce - execute immediately
  const DUPLICATE_WINDOW_MS = 1000; // 1 second window for duplicate detection
  const navigationCommandTimestamps = useRef<Map<string, number>>(new Map());
  // CRITICAL: Track all active navigation timeouts/verifications to cancel them on new navigation
  const activeNavigationTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const activeNavigationAttemptRef = useRef<{ pathname: string; attemptId: number } | null>(null);
  
  // Message queue to handle messages that arrive before listener is ready
  const messageQueueRef = useRef<Array<{ payload: Uint8Array; participant?: any; kind?: any; topic?: string }>>([]);
  const listenerReadyRef = useRef<boolean>(false);
  const processQueueTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  console.log('[Agent Navigation] Component rendered', {
    hasRoom: !!room,
    roomState: room?.state,
    currentPath: location.pathname,
    participants: room?.remoteParticipants.size,
    participantIdentities: room ? Array.from(room.remoteParticipants.values()).map(p => p.identity) : []
  });
  
  // Define all valid routes in the application
  const VALID_ROUTES = [
    '/',
    '/auth',
    '/awaiting-approval',
    '/dashboard',
    '/whatsapp-reports',
    '/productivity-reports',
    '/ads-reports',
    '/mail-reports',
    '/admin/settings',
    '/bots',
    '/social-posts',
    '/content-ideas',
    '/meeting-summary',
    '/courses-prices',
  ] as const;

  // Route aliases and variations for fuzzy matching
  const ROUTE_ALIASES: Record<string, string> = {
    // Dashboard
    'dashboard': '/dashboard',
    'داشبورد': '/dashboard',
    'overview': '/dashboard',
    'home': '/dashboard',
    'main': '/dashboard',
    
    // WhatsApp
    'whatsapp': '/whatsapp-reports',
    'واتساب': '/whatsapp-reports',
    'whatsapp reports': '/whatsapp-reports',
    'whatsapp-reports': '/whatsapp-reports',
    
    // Productivity
    'productivity': '/productivity-reports',
    'إنتاجية': '/productivity-reports',
    'productivity reports': '/productivity-reports',
    'productivity-reports': '/productivity-reports',
    
    // Ads
    'ads': '/ads-reports',
    'إعلانات': '/ads-reports',
    'ads reports': '/ads-reports',
    'ads-reports': '/ads-reports',
    'advertising': '/ads-reports',
    
    // Mail
    'mail': '/mail-reports',
    'بريد': '/mail-reports',
    'mail reports': '/mail-reports',
    'mail-reports': '/mail-reports',
    'email': '/mail-reports',
    
    // Admin Settings
    'settings': '/admin/settings',
    'إعدادات': '/admin/settings',
    'admin': '/admin/settings',
    'admin settings': '/admin/settings',
    'admin/settings': '/admin/settings',
    
    // Bots
    'bots': '/bots',
    'بوتات': '/bots',
    'bot controls': '/bots',
    'bot-controls': '/bots',
    
    // Social Posts
    'social': '/social-posts',
    'social posts': '/social-posts',
    'social-posts': '/social-posts',
    'social media': '/social-posts',
    
    // Content Ideas
    'content': '/content-ideas',
    'content ideas': '/content-ideas',
    'content-ideas': '/content-ideas',
    'ideas': '/content-ideas',
    
    // Meeting Summary
    'meeting': '/meeting-summary',
    'meeting summary': '/meeting-summary',
    'meeting-summary': '/meeting-summary',
    'meetings': '/meeting-summary',
    
    // Courses & Prices
    'courses': '/courses-prices',
    'courses prices': '/courses-prices',
    'courses-prices': '/courses-prices',
    'prices': '/courses-prices',
    'pricing': '/courses-prices',
  };
  
  // Helper function to normalize pathname (remove trailing slashes, etc.)
  const normalizePathname = useCallback((pathname: string): string => {
    // Remove trailing slash except for root
    let normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    // Ensure it starts with /
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }
    return normalized;
  }, []);

  // Helper function to find the closest matching route
  const findClosestRoute = useCallback((input: string): string | null => {
    console.log('[Agent Navigation] 🔍 Finding closest route for:', input);
    
    // Normalize input
    const normalized = input.toLowerCase().trim().replace(/[^\w\s\/-]/g, '');
    console.log('[Agent Navigation] Normalized input:', normalized);
    
    // Check exact match first
    if (VALID_ROUTES.includes(input as any)) {
      console.log('[Agent Navigation] ✅ Exact route match:', input);
      return input;
    }
    
    // Check normalized exact match
    const normalizedInput = normalizePathname(input);
    if (VALID_ROUTES.includes(normalizedInput as any)) {
      console.log('[Agent Navigation] ✅ Normalized exact match:', normalizedInput);
      return normalizedInput;
    }
    
    // Check aliases
    for (const [alias, route] of Object.entries(ROUTE_ALIASES)) {
      if (normalized.includes(alias.toLowerCase()) || input.toLowerCase().includes(alias.toLowerCase())) {
        console.log('[Agent Navigation] ✅ Found route via alias:', alias, '->', route);
        return route;
      }
    }
    
    // Fuzzy matching - find route with highest similarity
    let bestMatch: { route: string; score: number } | null = null;
    
    for (const route of VALID_ROUTES) {
      const routeParts = route.split('/').filter(Boolean);
      const inputParts = normalized.split(/[/\s-]+/).filter(Boolean);
      
      let score = 0;
      for (const inputPart of inputParts) {
        for (const routePart of routeParts) {
          if (routePart.includes(inputPart) || inputPart.includes(routePart)) {
            score += 1;
          }
          // Check for partial matches
          if (routePart.startsWith(inputPart) || inputPart.startsWith(routePart)) {
            score += 0.5;
          }
        }
      }
      
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { route, score };
      }
    }
    
    if (bestMatch && bestMatch.score > 0) {
      console.log('[Agent Navigation] ✅ Found route via fuzzy matching:', bestMatch.route, 'score:', bestMatch.score);
      return bestMatch.route;
    }
    
    // Last resort: check if input contains any route path
    for (const route of VALID_ROUTES) {
      const routeKey = route.replace(/^\//, '').replace(/\//g, '-');
      if (normalized.includes(routeKey) || normalized.includes(route.replace(/\//g, ' '))) {
        console.log('[Agent Navigation] ✅ Found route via substring match:', route);
        return route;
      }
    }
    
    console.warn('[Agent Navigation] ❌ No route match found for:', input);
    return null;
  }, [normalizePathname]);
  
  // Helper function to navigate to a URL string (defined first)
  const navigateToUrlFromString = useCallback((urlString: string) => {
    console.log('[Agent Navigation] 🚀🚀🚀 STARTING NAVIGATION FLOW 🚀🚀🚀');
    console.log('[Agent Navigation] Input:', urlString);
    console.log('[Agent Navigation] Current location:', window.location.pathname);
    console.log('[Agent Navigation] React Router location:', location.pathname);
    
    try {
      let pathname: string;
      
      // Step 1: Extract pathname from URL or use as-is
      if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
        const url = new URL(urlString);
        pathname = url.pathname;
        console.log('[Agent Navigation] Extracted pathname from URL:', pathname);
      } else {
        pathname = urlString.startsWith('/') ? urlString : `/${urlString}`;
        console.log('[Agent Navigation] Using pathname as-is:', pathname);
      }
      
      // Step 2: Normalize pathname
      pathname = normalizePathname(pathname);
      console.log('[Agent Navigation] Normalized pathname:', pathname);
      
      // Step 3: Validate and find closest route
      const validatedRoute = findClosestRoute(pathname);
      if (!validatedRoute) {
        console.error('[Agent Navigation] ❌ Could not find valid route for:', pathname);
        toast({
          title: "Navigation Error",
          description: `Could not find route: ${pathname}`,
          variant: "destructive"
        });
        return;
      }
      
      if (validatedRoute !== pathname) {
        console.log('[Agent Navigation] ⚠️ Route corrected:', pathname, '->', validatedRoute);
        pathname = validatedRoute;
      }
      
      console.log('[Agent Navigation] ✅ Final validated route:', pathname);
      
      const currentPath = normalizePathname(location.pathname);
      console.log('[Agent Navigation] Current path:', currentPath);
      
      // Check if already on target page
      if (pathname === currentPath) {
        console.log(`[Agent Navigation] Already on target page: ${pathname}, skipping navigation`);
        toast({
          title: "Already Here",
          description: `You're already on ${pathname}`,
        });
        return;
      }
      
      // Check if this is a duplicate navigation (same path within duplicate window)
      const now = Date.now();
      if (lastNavigationRef.current && 
          lastNavigationRef.current.pathname === pathname &&
          (now - lastNavigationRef.current.timestamp) < DUPLICATE_WINDOW_MS) {
        console.log(`[Agent Navigation] ⚠️ Duplicate navigation detected for ${pathname} (within ${DUPLICATE_WINDOW_MS}ms), ignoring`);
        pendingNavigationRef.current = null; // Clear pending since we're skipping
        return;
      }
      
      // CRITICAL: Clear lastNavigationPathRef BEFORE setting new navigation
      // This prevents the system from thinking we're already on a path
      if (lastNavigationPathRef.current && lastNavigationPathRef.current !== pathname) {
        console.log(`[Agent Navigation] 🧹 Clearing old navigation path: ${lastNavigationPathRef.current} before navigating to: ${pathname}`);
        lastNavigationPathRef.current = null;
        lastExtractedPathRef.current = null;
      }
      
      // CRITICAL: Cancel ALL pending navigation operations (timeouts, retries, verifications)
      // This prevents old navigation from completing when a new one arrives
      if (pendingNavigationRef.current && pendingNavigationRef.current !== pathname) {
        console.log(`[Agent Navigation] ⚠️⚠️⚠️ CANCELLING ALL PENDING NAVIGATION OPERATIONS ⚠️⚠️⚠️`);
        console.log(`[Agent Navigation]   Old pending path: ${pendingNavigationRef.current}`);
        console.log(`[Agent Navigation]   New path: ${pathname}`);
        
        // Cancel main navigation timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
          navigationTimeoutRef.current = null;
        }
        
        // Cancel ALL active verification timeouts
        activeNavigationTimeoutsRef.current.forEach(timeout => {
          clearTimeout(timeout);
        });
        activeNavigationTimeoutsRef.current.clear();
        
        // Mark old navigation attempt as cancelled
        if (activeNavigationAttemptRef.current) {
          console.log(`[Agent Navigation] Cancelling navigation attempt ${activeNavigationAttemptRef.current.attemptId} for ${activeNavigationAttemptRef.current.pathname}`);
          activeNavigationAttemptRef.current = null;
        }
        
        // Clear old path references
        const oldPath = pendingNavigationRef.current;
        pendingNavigationRef.current = null;
        console.log(`[Agent Navigation] ✅ All pending operations cancelled`);
      }
      
      // CRITICAL: Also check if we're currently navigating to a different path
      const currentWindowPath = normalizePathname(window.location.pathname);
      if (currentWindowPath !== pathname && currentWindowPath !== normalizePathname(location.pathname)) {
        // We're mid-navigation to a different path - cancel it
        console.log(`[Agent Navigation] ⚠️ Mid-navigation detected - current window path: ${currentWindowPath}, target: ${pathname}`);
        if (pendingNavigationRef.current && pendingNavigationRef.current !== pathname) {
          console.log(`[Agent Navigation] Cancelling mid-navigation to: ${pendingNavigationRef.current}`);
          // Clear old path references
          lastNavigationPathRef.current = null;
          lastExtractedPathRef.current = null;
          pendingNavigationRef.current = null;
        }
      }
      
      // CRITICAL: Clear lastNavigationPathRef for the NEW path to allow immediate navigation
      // This prevents the system from thinking we're already on the target page
      if (lastNavigationPathRef.current === pathname) {
        console.log(`[Agent Navigation] Clearing lastNavigationPathRef for ${pathname} to allow fresh navigation`);
        lastNavigationPathRef.current = null;
        lastExtractedPathRef.current = null;
      }
      
      // Store pending navigation IMMEDIATELY to prevent other calls
      pendingNavigationRef.current = pathname;
      console.log(`[Agent Navigation] 📌 Set pending navigation to: ${pathname}`);
      
      // Store timestamp for this navigation command
      navigationCommandTimestamps.current.set(pathname, now);
      
      // Update last navigation timestamp
      lastNavigationRef.current = { pathname, timestamp: now };
      
      // Clear any existing timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      
      // Execute navigation immediately (no debounce)
      const executeNavigation = () => {
        // CRITICAL: Double-check pending navigation hasn't changed (race condition protection)
        if (pendingNavigationRef.current !== pathname) {
          console.log(`[Agent Navigation] ⚠️ Navigation cancelled - pending changed to: ${pendingNavigationRef.current}`);
          return;
        }
        
        // Double-check we're not already on this page (race condition protection)
        const currentPathCheck = normalizePathname(window.location.pathname);
        if (pathname === currentPathCheck) {
          console.log(`[Agent Navigation] Already navigated to ${pathname}, skipping`);
          pendingNavigationRef.current = null;
          return;
        }
        
        console.log(`[Agent Navigation] ✅✅✅ EXECUTING NAVIGATION NOW to: ${pathname} (from: ${currentPath})`);
        
        const pageNames: Record<string, string> = {
          '/': 'Home',
          '/dashboard': 'Dashboard',
          '/whatsapp-reports': 'WhatsApp Reports',
          '/productivity-reports': 'Productivity Reports',
          '/ads-reports': 'Ads Reports',
          '/mail-reports': 'Mail Reports',
          '/admin/settings': 'Admin Settings',
          '/bots': 'Bot Controls',
          '/social-posts': 'Social Posts',
          '/content-ideas': 'Content Ideas',
          '/meeting-summary': 'Meeting Summary',
          '/courses-prices': 'Courses & Prices',
          '/awaiting-approval': 'Awaiting Approval',
        };

        const pageName = pageNames[pathname] || pathname;
        
        // Retry logic for navigation - more aggressive
        const retryCountRef = { current: 0 };
        const maxRetries = 5; // Increased retries
        let navigationSucceeded = false;
        navigationAttemptRef.current++;
        const attemptId = navigationAttemptRef.current;
        
        // CRITICAL: Store active navigation attempt so we can cancel it
        activeNavigationAttemptRef.current = { pathname, attemptId };
        
        const attemptNavigation = () => {
          // CRITICAL: Check if this navigation attempt is still valid (not cancelled by new navigation)
          if (pendingNavigationRef.current !== pathname || activeNavigationAttemptRef.current?.attemptId !== attemptId) {
            console.log(`[Agent Navigation] ⚠️ Navigation cancelled - new path requested or attempt ID changed`);
            return;
          }
          
          if (navigationSucceeded) {
            console.log(`[Agent Navigation] ✅ Navigation already succeeded, skipping retry`);
            return;
          }
          
          // CRITICAL: Add a very small delay (10ms) before calling navigate() to allow time for newer commands to cancel this one
          // This prevents the flash when rapid navigation commands arrive within a few milliseconds
          setTimeout(() => {
            // CRITICAL: Check again after delay - navigation might have been cancelled during the delay
            if (pendingNavigationRef.current !== pathname || activeNavigationAttemptRef.current?.attemptId !== attemptId) {
              console.log(`[Agent Navigation] ⚠️⚠️⚠️ Navigation cancelled during delay - not calling navigate() ⚠️⚠️⚠️`);
              console.log(`[Agent Navigation]   Expected: ${pathname}`);
              console.log(`[Agent Navigation]   Current pending: ${pendingNavigationRef.current}`);
              console.log(`[Agent Navigation]   ABORTING completely`);
              return;
            }
            
            try {
              console.log(`[Agent Navigation] 🚀🚀🚀 NAVIGATION ATTEMPT ${retryCountRef.current + 1}/${maxRetries + 1} 🚀🚀🚀`);
              console.log(`[Agent Navigation] Target pathname:`, pathname);
              console.log(`[Agent Navigation] Current window.location.pathname:`, window.location.pathname);
              console.log(`[Agent Navigation] Current React Router location.pathname:`, location.pathname);
              console.log(`[Agent Navigation] Attempt ID:`, attemptId);
              
              // Verify route is still valid
              const routeCheck = findClosestRoute(pathname);
              if (!routeCheck || routeCheck !== pathname) {
                console.error(`[Agent Navigation] ❌ Route validation failed! Expected: ${pathname}, Got: ${routeCheck}`);
                if (routeCheck) {
                  console.log(`[Agent Navigation] Using corrected route:`, routeCheck);
                  pathname = routeCheck;
                }
              }
              
              // Try React Router navigation first - use replace to prevent history flash
              console.log(`[Agent Navigation] 📍 About to call navigate(${pathname}, { replace: true })...`);
              
              // CRITICAL: One final check before calling navigate() - ensure navigation wasn't cancelled
              if (pendingNavigationRef.current !== pathname || activeNavigationAttemptRef.current?.attemptId !== attemptId) {
                console.log(`[Agent Navigation] ⚠️⚠️⚠️ NAVIGATION CANCELLED BEFORE NAVIGATE() CALL ⚠️⚠️⚠️`);
                console.log(`[Agent Navigation]   Expected pathname: ${pathname}`);
                console.log(`[Agent Navigation]   Current pending: ${pendingNavigationRef.current}`);
                console.log(`[Agent Navigation]   Expected attempt ID: ${attemptId}`);
                console.log(`[Agent Navigation]   Current attempt ID: ${activeNavigationAttemptRef.current?.attemptId}`);
                console.log(`[Agent Navigation]   ABORTING - not calling navigate()`);
                return; // Don't call navigate() if cancelled
              }
              
              try {
                navigate(pathname, { replace: true }); // Use replace: true to prevent going back
                console.log(`[Agent Navigation] ✅ navigate() called successfully with replace: true`);
                console.log(`[Agent Navigation] React Router navigate function:`, typeof navigate);
              } catch (navError) {
                console.error(`[Agent Navigation] ❌ navigate() threw error:`, navError);
                console.error(`[Agent Navigation] Error stack:`, (navError as Error).stack);
                // Fallback to direct window.location.replace (no history entry)
                console.log(`[Agent Navigation] 🔄 Falling back to window.location.replace`);
                window.location.replace(pathname);
              }
            
            // Show toast immediately
        toast({
          title: "Voice Agent Navigation",
          description: `Opening ${pageName}`,
        });
            
            console.log(`[Agent Navigation] ✅✅✅ NAVIGATION CALLED: ${pathname} ✅✅✅`);
            
            // More aggressive verification with more checkpoints
            const verifyDelays = [50, 150, 300, 500, 800, 1200]; // More checkpoints
            let verified = false;
            
            verifyDelays.forEach((delay, index) => {
              const timeoutId = setTimeout(() => {
                // CRITICAL: Check if navigation was cancelled
                if (pendingNavigationRef.current !== pathname || activeNavigationAttemptRef.current?.attemptId !== attemptId) {
                  console.log(`[Agent Navigation] ⚠️ Verification cancelled - navigation changed`);
                  return;
                }
                
                if (navigationSucceeded || verified) {
                  console.log(`[Agent Navigation] ✅ Already verified, skipping check at ${delay}ms`);
                  return;
                }
                if (pendingNavigationRef.current !== pathname) {
                  console.log(`[Agent Navigation] ⚠️ Navigation cancelled, skipping check at ${delay}ms`);
                  return;
                }
                
                const actualWindowPath = normalizePathname(window.location.pathname);
                const actualRouterPath = normalizePathname(location.pathname);
                
                console.log(`[Agent Navigation] 🔍 Verification check at ${delay}ms:`);
                console.log(`[Agent Navigation]   Expected: ${pathname}`);
                console.log(`[Agent Navigation]   window.location.pathname: ${actualWindowPath}`);
                console.log(`[Agent Navigation]   React Router location.pathname: ${actualRouterPath}`);
                
                if (actualWindowPath === pathname || actualRouterPath === pathname) {
                  console.log(`[Agent Navigation] ✅✅✅ NAVIGATION VERIFIED at ${delay}ms! ✅✅✅`);
                  console.log(`[Agent Navigation] Successfully navigated to: ${pathname}`);
                  navigationSucceeded = true;
                  verified = true;
                  pendingNavigationRef.current = null;
                  activeNavigationAttemptRef.current = null;
                  // Clear retry count on success
                  retryCountRef.current = 0;
                  // Clear all verification timeouts
                  activeNavigationTimeoutsRef.current.forEach(t => clearTimeout(t));
                  activeNavigationTimeoutsRef.current.clear();
                  // Update last extracted path to match current navigation (prevents old messages from triggering navigation)
                  if (lastExtractedPathRef.current !== pathname) {
                    lastExtractedPathRef.current = pathname;
                    lastExtractionTimeRef.current = Date.now();
                  }
                  // CRITICAL: Clear lastNavigationPathRef immediately after successful navigation
                  // This prevents the system from blocking re-navigation to the same path
                  lastNavigationPathRef.current = pathname;
                  
                  // CRITICAL: After navigation completes, trigger mic state check IMMEDIATELY
                  // This ensures mic icon is correct after navigation
                  window.dispatchEvent(new CustomEvent('navigation-complete', { detail: { pathname } }));
                  
                  // Also dispatch after a small delay to ensure track is ready
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('navigation-complete', { detail: { pathname } }));
                  }, 300);
                } else if (index === verifyDelays.length - 1 && retryCountRef.current < maxRetries) {
                  // Last verification failed, retry ONLY if we haven't navigated yet
                  // Don't retry if we've already navigated to a different path
                  if (pendingNavigationRef.current === pathname && activeNavigationAttemptRef.current?.attemptId === attemptId) {
                    retryCountRef.current++;
                    console.warn(`[Agent Navigation] ⚠️⚠️⚠️ NAVIGATION VERIFICATION FAILED at ${delay}ms! ⚠️⚠️⚠️`);
                    console.warn(`[Agent Navigation] Expected: ${pathname}`);
                    console.warn(`[Agent Navigation] Got window.location: ${actualWindowPath}`);
                    console.warn(`[Agent Navigation] Got React Router: ${actualRouterPath}`);
                    console.warn(`[Agent Navigation] Retrying navigation (attempt ${retryCountRef.current + 1}/${maxRetries + 1})...`);
                    setTimeout(() => attemptNavigation(), 100); // Faster retry
                  } else {
                    console.log(`[Agent Navigation] ⚠️ Navigation cancelled - new path requested during retry`);
                  }
                } else if (index === verifyDelays.length - 1) {
                  // All retries exhausted - try window.location.replace as last resort (no history entry)
                  console.error(`[Agent Navigation] ❌❌❌ ALL RETRIES EXHAUSTED ❌❌❌`);
                  console.error(`[Agent Navigation] Final attempt: using window.location.replace (no history flash)`);
                  try {
                    window.location.replace(pathname);
                  } catch (e) {
                    console.error(`[Agent Navigation] ❌ window.location.replace also failed:`, e);
                  }
                  pendingNavigationRef.current = null;
                  activeNavigationAttemptRef.current = null;
                  activeNavigationTimeoutsRef.current.forEach(t => clearTimeout(t));
                  activeNavigationTimeoutsRef.current.clear();
                }
              }, delay);
              
              // Track this timeout so we can cancel it if needed
              activeNavigationTimeoutsRef.current.add(timeoutId);
            });
          } catch (error) {
            console.error(`[Agent Navigation] ❌ Navigation error:`, error);
            // CRITICAL: Only retry if navigation wasn't cancelled
            if (pendingNavigationRef.current === pathname && activeNavigationAttemptRef.current?.attemptId === attemptId && retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              console.log(`[Agent Navigation] Retrying after error (attempt ${retryCountRef.current + 1}/${maxRetries + 1})...`);
              setTimeout(() => attemptNavigation(), 100);
            } else {
              console.log(`[Agent Navigation] ⚠️ Not retrying - navigation cancelled or max retries reached`);
              pendingNavigationRef.current = null;
              activeNavigationAttemptRef.current = null;
              activeNavigationTimeoutsRef.current.forEach(t => clearTimeout(t));
              activeNavigationTimeoutsRef.current.clear();
            }
          }
          }, 10); // 10ms delay - just enough to catch rapid commands without visible delay
        };
        
        attemptNavigation();
      };
      
      // Execute immediately - no delays, no debounce
      executeNavigation();
      
      // Reset lastNavigationPathRef after a delay to allow re-navigation if needed
      setTimeout(() => {
        if (lastNavigationPathRef.current === pathname) {
          // Only reset if we're actually on the target page
          const currentPath = normalizePathname(window.location.pathname);
          if (currentPath === pathname) {
            lastNavigationPathRef.current = null;
            console.log('[Agent Navigation] Reset lastNavigationPathRef - ready for next navigation');
          }
        }
      }, 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('[Agent Navigation] Navigation error:', error);
    }
  }, [navigate, toast, location.pathname, normalizePathname, findClosestRoute]);

  // Use useDataChannel hook (must be called unconditionally)
  // This is the recommended LiveKit method
  // Always set up the callback - it will only fire when room is connected
  console.log('[Agent Navigation] Setting up useDataChannel hook with topic "agent-navigation"', {
    hasRoom: !!room,
    roomState: room?.state,
  });
  
  // PRIMARY: Listen for messages with topic "agent-navigation"
  const { message } = useDataChannel('agent-navigation', (msg) => {
    console.log('[Agent Navigation] 🚨🚨🚨 DATA CHANNEL MESSAGE RECEIVED! 🚨🚨🚨');
    console.log('[Agent Navigation] ============================================');
    console.log('[Agent Navigation] Message received at:', new Date().toISOString());
    console.log('[Agent Navigation] Room state:', room?.state);
    console.log('[Agent Navigation] Room connected:', room?.state === 'connected');
    console.log('[Agent Navigation] Message:', msg);
    console.log('[Agent Navigation] Message type:', typeof msg);
    console.log('[Agent Navigation] ============================================');
    
    // Only process if room is connected
    if (!room || room.state !== 'connected') {
      console.log('[Agent Navigation] ⚠️ Received message but room not connected, state:', room?.state);
      return;
    }
    console.log('[Agent Navigation] 📨📨📨 useDataChannel callback received message:', {
      msg,
      msgType: typeof msg,
      msgKeys: msg ? Object.keys(msg as any) : [],
      hasPayload: !!(msg as any)?.payload,
      hasData: !!(msg as any)?.data,
      msgString: typeof msg === 'string' ? msg : JSON.stringify(msg)
    });
    
    try {
      // Handle both ReceivedDataMessage and raw messages
      let rawData: any;
      
      if (typeof msg === 'string') {
        console.log('[Agent Navigation] Message is string, parsing JSON...');
        rawData = JSON.parse(msg);
      } else if ((msg as any)?.payload) {
        console.log('[Agent Navigation] Message has payload property');
        const payload = (msg as any).payload;
        rawData = typeof payload === 'string' ? JSON.parse(payload) : payload;
      } else if ((msg as any)?.data) {
        console.log('[Agent Navigation] Message has data property');
        const data = (msg as any).data;
        rawData = typeof data === 'string' ? JSON.parse(data) : data;
      } else {
        console.log('[Agent Navigation] Using message as-is');
        rawData = msg;
      }
      
      console.log('[Agent Navigation] Parsed useDataChannel data:', rawData);
      console.log('[Agent Navigation] 🔍🔍🔍 PARSED DATA STRUCTURE 🔍🔍🔍', JSON.stringify(rawData, null, 2));
      
      // Extract navigation path - check multiple possible fields
      let path: string | null = null;
      if (rawData.pathname) {
        path = rawData.pathname;
        console.log('[Agent Navigation] ✅ Found pathname:', path);
      } else if (rawData.navigate) {
        path = rawData.navigate;
        console.log('[Agent Navigation] ✅ Found navigate:', path);
      } else if (rawData.url) {
        path = rawData.url;
        console.log('[Agent Navigation] ✅ Found url:', path);
      } else if (rawData.type === 'agent-navigation-url' && rawData.url) {
        path = rawData.url;
        console.log('[Agent Navigation] ✅ Found url from type check:', path);
      }
      
      if (path) {
        console.log('[Agent Navigation] 🎯🎯🎯 NAVIGATION FROM useDataChannel! 🎯🎯🎯', path);
        console.log('[Agent Navigation] Calling navigateToUrlFromString with:', path);
        navigateToUrlFromString(path);
      } else {
        console.error('[Agent Navigation] ❌❌❌ NO NAVIGATION PATH FOUND! ❌❌❌', {
          rawData,
          hasPathname: !!rawData.pathname,
          hasNavigate: !!rawData.navigate,
          hasUrl: !!rawData.url,
          type: rawData.type,
          allKeys: Object.keys(rawData),
        });
      }
    } catch (e) {
      console.error('[Agent Navigation] ❌ Error parsing useDataChannel message:', e, msg);
      console.error('[Agent Navigation] Error details:', {
        error: e,
        message: msg,
        messageType: typeof msg
      });
    }
  });
  
  // Log when message changes (for debugging)
  useEffect(() => {
    if (message) {
      console.log('[Agent Navigation] 📨 useDataChannel message state updated:', {
        message,
        messageType: typeof message,
        messageKeys: message ? Object.keys(message as any) : []
      });
      
      try {
        // Try to parse and handle the message state
        let rawData: any;
        if (typeof message === 'string') {
          rawData = JSON.parse(message);
        } else if ((message as any)?.payload) {
          const payload = (message as any).payload;
          rawData = typeof payload === 'string' ? JSON.parse(payload) : payload;
        } else if ((message as any)?.data) {
          const data = (message as any).data;
          rawData = typeof data === 'string' ? JSON.parse(data) : data;
        } else {
          rawData = message;
        }
        
        if (rawData.type === 'agent-navigation-url' || rawData.pathname || rawData.navigate) {
          const path = rawData.pathname || rawData.navigate || rawData.url;
          console.log('[Agent Navigation] 🎯🎯🎯 NAVIGATION FROM useDataChannel message state! 🎯🎯🎯', path);
          navigateToUrlFromString(path);
        }
      } catch (e) {
        console.error('[Agent Navigation] Error parsing useDataChannel message state:', e, message);
      }
    }
  }, [message, navigateToUrlFromString]);

  useEffect(() => {
    if (!room) {
      console.log('[Agent Navigation] No room context available yet');
      return;
    }

    // Define navigateToUrl inside useEffect - delegates to navigateToUrlFromString for consistency
    // This ensures both useDataChannel and RoomEvent.DataReceived use the same navigation logic
    const navigateToUrl = (urlString: string) => {
      // Use the same debounced navigation function
      navigateToUrlFromString(urlString);
    };

    // Process queued messages once listener is ready
    const processMessageQueue = () => {
      if (messageQueueRef.current.length > 0 && listenerReadyRef.current) {
        console.log(`[Agent Navigation] 📬 Processing ${messageQueueRef.current.length} queued messages`);
        const queue = [...messageQueueRef.current];
        messageQueueRef.current = []; // Clear queue
        queue.forEach((queuedMessage) => {
          console.log('[Agent Navigation] 🔄 Processing queued message');
          handleDataReceived(queuedMessage.payload, queuedMessage.participant, queuedMessage.kind, queuedMessage.topic);
        });
      }
    };

    // Handle data messages from the agent via RoomEvent.DataReceived
    // Note: RoomEvent.DataReceived signature is: (payload: Uint8Array, participant?: RemoteParticipant, kind?: DataPacket_Kind, topic?: string)
    const handleDataReceived = (
      payload: Uint8Array,
      participant?: any,
      kind?: any,
      topic?: string
    ) => {
      // If listener isn't ready yet, queue the message
      if (!listenerReadyRef.current) {
        console.log('[Agent Navigation] ⏳ Listener not ready yet, queuing message');
        messageQueueRef.current.push({ payload, participant, kind, topic });
        // Try to process queue after a short delay
        if (processQueueTimeoutRef.current) {
          clearTimeout(processQueueTimeoutRef.current);
        }
        processQueueTimeoutRef.current = setTimeout(() => {
          processMessageQueue();
        }, 100);
        return;
      }

      console.log('[Agent Navigation] ✅✅✅ DATA RECEIVED via RoomEvent! ✅✅✅', {
        payloadLength: payload.length,
        participant: participant?.identity || 'unknown',
        participantIdentity: participant?.identity,
        kind: kind,
        topic: topic || '(no topic)',
        payloadPreview: Array.from(payload.slice(0, 100)),
        isFromAgent: participant?.identity?.includes('agent') || false
      });

      // REMOVED TOPIC FILTERING - accept ALL data messages and check content
      // This ensures we catch navigation messages regardless of topic
      
      // Log participant info but don't filter
      if (participant) {
        console.log('[Agent Navigation] Data from participant:', participant.identity, 'isAgent:', participant.identity.includes('agent'));
      }

      try {
        const decoder = new TextDecoder();
        const rawText = decoder.decode(payload);
        console.log('[Agent Navigation] 🔍🔍🔍 RAW DECODED MESSAGE TEXT 🔍🔍🔍:', rawText);
        
        let message: any;
        try {
          message = JSON.parse(rawText);
        console.log('[Agent Navigation] Parsed message object:', message);
          console.log('[Agent Navigation] Message keys:', Object.keys(message));
        } catch (parseError) {
          console.error('[Agent Navigation] ❌ Failed to parse as JSON:', parseError);
          console.error('[Agent Navigation] Raw text:', rawText);
          // Check if raw text contains navigation patterns
          const navMatch = rawText.match(/NAVIGATE:(\/[^\s]*)/);
          if (navMatch) {
            const path = navMatch[1];
            console.log('[Agent Navigation] 🎯🎯🎯 FOUND NAVIGATE PATTERN IN RAW TEXT! 🎯🎯🎯', path);
            navigateToUrl(path);
            return;
          }
          return;
        }

        // Check for navigation in multiple ways
        let path: string | null = null;
        
        // Method 1: Check type field
        if (message.type === 'agent-navigation-url') {
          path = message.pathname || message.url;
          console.log('[Agent Navigation] ✅ Navigation message recognized by type!', {
            url: message.url,
            pathname: message.pathname,
            extractedPath: path
          });
        }
        
        // Method 2: Check for pathname field (any message)
        if (!path && message.pathname) {
          path = message.pathname;
          console.log('[Agent Navigation] ✅ Found pathname field:', path);
        }
        
        // Method 3: Check for navigate field
        if (!path && message.navigate) {
          path = message.navigate;
          console.log('[Agent Navigation] ✅ Found navigate field:', path);
        }
        
        // Method 4: Check for url field and extract pathname
        if (!path && message.url) {
          try {
            if (message.url.startsWith('http://') || message.url.startsWith('https://')) {
              const url = new URL(message.url);
              path = url.pathname;
            } else {
              path = message.url;
            }
            console.log('[Agent Navigation] ✅ Found url field, extracted path:', path);
          } catch (e) {
            console.error('[Agent Navigation] Error parsing URL:', e);
          }
        }
        
        // Method 5: Check if message content contains NAVIGATE: pattern
        if (!path && typeof message.content === 'string') {
          const navMatch = message.content.match(/NAVIGATE:(\/[^\s]*)/);
          if (navMatch) {
            path = navMatch[1];
            console.log('[Agent Navigation] ✅ Found NAVIGATE pattern in content:', path);
          }
        }

        if (path) {
          console.log('[Agent Navigation] 🎯🎯🎯 NAVIGATING FROM RoomEvent.DataReceived! 🎯🎯🎯', path);
          navigateToUrl(path);
        } else {
          console.log('[Agent Navigation] ⚠️ No navigation path found in message');
          console.log('[Agent Navigation] Message structure:', JSON.stringify(message, null, 2));
          console.log('[Agent Navigation] Topic was:', topic || '(none)');
        }
      } catch (error) {
        console.error('[Agent Navigation] ❌ Error parsing data message:', error);
        console.error('[Agent Navigation] Raw payload length:', payload.length);
        // Try to log raw bytes for debugging
        try {
          const decoder = new TextDecoder();
          const text = decoder.decode(payload);
          console.error('[Agent Navigation] Decoded text (error case):', text);
          // Last resort: check for NAVIGATE pattern in error case
          const navMatch = text.match(/NAVIGATE:(\/[^\s]*)/);
          if (navMatch) {
            const path = navMatch[1];
            console.log('[Agent Navigation] 🎯🎯🎯 FOUND NAVIGATE IN ERROR CASE! 🎯🎯🎯', path);
            navigateToUrl(path);
          }
        } catch (e) {
          console.error('[Agent Navigation] Could not decode payload:', e);
        }
      }
    };

    const setupListener = () => {
      console.log('[Agent Navigation] ✅✅✅ SETTING UP NAVIGATION LISTENER ✅✅✅', {
        roomName: room.name,
        participants: room.remoteParticipants.size,
        roomState: room.state,
        hasHandleDataReceived: typeof handleDataReceived === 'function',
        roomType: typeof room,
        roomKeys: Object.keys(room).slice(0, 20)
      });

      // Subscribe to data messages - PRIMARY method
      // IMPORTANT: RoomEvent.DataReceived fires for ALL data messages in the room
      // The participant parameter in the callback tells us who sent it
      // We do NOT need to listen on individual participants - that's not a valid API
      console.log('[Agent Navigation] 🔌 Subscribing to RoomEvent.DataReceived for room-level data');
      console.log('[Agent Navigation] RoomEvent.DataReceived value:', RoomEvent.DataReceived);
      
      try {
      room.on(RoomEvent.DataReceived, handleDataReceived);
        console.log('[Agent Navigation] ✅✅✅ RoomEvent.DataReceived listener ATTACHED ✅✅✅');
      } catch (error) {
        console.error('[Agent Navigation] ❌❌❌ FAILED TO ATTACH LISTENER! ❌❌❌', error);
      }
      
      // Also try listening via string event name (fallback)
      try {
        room.on('data_received' as any, handleDataReceived);
        console.log('[Agent Navigation] ✅ Also attached listener via string "data_received"');
      } catch (error) {
        console.log('[Agent Navigation] Could not attach via string (expected if RoomEvent works)');
      }
      
      // Verify listener was attached
      const listeners = (room as any)._listeners?.[RoomEvent.DataReceived];
      const stringListeners = (room as any)._listeners?.['data_received'];
      console.log('[Agent Navigation] Listener count for DataReceived:', listeners?.length || 0);
      console.log('[Agent Navigation] Listener count for "data_received":', stringListeners?.length || 0);
      console.log('[Agent Navigation] All event listeners:', Object.keys((room as any)._listeners || {}));
      
      // Mark listener as ready and process any queued messages
      listenerReadyRef.current = true;
      console.log('[Agent Navigation] ✅ Listener marked as READY');
      
      // Process queued messages after a short delay to ensure everything is set up
      setTimeout(() => {
        processMessageQueue();
      }, 200);
      
      // Add a test listener that logs ALL room events for debugging
      const debugHandler = (event: any, ...args: any[]) => {
        if (event === RoomEvent.DataReceived || event === 'data_received') {
          console.log('[Agent Navigation] 🔍🔍🔍 DEBUG: DataReceived event fired!', {
            event,
            argsLength: args.length,
            args: args.map((a, i) => ({
              index: i,
              type: typeof a,
              isUint8Array: a instanceof Uint8Array,
              length: a?.length,
              identity: a?.identity,
              preview: a instanceof Uint8Array ? Array.from(a.slice(0, 50)) : String(a).substring(0, 100)
            }))
          });
        }
      };
      
      // Try to listen to all events for debugging
      try {
        (room as any).on('*' as any, debugHandler);
        console.log('[Agent Navigation] ✅ Debug listener attached for all events');
      } catch (e) {
        console.log('[Agent Navigation] Could not attach debug listener (expected)');
      }

      // Log all remote participants for debugging
      console.log('[Agent Navigation] Remote participants count:', room.remoteParticipants.size);
      room.remoteParticipants.forEach((participant) => {
        console.log('[Agent Navigation]   - Remote participant:', participant.identity, {
          isAgent: participant.identity.includes('agent'),
          hasMetadata: !!participant.metadata
        });
      });

      // Listen for new participants joining
      const handleParticipantConnected = (participant: any) => {
        console.log('[Agent Navigation] Participant connected:', participant.identity);
        
        // Check agent metadata when participant connects
        if (participant.identity.includes('agent')) {
          console.log('[Agent Navigation] Agent participant connected - will check metadata');
          setTimeout(() => {
            if (participant.metadata) {
              console.log('[Agent Navigation] Agent has metadata on connect:', participant.metadata);
              handleMetadataChange(participant);
            } else {
              console.log('[Agent Navigation] Agent connected but no metadata yet');
            }
          }, 1000);
        }
      };
      room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);

      // Note: room.engine events are not part of the public API, using RoomEvent.DataReceived instead

      // Note: Transcription events are not available in LiveKit RoomEvent API
      // Navigation is handled via DataReceived events and metadata changes

      // Monitor participant metadata changes (PRIMARY METHOD)
      let lastCheckedMetadata: string | null = null;
      
      const handleMetadataChange = (participant: any) => {
          console.log('[Agent Navigation] Metadata changed event!', {
            participant: participant?.identity,
            metadata: participant?.metadata,
            isAgent: participant?.identity?.includes('agent')
          });
          
          if (participant?.identity?.includes('agent')) {
            const metadata = participant.metadata;
            if (metadata && metadata !== lastCheckedMetadata) {
              lastCheckedMetadata = metadata;
              console.log('[Agent Navigation] 🔍 Checking agent metadata:', metadata);
              
              try {
                const parsed = JSON.parse(metadata);
                console.log('[Agent Navigation] Parsed metadata:', parsed);
                if (parsed.navigate || parsed.path) {
                  const path = parsed.path || parsed.navigate;
                  console.log('[Agent Navigation] 🎯🎯🎯 FOUND NAVIGATION IN METADATA! 🎯🎯🎯', path);
                  navigateToUrl(path);
                  return;
                }
              } catch (e) {
                // Not JSON, check if it's a plain NAVIGATE command
                console.log('[Agent Navigation] Metadata is not JSON, checking for NAVIGATE pattern');
                const navMatch = metadata.match(/NAVIGATE:(\/[^\s]*)/);
                if (navMatch) {
                  console.log('[Agent Navigation] 🎯 Found navigation in metadata text:', navMatch[1]);
                  navigateToUrl(navMatch[1]);
                  return;
                }
              }
            }
          }
        };
        
        // Check metadata on participant connect and when new participants join
        const checkAgentMetadata = (p: any) => {
          if (p.identity.includes('agent')) {
            console.log('[Agent Navigation] 🔍 Checking agent metadata:', {
              identity: p.identity,
              metadata: p.metadata,
              metadataType: typeof p.metadata,
              hasMetadata: !!p.metadata
            });
            if (p.metadata) {
              handleMetadataChange(p);
            }
            // Metadata changes are handled via RoomEvent.ParticipantMetadataChanged
          }
        };
        
        // Check existing participants
        room.remoteParticipants.forEach(checkAgentMetadata);
        
        // Monitor metadata changes via RoomEvent
        room.on(RoomEvent.ParticipantMetadataChanged, handleMetadataChange);
        
        // Also check existing participants again after setup (in case metadata was set before listener)
        setTimeout(() => {
          room.remoteParticipants.forEach((participant) => {
            if (participant.identity.includes('agent')) {
              console.log('[Agent Navigation] 🔍 Delayed check - agent metadata:', {
                identity: participant.identity,
                metadata: participant.metadata
              });
              if (participant.metadata) {
                handleMetadataChange(participant);
              }
            }
          });
        }, 2000);
        
        // POLLING FALLBACK: Check metadata periodically (in case events don't fire)
        let pollCount = 0;
        const metadataCheckInterval = setInterval(() => {
          pollCount++;
          room.remoteParticipants.forEach((p) => {
            if (p.identity.includes('agent')) {
              const currentMetadata = p.metadata;
              if (currentMetadata && currentMetadata !== lastCheckedMetadata) {
                console.log('[Agent Navigation] 🔄 Polling detected metadata change!', {
                  pollCount,
                  oldMetadata: lastCheckedMetadata,
                  newMetadata: currentMetadata,
                  participant: p.identity
                });
                handleMetadataChange(p);
              } else if (pollCount % 20 === 0) { // Log every 10 seconds (20 * 500ms)
                console.log('[Agent Navigation] Polling check (every 10s):', {
                  participant: p.identity,
                  hasMetadata: !!currentMetadata,
                  metadata: currentMetadata?.substring(0, 100), // First 100 chars
                  lastChecked: lastCheckedMetadata?.substring(0, 100)
                });
              }
              
              // DEBUG: Also log ALL metadata we see (even if same)
              if (pollCount === 1 || pollCount % 10 === 0) {
                console.log('[Agent Navigation] 🔍 Current agent metadata state:', {
                  participant: p.identity,
                  metadata: currentMetadata || '(null/empty)',
                  lastChecked: lastCheckedMetadata || '(null)',
                  areEqual: currentMetadata === lastCheckedMetadata
                });
              }
            }
          });
        }, 500); // Check every 500ms
        
        // Store interval for cleanup
        (room as any)._navMetadataInterval = metadataCheckInterval;
        
         // Note: Transcription events are not available in LiveKit RoomEvent API
         // Navigation is handled via DataReceived events and metadata changes

      // Cleanup function
       const cleanup = () => {
         console.log('[Agent Navigation] Cleaning up event listeners');
        listenerReadyRef.current = false; // Mark listener as not ready
        room.off(RoomEvent.DataReceived, handleDataReceived);
        room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
        room.off(RoomEvent.ParticipantMetadataChanged, handleMetadataChange);
        
        // Clear polling interval
        if ((room as any)._navMetadataInterval) {
          clearInterval((room as any)._navMetadataInterval);
        }
        
        // Clear queue processing timeout
        if (processQueueTimeoutRef.current) {
          clearTimeout(processQueueTimeoutRef.current);
          processQueueTimeoutRef.current = null;
        }
        
        // Clear message queue
        messageQueueRef.current = [];
        
        // Note: We don't need to clean up participant listeners since we only listen on room
       };
      
      return cleanup;
    };

    // Set up listener IMMEDIATELY, even if room isn't connected yet
    // This ensures we don't miss any messages that arrive during connection
    // The listener will be attached and will start processing once room connects
    console.log('[Agent Navigation] Setting up listener immediately (room state:', room.state, ')');
    
    // Set up listener right away
    const cleanup = setupListener();
    
    // Also listen for connection state changes to process queue
      const handleConnected = () => {
      console.log('[Agent Navigation] Room connected, processing queued messages');
      listenerReadyRef.current = true;
      setTimeout(() => {
        processMessageQueue();
      }, 200);
    };
    
    // Listen for connection if not already connected
    if (room.state !== 'connected') {
      console.log('[Agent Navigation] Room not connected yet, will process queue when connected');
      room.on('connected', handleConnected);
    } else {
      // Already connected, mark as ready
      listenerReadyRef.current = true;
      setTimeout(() => {
        processMessageQueue();
      }, 200);
    }
      
      return () => {
        room.off('connected', handleConnected);
      if (cleanup) cleanup();
    };
  }, [room, navigate, toast, navigateToUrlFromString]);

  // PRIMARY FALLBACK: Listen to transcript for NAVIGATE: patterns
  // This is more reliable than data channel in some cases
  const lastProcessedTranscriptRef = useRef<number>(0);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const transcriptCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Track when we last extracted navigation to prevent processing old messages
  const lastExtractionTimeRef = useRef<number>(0);
  const lastExtractedPathRef = useRef<string | null>(null);
  
  // Helper function to extract and navigate from text content
  const extractAndNavigate = useCallback((content: string, source: string) => {
    const extractionStartTime = Date.now();
    console.log('[Agent Navigation] 🔍🔍🔍 EXTRACTING NAVIGATION FROM TEXT 🔍🔍🔍');
    console.log('[Agent Navigation] Source:', source);
    console.log('[Agent Navigation] Content length:', content?.length);
    console.log('[Agent Navigation] Content preview:', content?.substring(0, 500));
    
    if (!content || typeof content !== 'string') {
      console.log('[Agent Navigation] ❌ Invalid content, skipping');
      return false;
    }
    
    // Method 1: Look for NAVIGATE: pattern (most reliable)
    const navMatch = content.match(/NAVIGATE:(\/[^\s]*)/);
    if (navMatch) {
      const path = navMatch[1];
      const now = Date.now();
      
      console.log('[Agent Navigation] 🎯🎯🎯 FOUND NAVIGATE PATTERN! 🎯🎯🎯');
      console.log('[Agent Navigation] Extracted path:', path);
      console.log('[Agent Navigation] Last navigation path:', lastNavigationPathRef.current);
      console.log('[Agent Navigation] Last extracted path:', lastExtractedPathRef.current);
      console.log('[Agent Navigation] Time since last extraction:', now - lastExtractionTimeRef.current, 'ms');
      console.log('[Agent Navigation] Pending navigation:', pendingNavigationRef.current);
      console.log('[Agent Navigation] Active attempt:', activeNavigationAttemptRef.current?.pathname);
      
      // CRITICAL: Skip if there's a pending navigation to a DIFFERENT path
      // This prevents old extraction from triggering navigation when a new command is active
      if (pendingNavigationRef.current && normalizePathname(path) !== normalizePathname(pendingNavigationRef.current)) {
        console.log('[Agent Navigation] ⚠️⚠️⚠️ BLOCKING OLD EXTRACTION - different pending navigation ⚠️⚠️⚠️');
        console.log('[Agent Navigation]   Extracted path:', path);
        console.log('[Agent Navigation]   Pending path:', pendingNavigationRef.current);
        console.log('[Agent Navigation]   Skipping old extraction');
        return true; // Return true to mark as processed
      }
      
      // CRITICAL: Skip if there's an active navigation attempt to a DIFFERENT path
      if (activeNavigationAttemptRef.current && normalizePathname(path) !== normalizePathname(activeNavigationAttemptRef.current.pathname)) {
        console.log('[Agent Navigation] ⚠️⚠️⚠️ BLOCKING OLD EXTRACTION - different active navigation ⚠️⚠️⚠️');
        console.log('[Agent Navigation]   Extracted path:', path);
        console.log('[Agent Navigation]   Active navigation path:', activeNavigationAttemptRef.current.pathname);
        console.log('[Agent Navigation]   Skipping old extraction');
        return true; // Return true to mark as processed
      }
      
      // CRITICAL: Check if this command is older than current pending navigation
      const lastCommandTime = navigationCommandTimestamps.current.get(path) || now;
      const currentPendingTime = pendingNavigationRef.current 
        ? navigationCommandTimestamps.current.get(pendingNavigationRef.current) || 0 
        : 0;
      
      // Store timestamp for this command
      navigationCommandTimestamps.current.set(path, now);
      
      if (pendingNavigationRef.current && pendingNavigationRef.current !== path && currentPendingTime > lastCommandTime) {
        console.log('[Agent Navigation] ⚠️⚠️⚠️ BLOCKING OLD NAVIGATION COMMAND ⚠️⚠️⚠️');
        console.log('[Agent Navigation]   Pending navigation to:', pendingNavigationRef.current, 'at', currentPendingTime);
        console.log('[Agent Navigation]   Attempted navigation to:', path, 'at', lastCommandTime);
        console.log('[Agent Navigation]   Skipping older command');
        return true;
      }
      
      // Skip if we just extracted this same path recently (within 2 seconds)
      if (lastExtractedPathRef.current === path && (now - lastExtractionTimeRef.current) < 2000) {
        console.log('[Agent Navigation] ⚠️ Recently extracted same path, skipping duplicate');
        return true;
      }
      
      // Skip if we already navigated to this path
      if (lastNavigationPathRef.current === path) {
        console.log('[Agent Navigation] ⚠️ Already navigated to', path, 'skipping duplicate');
        return true;
      }
      
      // CRITICAL: Skip if there's a pending navigation to a different path (newer command takes priority)
      if (pendingNavigationRef.current && pendingNavigationRef.current !== path) {
        console.log('[Agent Navigation] ⚠️⚠️⚠️ BLOCKING OLD NAVIGATION COMMAND ⚠️⚠️⚠️');
        console.log('[Agent Navigation]   Pending navigation to:', pendingNavigationRef.current);
        console.log('[Agent Navigation]   Attempted navigation to:', path);
        console.log('[Agent Navigation]   Skipping older command');
        return true;
      }
      
      // CRITICAL: Clear lastNavigationPathRef BEFORE marking new path to prevent old path from being processed
      if (lastNavigationPathRef.current && lastNavigationPathRef.current !== path) {
        console.log(`[Agent Navigation] 🧹 Clearing old navigation path: ${lastNavigationPathRef.current} before navigating to: ${path}`);
        lastNavigationPathRef.current = null;
        lastExtractedPathRef.current = null;
      }
      
      // Mark as extracted BEFORE calling navigate (prevents duplicate processing)
      lastExtractedPathRef.current = path;
      lastExtractionTimeRef.current = now;
      lastNavigationPathRef.current = path;
      
      console.log('[Agent Navigation] ✅✅✅ EXECUTING NAVIGATION TO:', path, '✅✅✅');
      console.log('[Agent Navigation] Calling navigateToUrlFromString with:', path);
      // Execute immediately - no delay
      navigateToUrlFromString(path);
      return true;
    }
    
    // Method 2: Look for direct path patterns
    const directPathMatch = content.match(/\/(?:dashboard|whatsapp-reports|productivity-reports|ads-reports|mail-reports|admin\/settings|bots|social-posts|content-ideas|meeting-summary|courses-prices|awaiting-approval)(?:\s|$|\/)/);
    if (directPathMatch) {
      const path = directPathMatch[0].trim();
      if (lastNavigationPathRef.current === path) {
        return true;
      }
      console.log('[Agent Navigation] 🎯 Found direct path:', path, 'from', source);
      lastNavigationPathRef.current = path;
      navigateToUrlFromString(path);
      return true;
    }
    
    // Method 3: Look for navigation phrases followed by paths
    const phraseMatch = content.match(/(?:جاري فتح|Opening|Navigating to|Going to|Opening the|افتح|open|go to|navigate to|show)\s+(?:the\s+)?(\/?(?:dashboard|whatsapp-reports|productivity-reports|ads-reports|mail-reports|admin\/settings|bots|social-posts|content-ideas|meeting-summary|courses-prices|awaiting-approval))/i);
    if (phraseMatch) {
      let path = phraseMatch[1];
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      if (lastNavigationPathRef.current === path) {
        return true;
      }
      console.log('[Agent Navigation] 🎯 Found navigation phrase + path:', phraseMatch[0], '->', path, 'from', source);
      lastNavigationPathRef.current = path;
      navigateToUrlFromString(path);
      return true;
    }
    
    // Method 4: Look for Arabic navigation phrases
    const arabicToPath: Record<string, string> = {
      'داشبورد': '/dashboard',
      'واتساب': '/whatsapp-reports',
      'إنتاجية': '/productivity-reports',
      'إعلانات': '/ads-reports',
      'بريد': '/mail-reports',
      'إعدادات': '/admin/settings',
      'بوتات': '/bots'
    };
    
    for (const [arabic, path] of Object.entries(arabicToPath)) {
      if (content.includes(arabic)) {
        if (lastNavigationPathRef.current === path) {
          return true;
        }
        console.log('[Agent Navigation] 🎯 Found Arabic navigation term:', arabic, '->', path, 'from', source);
        lastNavigationPathRef.current = path;
        navigateToUrlFromString(path);
        return true;
      }
    }
    
    return false;
  }, [navigateToUrlFromString]);
  
  // Function to process transcript messages
  const processTranscriptMessages = useCallback(() => {
    if (transcript.length === 0) return;
    
    // Only process NEW messages (messages added since last check)
    const startIndex = lastProcessedTranscriptRef.current;
    const newMessages = transcript.slice(startIndex);
    
    if (newMessages.length === 0) {
      return; // No new messages
    }
    
    console.log(`[Agent Navigation] 📝 Processing ${newMessages.length} new transcript message(s) (starting from index ${startIndex})`);
    
    // Process only new assistant messages
    newMessages.forEach((message, relativeIndex) => {
      const actualIndex = startIndex + relativeIndex;
      
      // Create a unique ID for this message (use content hash for better uniqueness)
      const contentHash = message.content.substring(0, 100).replace(/\s+/g, '');
      const messageId = `${actualIndex}-${message.role}-${contentHash}`;
      
      // Skip if already processed
      if (processedMessageIdsRef.current.has(messageId)) {
        return;
      }
      
      if (message.role === 'assistant') {
        const content = message.content;
        const messageTime = new Date(message.timestamp).getTime();
        const now = Date.now();
        const messageAge = now - messageTime;
        
        // Extract pathname from message FIRST to check if we should skip
        const navMatch = content.match(/NAVIGATE:(\/[^\s]*)/);
        const extractedPath = navMatch ? navMatch[1] : null;
        
        console.log('[Agent Navigation] 🔍 Processing assistant message:', {
          index: actualIndex,
          messageId,
          messageAge: `${messageAge}ms`,
          extractedPath,
          pendingNav: pendingNavigationRef.current,
          activeAttempt: activeNavigationAttemptRef.current?.pathname,
          contentPreview: content.substring(0, 300)
        });
        
        // CRITICAL: Skip if there's a pending navigation to a DIFFERENT path
        // This prevents old messages from triggering navigation when a new command is active
        if (pendingNavigationRef.current && extractedPath && normalizePathname(extractedPath) !== normalizePathname(pendingNavigationRef.current)) {
          console.log('[Agent Navigation] ⚠️⚠️⚠️ BLOCKING OLD MESSAGE - different pending navigation ⚠️⚠️⚠️');
          console.log('[Agent Navigation]   Message path:', extractedPath);
          console.log('[Agent Navigation]   Pending path:', pendingNavigationRef.current);
          console.log('[Agent Navigation]   Marking message as processed and skipping');
          processedMessageIdsRef.current.add(messageId);
          return;
        }
        
        // CRITICAL: Skip if there's an active navigation attempt to a DIFFERENT path
        if (activeNavigationAttemptRef.current && extractedPath && normalizePathname(extractedPath) !== normalizePathname(activeNavigationAttemptRef.current.pathname)) {
          console.log('[Agent Navigation] ⚠️⚠️⚠️ BLOCKING OLD MESSAGE - different active navigation ⚠️⚠️⚠️');
          console.log('[Agent Navigation]   Message path:', extractedPath);
          console.log('[Agent Navigation]   Active navigation path:', activeNavigationAttemptRef.current.pathname);
          console.log('[Agent Navigation]   Marking message as processed and skipping');
          processedMessageIdsRef.current.add(messageId);
          return;
        }
        
        // CRITICAL: Skip old messages (older than 1 second) if there's a pending navigation OR if we're on a different page
        // This prevents old messages from triggering navigation after a new command
        const currentPath = normalizePathname(window.location.pathname);
        const isOldMessage = messageAge > 1000; // Reduced to 1 second - very aggressive
        const hasPendingNav = !!pendingNavigationRef.current;
        
        const isDifferentPage = extractedPath && currentPath !== normalizePathname(extractedPath);
        
        // CRITICAL: Skip old messages more aggressively
        if (isOldMessage && (hasPendingNav || isDifferentPage || lastNavigationPathRef.current)) {
          console.log('[Agent Navigation] ⚠️ Skipping old message (age:', messageAge, 'ms) - pending navigation exists, on different page, or already navigated');
          processedMessageIdsRef.current.add(messageId); // Mark as processed to skip next time
          return;
        }
        
        // CRITICAL: Also skip if this message contains a path we've already navigated away from
        if (navMatch && extractedPath) {
          const normalizedExtracted = normalizePathname(extractedPath);
          const normalizedCurrent = normalizePathname(currentPath);
          const normalizedLastNav = lastNavigationPathRef.current ? normalizePathname(lastNavigationPathRef.current) : null;
          
          // Skip if extracted path doesn't match current path AND doesn't match last navigation
          if (normalizedExtracted !== normalizedCurrent && normalizedExtracted !== normalizedLastNav) {
            console.log('[Agent Navigation] ⚠️ Skipping message with old navigation path:', extractedPath, '(current path:', currentPath, ', last nav:', normalizedLastNav, ')');
            processedMessageIdsRef.current.add(messageId);
            return;
          }
        }
        
        const navigated = extractAndNavigate(content, 'transcript');
        if (navigated) {
          processedMessageIdsRef.current.add(messageId);
        }
      }
    });
    
    // Update last processed index
    lastProcessedTranscriptRef.current = transcript.length;
  }, [transcript, extractAndNavigate]);
  
  // Effect 1: Process transcript when it changes (immediate)
  useEffect(() => {
    processTranscriptMessages();
  }, [transcript, processTranscriptMessages]);
  
  // Effect 2: ULTRA-AGGRESSIVE polling every 100ms to catch delayed transcript updates
  useEffect(() => {
    // Clear any existing interval
    if (transcriptCheckIntervalRef.current) {
      clearInterval(transcriptCheckIntervalRef.current);
    }
    
    // Set up polling interval - check every 100ms
    transcriptCheckIntervalRef.current = setInterval(() => {
      processTranscriptMessages();
    }, 100); // Check every 100ms - very aggressive
    
    return () => {
      if (transcriptCheckIntervalRef.current) {
        clearInterval(transcriptCheckIntervalRef.current);
        transcriptCheckIntervalRef.current = null;
      }
    };
  }, [processTranscriptMessages]);
  
  // Effect 3: Listen to DOM changes for any text containing navigation patterns
  // This catches text even if transcript doesn't update
  useEffect(() => {
    if (!room || room.state !== 'connected') return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            if (text.length > 10 && (text.includes('NAVIGATE:') || text.includes('/dashboard') || text.includes('/whatsapp'))) {
              console.log('[Agent Navigation] 🔍 Found navigation text in DOM:', text.substring(0, 200));
              extractAndNavigate(text, 'DOM');
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const text = element.textContent || '';
            if (text.length > 10 && (text.includes('NAVIGATE:') || text.includes('/dashboard') || text.includes('/whatsapp'))) {
              console.log('[Agent Navigation] 🔍 Found navigation text in DOM element:', text.substring(0, 200));
              extractAndNavigate(text, 'DOM');
            }
          }
        });
      });
    });
    
    // Observe the entire document for text changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    return () => {
      observer.disconnect();
    };
  }, [room, extractAndNavigate]);

  // Expose test functions for debugging
  useEffect(() => {
    // Direct navigation test
    (window as any).testNav = (path: string) => {
      console.log('[Agent Navigation] 🧪 Testing direct navigation to:', path);
      navigateToUrlFromString(path);
    };
    
    // Simulate receiving a data channel message
    (window as any).testNavMessage = (message: any) => {
      console.log('[Agent Navigation] 🧪 Testing navigation message:', message);
      if (typeof message === 'string') {
        try {
          message = JSON.parse(message);
        } catch (e) {
          console.error('[Agent Navigation] Failed to parse test message:', e);
          return;
        }
      }
      
      let path: string | null = null;
      if (message.pathname) {
        path = message.pathname;
      } else if (message.navigate) {
        path = message.navigate;
      } else if (message.url) {
        if (message.url.startsWith('http://') || message.url.startsWith('https://')) {
          try {
            const url = new URL(message.url);
            path = url.pathname;
          } catch (e) {
            path = message.url;
          }
        } else {
          path = message.url;
        }
      }
      
      if (path) {
        console.log('[Agent Navigation] 🧪 Extracted path from test message:', path);
        navigateToUrlFromString(path);
      } else {
        console.error('[Agent Navigation] 🧪 No path found in test message:', message);
      }
    };
    
    // Simulate receiving raw data channel payload
    (window as any).testNavPayload = (jsonString: string) => {
      console.log('[Agent Navigation] 🧪 Testing navigation payload:', jsonString);
      try {
        const message = JSON.parse(jsonString);
        (window as any).testNavMessage(message);
      } catch (e) {
        console.error('[Agent Navigation] Failed to parse test payload:', e);
      }
    };
    
    console.log('[Agent Navigation] Test functions available:');
    console.log('  - window.testNav("/whatsapp-reports") - Direct navigation');
    console.log('  - window.testNavMessage({pathname: "/dashboard"}) - Simulate message');
    console.log('  - window.testNavPayload(\'{"type":"agent-navigation-url","pathname":"/dashboard"}\') - Simulate payload');
  }, [navigateToUrlFromString]);

  return null; // This is a listener component with no UI
};
