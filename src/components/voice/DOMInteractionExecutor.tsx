import { useEffect, useCallback } from 'react';
import { useRoomContext, useDataChannel } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { useToast } from '@/hooks/use-toast';

interface DOMAction {
  type: 'click' | 'fill' | 'read' | 'focus' | 'scroll';
  target: {
    id?: string;
    selector?: string;
    index?: number;
    text?: string;
    name?: string;
    role?: string;
    date?: string; // For finding report cards by date
  };
  value?: string; // For fill actions
}

export const DOMInteractionExecutor = () => {
  const room = useRoomContext();
  const { toast } = useToast();

  const findElement = (target: DOMAction['target']): HTMLElement | null => {
    console.log('[DOMInteractionExecutor] 🔍 Finding element with target:', target);

    // Try by ID first
    if (target.id) {
      const el = document.getElementById(target.id);
      if (el) {
        console.log('[DOMInteractionExecutor] ✅ Found element by ID:', target.id);
        return el;
      }
    }

    // Try by selector
    if (target.selector) {
      const elements = document.querySelectorAll(target.selector);
      if (target.index !== undefined && elements[target.index]) {
        return elements[target.index] as HTMLElement;
      }
      if (elements.length > 0) {
        return elements[0] as HTMLElement;
      }
    }

    // Try by text content
    if (target.text) {
      const searchText = target.text.toLowerCase().trim();
      const allClickableElements = Array.from(
        document.querySelectorAll('button, a, [role="button"], [onclick], [tabindex="0"]')
      );

      // Try exact match first
      const exactMatch = allClickableElements.find((el) => {
        const text = el.textContent?.trim().toLowerCase() || '';
        const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
        return text === searchText || ariaLabel === searchText;
      });

      if (exactMatch) {
        console.log('[DOMInteractionExecutor] ✅ Found exact text match:', target.text);
        return exactMatch as HTMLElement;
      }

      // Try partial match
      const partialMatch = allClickableElements.find((el) => {
        const text = el.textContent?.trim().toLowerCase() || '';
        const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
        return text.includes(searchText) || ariaLabel.includes(searchText);
      });

      if (partialMatch) {
        console.log('[DOMInteractionExecutor] ✅ Found partial text match:', target.text);
        return partialMatch as HTMLElement;
      }
    }

    // Try by role
    if (target.role) {
      const elements = document.querySelectorAll(`[role="${target.role}"]`);
      if (target.index !== undefined && elements[target.index]) {
        return elements[target.index] as HTMLElement;
      }
      if (elements.length > 0) {
        return elements[0] as HTMLElement;
      }
    }

    console.log('[DOMInteractionExecutor] ❌ Element not found with any method');
    return null;
  };

  const normalizeDate = (dateStr: string): string => {
    // Normalize date strings for comparison
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr.toLowerCase();
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const findReportCardByDate = (dateStr: string): HTMLElement | null => {
    console.log('[DOMInteractionExecutor] 🔍 Looking for report card with date:', dateStr);
    
    // Try to parse the date string
    let dateObj: Date;
    try {
      dateObj = new Date(dateStr);
      // If date parsing fails or gives invalid date, try alternative formats
      if (isNaN(dateObj.getTime())) {
        // Try parsing "2 nov 2025" format
        const parts = dateStr.toLowerCase().trim().split(/\s+/);
        if (parts.length >= 3) {
          const day = parseInt(parts[0]);
          const monthNames: { [key: string]: number } = {
            'jan': 1, 'january': 1, 'يناير': 1,
            'feb': 2, 'february': 2, 'فبراير': 2,
            'mar': 3, 'march': 3, 'مارس': 3,
            'apr': 4, 'april': 4, 'أبريل': 4,
            'may': 5, 'مايو': 5,
            'jun': 6, 'june': 6, 'يونيو': 6,
            'jul': 7, 'july': 7, 'يوليو': 7,
            'aug': 8, 'august': 8, 'أغسطس': 8,
            'sep': 9, 'september': 9, 'سبتمبر': 9,
            'oct': 10, 'october': 10, 'أكتوبر': 10,
            'nov': 11, 'november': 11, 'نوفمبر': 11,
            'dec': 12, 'december': 12, 'ديسمبر': 12
          };
          const month = monthNames[parts[1]] || parseInt(parts[1]);
          const year = parseInt(parts[2]);
          if (day && month && year) {
            dateObj = new Date(year, month - 1, day);
          }
        }
      }
    } catch (e) {
      console.error('[DOMInteractionExecutor] Error parsing date:', e);
      dateObj = new Date();
    }

    if (isNaN(dateObj.getTime())) {
      console.error('[DOMInteractionExecutor] Invalid date:', dateStr);
      return null;
    }

    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
    const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();

    console.log('[DOMInteractionExecutor] Parsed date:', { day, month, year, monthName, monthShort });

    // Find all cards (elements with card-like classes or structure)
    const cards = Array.from(
      document.querySelectorAll('[class*="card"], [class*="Card"], [data-testid*="card"]')
    );

    console.log('[DOMInteractionExecutor] Found', cards.length, 'potential cards');

    for (const card of cards) {
      const cardEl = card as HTMLElement;
      
      // Skip if not visible
      if (cardEl.offsetParent === null) continue;

      // Get all text content from the card
      const cardText = cardEl.textContent?.toLowerCase() || '';
      
      // Check various date formats - more flexible patterns
      const datePatterns = [
        // "2 november 2025" format
        new RegExp(`\\b${day}\\s+${monthName}\\s+${year}\\b`, 'i'),
        // "november 2, 2025" format (with comma)
        new RegExp(`\\b${monthName}\\s+${day}\\s*,?\\s+${year}\\b`, 'i'),
        // "November 2, 2025" format (exact match for common format)
        new RegExp(`\\b${monthName}\\s+${day}\\s*,?\\s+${year}\\b`, 'i'),
        // "2 nov 2025" format
        new RegExp(`\\b${day}\\s+${monthShort}\\s+${year}\\b`, 'i'),
        // "nov 2, 2025" format
        new RegExp(`\\b${monthShort}\\s+${day}\\s*,?\\s+${year}\\b`, 'i'),
        // "2/11/2025" or "11/2/2025" format
        new RegExp(`\\b${day}[/-]${month}[/-]${year}\\b`),
        new RegExp(`\\b${month}[/-]${day}[/-]${year}\\b`),
        // "2025-11-02" format
        new RegExp(`\\b${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}\\b`),
        // Just day and month (for current year)
        new RegExp(`\\b${day}\\s+${monthName}\\b`, 'i'),
        new RegExp(`\\b${monthName}\\s+${day}\\b`, 'i'),
        // Match exact text "November 2, 2025" (case insensitive)
        new RegExp(`${monthName}\\s+${day}\\s*,?\\s+${year}`, 'i'),
      ];

      // Check if card contains date
      const hasDate = datePatterns.some(pattern => {
        const matches = pattern.test(cardText);
        if (matches) {
          console.log('[DOMInteractionExecutor] ✅ Pattern matched:', pattern.toString());
        }
        return matches;
      });
      
      // Also check for date elements (like <span class="text-lg">November 2, 2025</span>)
      // First, try to find spans with text-lg class specifically
      const textLgSpans = cardEl.querySelectorAll('span.text-lg, [class*="text-lg"]');
      let hasTextLgDate = false;
      
      Array.from(textLgSpans).forEach((span) => {
        const spanText = span.textContent?.trim() || '';
        console.log('[DOMInteractionExecutor] Checking text-lg span:', spanText);
        const matches = datePatterns.some(pattern => {
          const match = pattern.test(spanText.toLowerCase());
          if (match) {
            console.log('[DOMInteractionExecutor] ✅ Text-lg span matched pattern:', pattern.toString(), 'Text:', spanText);
          }
          return match;
        });
        if (matches) {
          hasTextLgDate = true;
          console.log('[DOMInteractionExecutor] ✅✅✅ FOUND DATE IN TEXT-LG SPAN! ✅✅✅', spanText);
        }
      });
      
      // Also check for date elements
      const dateElements = cardEl.querySelectorAll('time, [class*="date"], [class*="Date"], div[class*="date"]');
      const hasDateElement = Array.from(dateElements).some((el) => {
        const elText = el.textContent?.trim() || '';
        const matches = datePatterns.some(pattern => pattern.test(elText.toLowerCase()));
        if (matches) {
          console.log('[DOMInteractionExecutor] ✅ Date element matched:', elText);
        }
        return matches;
      });
      
      // Also check ALL spans (fallback)
      const allSpans = cardEl.querySelectorAll('span');
      const hasAnySpanDate = Array.from(allSpans).some((span) => {
        const spanText = span.textContent?.trim() || '';
        // Check if this looks like a date (contains month name and day)
        if (spanText.length > 5 && spanText.length < 50) {
          const matches = datePatterns.some(pattern => pattern.test(spanText.toLowerCase()));
          if (matches) {
            console.log('[DOMInteractionExecutor] ✅ Any span matched:', spanText);
          }
          return matches;
        }
        return false;
      });

      if (hasDate || hasDateElement || hasTextLgDate || hasAnySpanDate) {
        console.log('[DOMInteractionExecutor] ✅✅✅ Found report card with matching date! ✅✅✅');
        console.log('[DOMInteractionExecutor] Card text preview:', cardText.substring(0, 150));
        
        // Look for "View Report" button inside this card
        const buttons = cardEl.querySelectorAll('button');
        console.log('[DOMInteractionExecutor] Found', buttons.length, 'buttons in card');
        
        const viewReportBtn = Array.from(buttons).find((btn) => {
          const text = btn.textContent?.trim().toLowerCase() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          const hasViewReport = text.includes('view report') || ariaLabel.includes('view report');
          if (hasViewReport) {
            console.log('[DOMInteractionExecutor] ✅ Found View Report button! Text:', text);
          }
          return hasViewReport;
        });
        
        if (viewReportBtn) {
          console.log('[DOMInteractionExecutor] ✅✅✅ Returning View Report button element ✅✅✅');
          return viewReportBtn as HTMLElement;
        }

        // If no button, return the card itself (it might be clickable)
        console.log('[DOMInteractionExecutor] ⚠️ No View Report button found, returning card itself');
        return cardEl;
      }
    }

    console.log('[DOMInteractionExecutor] ❌ No report card found with date:', dateStr);
    // Log all available dates for debugging
    console.log('[DOMInteractionExecutor] Available dates on page:');
    cards.slice(0, 10).forEach((card, idx) => {
      const cardEl = card as HTMLElement;
      const dateEls = cardEl.querySelectorAll('time, [class*="date"], [class*="Date"]');
      if (dateEls.length > 0) {
        dateEls.forEach((el) => {
          console.log(`  Card ${idx}: "${el.textContent?.trim()}"`);
        });
      }
    });
    return null;
  };

  const executeAction = useCallback(async (action: DOMAction): Promise<string> => {
    console.log('[DOMInteractionExecutor] 🎯 Executing action:', action);

    let element: HTMLElement | null = null;

    // Special handling for report cards with dates
    if (action.type === 'click' && action.target.date) {
      element = findReportCardByDate(action.target.date);
      if (!element && action.target.text === 'View Report') {
        // If we found a card but no button, try to find the button separately
        element = findElement({ text: 'View Report' });
      }
    } else {
      element = findElement(action.target);
    }

    if (!element) {
      const errorMsg = `Element not found: ${JSON.stringify(action.target)}`;
      console.error('[DOMInteractionExecutor] ❌', errorMsg);
      throw new Error(errorMsg);
    }

    try {
      switch (action.type) {
        case 'click':
          console.log('[DOMInteractionExecutor] 🖱️ Clicking element:', element);
          // Use native click first
          element.click();
          
          // Also dispatch mouse events for React compatibility
          const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
          const mouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
          const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
          
          element.dispatchEvent(mouseDown);
          element.dispatchEvent(mouseUp);
          element.dispatchEvent(clickEvent);
          
          return `Clicked: ${action.target.text || action.target.id || 'element'}`;

        case 'fill':
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value = action.value || '';
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return `Filled ${action.target.name || action.target.id || 'input'} with: ${action.value}`;
          }
          throw new Error('Element is not an input field');

        case 'read':
          return `Text: ${element.textContent?.trim() || 'No text content'}`;

        case 'focus':
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return `Focused on: ${action.target.text || action.target.id || 'element'}`;

        case 'scroll':
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return `Scrolled to: ${action.target.text || action.target.id || 'element'}`;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error('[DOMInteractionExecutor] ❌ Error executing action:', error);
      throw error;
    }
  }, []);

  // Listen for DOM actions via useDataChannel
  const { message } = useDataChannel('dom-action', (msg) => {
    console.log('[DOMInteractionExecutor] 📨 useDataChannel callback received message:', msg);

    try {
      let actionData: any;

      if (typeof msg === 'string') {
        actionData = JSON.parse(msg);
      } else if ((msg as any)?.payload) {
        const payload = (msg as any).payload;
        actionData = typeof payload === 'string' ? JSON.parse(payload) : payload;
      } else if ((msg as any)?.data) {
        const data = (msg as any).data;
        actionData = typeof data === 'string' ? JSON.parse(data) : data;
      } else {
        actionData = msg;
      }

      if (actionData.type === 'dom-action' && actionData.action) {
        const action = actionData.action as DOMAction;
        console.log('[DOMInteractionExecutor] 🎯🎯🎯 EXECUTING DOM ACTION! 🎯🎯🎯', action);

        executeAction(action)
          .then((result) => {
            console.log('[DOMInteractionExecutor] ✅ Action result:', result);

            // Send result back to agent
            if (room && room.state === 'connected') {
              const response = {
                type: 'dom-action-result',
                actionId: actionData.actionId,
                result: result,
                success: true,
              };

              const responseJson = JSON.stringify(response);
              const responseBytes = new TextEncoder().encode(responseJson);

              room.localParticipant.publishData(
                responseBytes,
                { reliable: true, topic: 'dom-action-result' }
              ).catch((err) => {
                console.error('[DOMInteractionExecutor] Failed to send result:', err);
              });
            }

            toast({
              title: 'Voice Action',
              description: result,
            });
          })
          .catch((error) => {
            console.error('[DOMInteractionExecutor] ❌ Action failed:', error);
            toast({
              title: 'Action Failed',
              description: error instanceof Error ? error.message : 'Unknown error',
              variant: 'destructive',
            });
          });
      }
    } catch (e) {
      console.error('[DOMInteractionExecutor] Error parsing message:', e, msg);
    }
  });

  // Also listen via RoomEvent.DataReceived (fallback)
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: any,
      kind?: any,
      topic?: string
    ) => {
      if (topic !== 'dom-action') return;

      try {
        const decoder = new TextDecoder();
        const rawText = decoder.decode(payload);
        const message = JSON.parse(rawText);

        if (message.type === 'dom-action' && message.action) {
          const action = message.action as DOMAction;
          console.log('[DOMInteractionExecutor] 🎯 Executing action from RoomEvent:', action);

          executeAction(action)
            .then((result) => {
              console.log('[DOMInteractionExecutor] ✅ Action result:', result);
              toast({
                title: 'Voice Action',
                description: result,
              });
            })
            .catch((error) => {
              console.error('[DOMInteractionExecutor] ❌ Action failed:', error);
              toast({
                title: 'Action Failed',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive',
              });
            });
        }
      } catch (error) {
        console.error('[DOMInteractionExecutor] Error parsing data message:', error);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, executeAction, toast]);

  return null;
};
