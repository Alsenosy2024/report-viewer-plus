import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useRoomContext } from '@livekit/components-react';

interface PageContent {
  pathname: string;
  title: string;
  elements: {
    buttons: Array<{
      id?: string;
      text?: string;
      name?: string;
      ariaLabel?: string;
    }>;
    inputs: Array<{
      id?: string;
      name?: string;
      type?: string;
      placeholder?: string;
      value?: string;
      ariaLabel?: string;
    }>;
    links: Array<{
      id?: string;
      text?: string;
      href?: string;
      ariaLabel?: string;
    }>;
    cards: Array<{
      id?: string;
      text?: string;
      date?: string;
      ariaLabel?: string;
    }>;
  };
}

export const PageContentSender = () => {
  const room = useRoomContext();
  const location = useLocation();
  const lastSentPathRef = useRef<string | null>(null);

  const extractPageContent = (): PageContent | null => {
    try {
      const buttons: PageContent['elements']['buttons'] = [];
      const inputs: PageContent['elements']['inputs'] = [];
      const links: PageContent['elements']['links'] = [];
      const cards: PageContent['elements']['cards'] = [];

      // Extract buttons
      document.querySelectorAll('button, [role="button"]').forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.offsetParent !== null) {
          buttons.push({
            id: htmlEl.id || undefined,
            text: htmlEl.textContent?.trim() || undefined,
            name: (htmlEl as HTMLButtonElement).name || undefined,
            ariaLabel: htmlEl.getAttribute('aria-label') || undefined,
          });
        }
      });

      // Extract inputs
      document.querySelectorAll('input, textarea, select').forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.offsetParent !== null) {
          const inputEl = el as HTMLInputElement;
          inputs.push({
            id: inputEl.id || undefined,
            name: inputEl.name || undefined,
            type: inputEl.type || undefined,
            placeholder: inputEl.placeholder || undefined,
            value: inputEl.value || undefined,
            ariaLabel: inputEl.getAttribute('aria-label') || undefined,
          });
        }
      });

      // Extract links
      document.querySelectorAll('a[href]').forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.offsetParent !== null) {
          const linkEl = el as HTMLAnchorElement;
          links.push({
            id: linkEl.id || undefined,
            text: linkEl.textContent?.trim() || undefined,
            href: linkEl.href || undefined,
            ariaLabel: linkEl.getAttribute('aria-label') || undefined,
          });
        }
      });

      // Extract report cards (cards with dates)
      document.querySelectorAll('[class*="card"], [class*="Card"]').forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.offsetParent !== null) {
          // Look for date information in the card
          const dateElements = htmlEl.querySelectorAll('[class*="date"], [class*="Date"], time');
          const dateText = Array.from(dateElements)
            .map((d) => d.textContent?.trim())
            .filter(Boolean)
            .join(' ');

          // Look for "View Report" button inside the card
          // Note: :has-text() is Playwright-specific, so we need to check manually
          const buttons = htmlEl.querySelectorAll('button, [role="button"]');
          const hasViewReport = Array.from(buttons).some((btn) => {
            const text = btn.textContent?.trim() || '';
            const ariaLabel = btn.getAttribute('aria-label') || '';
            return text.includes('View Report') || ariaLabel.includes('View Report');
          });

          if (dateText || hasViewReport) {
            cards.push({
              id: htmlEl.id || undefined,
              text: htmlEl.textContent?.trim().substring(0, 200) || undefined,
              date: dateText || undefined,
              ariaLabel: htmlEl.getAttribute('aria-label') || undefined,
            });
          }
        }
      });

      return {
        pathname: location.pathname,
        title: document.title,
        elements: {
          buttons,
          inputs,
          links,
          cards,
        },
      };
    } catch (error) {
      console.error('[PageContentSender] Error extracting page content:', error);
      return null;
    }
  };

  const sendPageContent = async () => {
    if (!room || room.state !== 'connected') {
      return;
    }

    const pageContent = extractPageContent();
    if (!pageContent) {
      return;
    }

    try {
      const message = {
        type: 'page-content',
        content: pageContent,
      };

      const messageJson = JSON.stringify(message);
      const messageBytes = new TextEncoder().encode(messageJson);

      await (room.localParticipant as any).publishData(
        messageBytes,
        { reliable: true, topic: 'page-content' }
      );

      console.log('[PageContentSender] ✅ Sent page content to agent:', {
        pathname: pageContent.pathname,
        buttons: pageContent.elements.buttons.length,
        inputs: pageContent.elements.inputs.length,
        links: pageContent.elements.links.length,
        cards: pageContent.elements.cards.length,
      });

      lastSentPathRef.current = pageContent.pathname;
    } catch (error) {
      console.error('[PageContentSender] ❌ Failed to send page content:', error);
    }
  };

  // Send page content when route changes or room connects
  useEffect(() => {
    if (room && room.state === 'connected') {
      // Send immediately
      sendPageContent();

      // Also send after a short delay to ensure page is fully loaded
      const timeout = setTimeout(() => {
        sendPageContent();
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [location.pathname, room?.state]);

  return null;
};