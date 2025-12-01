import React, { useEffect, useRef, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RpcInvocationData } from 'livekit-client';

interface PageElement {
  id: string;
  text: string;
  type: string;
  ariaLabel: string | null;
  role: string | null;
  href: string | null;
  placeholder: string | null;
  index: number;
}

// Check if element is visible
function isVisible(el: Element): boolean {
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();

  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0
  );
}

// Get readable text from element
function getElementText(el: Element): string {
  // Try multiple sources for text
  const textContent = el.textContent?.trim();
  const ariaLabel = el.getAttribute('aria-label');
  const title = el.getAttribute('title');
  const placeholder = el.getAttribute('placeholder');
  const alt = el.getAttribute('alt');
  const value = (el as HTMLInputElement).value;

  // For inputs, prefer placeholder or aria-label
  if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'select') {
    return ariaLabel || placeholder || title || textContent || '';
  }

  // For buttons/links, prefer text content, fallback to aria-label
  return textContent || ariaLabel || title || alt || '';
}

// Get semantic type of element
function getElementType(el: Element): string {
  const role = el.getAttribute('role');
  if (role) return role;

  const tag = el.tagName.toLowerCase();
  const type = el.getAttribute('type');

  if (tag === 'input') return `input-${type || 'text'}`;
  if (tag === 'a') return 'link';
  if (tag === 'select') return 'dropdown';
  if (tag === 'textarea') return 'textarea';

  return tag;
}

// Check for duplicate elements (same text and type)
function isDuplicate(el: Element, elements: PageElement[]): boolean {
  const text = getElementText(el);
  const type = getElementType(el);

  // Allow duplicates if they have different IDs
  if (el.id) return false;

  // Skip if we already have an element with same text and type
  return elements.some(e => e.text === text && e.type === type && !e.id);
}

// Scan page for all interactive elements
function scanPageElements(): PageElement[] {
  const elements: PageElement[] = [];

  const selectors = [
    // Buttons
    'button:not([disabled])',
    '[role="button"]:not([disabled])',
    'input[type="submit"]:not([disabled])',
    'input[type="button"]:not([disabled])',

    // Links
    'a[href]',

    // Form inputs
    'input[type="text"]:not([disabled])',
    'input[type="search"]:not([disabled])',
    'input[type="email"]:not([disabled])',
    'input[type="password"]:not([disabled])',
    'input[type="checkbox"]:not([disabled])',
    'input[type="radio"]:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',

    // Interactive elements
    '[role="tab"]',
    '[role="menuitem"]',
    '[role="option"]',
    '[role="switch"]',
    '[role="checkbox"]',
    '[role="link"]',
    '[role="combobox"]',

    // Clickable elements
    '[onclick]',
    '[tabindex="0"]',

    // Common clickable classes
    '.cursor-pointer',
    '.clickable',

    // Cards and interactive containers
    '[data-clickable]',
  ];

  const allElements = document.querySelectorAll(selectors.join(','));

  allElements.forEach((el, index) => {
    // Skip hidden elements and duplicates
    if (!isVisible(el)) return;
    if (isDuplicate(el, elements)) return;

    // Skip elements inside the voice assistant modal
    if (el.closest('.voice-assistant-modal') || el.closest('[data-voice-assistant]')) return;

    const text = getElementText(el);

    // Skip elements with no meaningful text (unless they have an ID)
    if (!text && !el.id) return;

    // Skip very long text (likely a container, not a button)
    if (text.length > 100) return;

    elements.push({
      id: el.id || `element-${index}`,
      text: text.substring(0, 50), // Truncate long text
      type: getElementType(el),
      ariaLabel: el.getAttribute('aria-label'),
      role: el.getAttribute('role'),
      href: el.getAttribute('href'),
      placeholder: el.getAttribute('placeholder'),
      index: index
    });
  });

  return elements;
}

// Click element by identifier (text, id, or index)
function clickElementByIdentifier(identifier: string, type: 'text' | 'id' | 'index' = 'text'): string {
  console.log('[UIElementsReporter] Clicking element:', { identifier, type });

  let element: Element | null = null;

  if (type === 'id') {
    element = document.getElementById(identifier);
  } else if (type === 'index') {
    const index = parseInt(identifier, 10);
    const elements = scanPageElements();
    if (elements[index]) {
      element = document.querySelector(`#${elements[index].id}`) ||
                document.querySelectorAll('button, a, [role="button"]')[index];
    }
  } else {
    // Search by text content
    const normalizedIdentifier = identifier.toLowerCase().trim();

    // Try exact match first
    const allClickable = document.querySelectorAll('button, a, [role="button"], input[type="submit"], [onclick]');

    for (const el of allClickable) {
      if (!isVisible(el)) continue;

      const text = getElementText(el).toLowerCase().trim();

      // Exact match
      if (text === normalizedIdentifier) {
        element = el;
        break;
      }
    }

    // If no exact match, try partial match
    if (!element) {
      for (const el of allClickable) {
        if (!isVisible(el)) continue;

        const text = getElementText(el).toLowerCase().trim();

        // Partial match
        if (text.includes(normalizedIdentifier) || normalizedIdentifier.includes(text)) {
          element = el;
          break;
        }
      }
    }

    // Try aria-label match
    if (!element) {
      for (const el of allClickable) {
        if (!isVisible(el)) continue;

        const ariaLabel = el.getAttribute('aria-label')?.toLowerCase().trim() || '';

        if (ariaLabel === normalizedIdentifier || ariaLabel.includes(normalizedIdentifier)) {
          element = el;
          break;
        }
      }
    }
  }

  if (element) {
    // Scroll into view first
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Dispatch animation event with element coordinates
    const rect = element.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent('agent-click-animation', {
      detail: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    }));
    console.log('[UIElementsReporter] Dispatched click animation at:', rect.left + rect.width / 2, rect.top + rect.height / 2);

    // Delay click to allow animation to complete (cursor travel + click effect)
    setTimeout(() => {
      (element as HTMLElement).click();
    }, 1200);

    const elementText = getElementText(element);
    console.log('[UIElementsReporter] Clicked element:', elementText);
    return JSON.stringify({
      success: true,
      message: `Clicked "${elementText}"`,
      element: elementText
    });
  }

  console.warn('[UIElementsReporter] Element not found:', identifier);
  return JSON.stringify({
    success: false,
    message: `Element "${identifier}" not found on page`,
    availableElements: scanPageElements().slice(0, 10).map(e => e.text)
  });
}

export const UIElementsReporter: React.FC = () => {
  const room = useRoomContext();
  const location = useLocation();
  const navigate = useNavigate();
  const lastElementsRef = useRef<string>('');
  const rpcRegisteredRef = useRef<boolean>(false);

  // Register RPC methods
  const registerRpcMethods = useCallback(() => {
    if (!room || rpcRegisteredRef.current) return;

    const localParticipant = room.localParticipant;
    if (!localParticipant) return;

    console.log('[UIElementsReporter] Registering RPC methods...');

    // Method 1: Get all interactive elements on page
    localParticipant.registerRpcMethod('getPageElements', async (data: RpcInvocationData) => {
      console.log('[UIElementsReporter] RPC: getPageElements called');

      const elements = scanPageElements();
      const response = {
        currentPage: window.location.pathname,
        pageTitle: document.title,
        elementsCount: elements.length,
        elements: elements
      };

      console.log('[UIElementsReporter] Found elements:', elements.length);
      return JSON.stringify(response);
    });

    // Method 2: Click element by identifier
    localParticipant.registerRpcMethod('clickElement', async (data: RpcInvocationData) => {
      console.log('[UIElementsReporter] RPC: clickElement called with:', data.payload);

      try {
        const params = JSON.parse(data.payload);
        const { identifier, type = 'text' } = params;

        const result = clickElementByIdentifier(identifier, type);
        return result;
      } catch (error) {
        console.error('[UIElementsReporter] Error clicking element:', error);
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Method 3: Get current page info
    localParticipant.registerRpcMethod('getCurrentPage', async (data: RpcInvocationData) => {
      console.log('[UIElementsReporter] RPC: getCurrentPage called');

      return JSON.stringify({
        pathname: window.location.pathname,
        title: document.title,
        url: window.location.href
      });
    });

    // Method 4: Navigate to a page (called by backend agent)
    localParticipant.registerRpcMethod('navigateToPage', async (data: RpcInvocationData) => {
      console.log('[UIElementsReporter] RPC: navigateToPage called with:', data.payload);

      try {
        const { pathname } = JSON.parse(data.payload);
        console.log('[UIElementsReporter] Navigating to:', pathname);

        // Dispatch custom event for navigation (caught by listener with useNavigate)
        window.dispatchEvent(new CustomEvent('agent-navigate', { detail: { pathname } }));

        return JSON.stringify({
          success: true,
          message: `Navigating to ${pathname}`,
          pathname
        });
      } catch (error) {
        console.error('[UIElementsReporter] Navigation error:', error);
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    rpcRegisteredRef.current = true;
    console.log('[UIElementsReporter] RPC methods registered successfully');
  }, [room]);

  // Register RPC methods when room is connected
  useEffect(() => {
    if (room?.state === 'connected') {
      registerRpcMethods();
    }

    const handleConnected = () => {
      registerRpcMethods();
    };

    room?.on('connected', handleConnected);

    return () => {
      room?.off('connected', handleConnected);
    };
  }, [room, registerRpcMethods]);

  // Listen for agent navigation events and perform navigation
  useEffect(() => {
    const handleAgentNavigate = (event: CustomEvent<{ pathname: string }>) => {
      const { pathname } = event.detail;
      console.log('[UIElementsReporter] Agent navigation event received, navigating to:', pathname);
      navigate(pathname);
    };

    window.addEventListener('agent-navigate', handleAgentNavigate as EventListener);
    return () => window.removeEventListener('agent-navigate', handleAgentNavigate as EventListener);
  }, [navigate]);

  // Auto-scan when route changes and update participant attributes
  useEffect(() => {
    if (!room || room.state !== 'connected') return;

    // Delay scan to allow page to render
    const timer = setTimeout(() => {
      const elements = scanPageElements();
      const elementsJson = JSON.stringify(elements);

      // Only update if elements changed
      if (elementsJson !== lastElementsRef.current) {
        lastElementsRef.current = elementsJson;

        console.log('[UIElementsReporter] Page changed, scanned elements:', {
          path: location.pathname,
          count: elements.length,
          sample: elements.slice(0, 5).map(e => e.text)
        });

        // Update participant attributes so agent knows page changed
        try {
          room.localParticipant.setAttributes({
            'page.path': location.pathname,
            'page.title': document.title,
            'page.elementsCount': elements.length.toString(),
            'page.updated': Date.now().toString()
          });
        } catch (error) {
          console.warn('[UIElementsReporter] Could not set attributes:', error);
        }
      }
    }, 500); // Wait for page to render

    return () => clearTimeout(timer);
  }, [location.pathname, room]);

  // This component doesn't render anything
  return null;
};

export default UIElementsReporter;
