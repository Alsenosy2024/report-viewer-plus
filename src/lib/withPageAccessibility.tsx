import React, { useEffect, useRef } from 'react';

/**
 * Configuration options for the accessibility factory
 */
export interface AccessibilityConfig {
  /**
   * Whether to apply document role to root element
   * @default true
   */
  applyDocumentRole?: boolean;
  
  /**
   * Whether to enhance navigation elements
   * @default true
   */
  enhanceNavigation?: boolean;
  
  /**
   * Whether to enhance live regions
   * @default true
   */
  enhanceLiveRegions?: boolean;
  
  /**
   * Whether to enhance headings
   * @default true
   */
  enhanceHeadings?: boolean;
  
  /**
   * Whether to enhance non-semantic interactive elements
   * @default true
   */
  enhanceInteractiveElements?: boolean;
  
  /**
   * Whether to enhance form elements
   * @default true
   */
  enhanceForms?: boolean;
  
  /**
   * Whether to enhance custom elements (modals, carousels, etc.)
   * @default true
   */
  enhanceCustomElements?: boolean;
  
  /**
   * Custom aria-label for navigation elements
   * @default 'Main navigation'
   */
  navigationAriaLabel?: string;
  
  /**
   * Whether to log accessibility enhancements for debugging
   * @default false
   */
  debug?: boolean;
}

/**
 * Default configuration for accessibility enhancements
 */
const defaultConfig: AccessibilityConfig = {
  applyDocumentRole: true,
  enhanceNavigation: true,
  enhanceLiveRegions: true,
  enhanceHeadings: true,
  enhanceInteractiveElements: true,
  enhanceForms: true,
  enhanceCustomElements: true,
  navigationAriaLabel: 'Main navigation',
  debug: false,
};

/**
 * Factory function that wraps a page component with accessibility enhancements
 * 
 * @param PageComponent - The React component to wrap
 * @param config - Optional configuration for accessibility features
 * @returns A wrapped component with accessibility enhancements
 * 
 * @example
 * ```tsx
 * import { withPageAccessibility } from '@/lib/withPageAccessibility';
 * 
 * const MyPage = () => {
 *   return <div>My Page Content</div>;
 * };
 * 
 * export default withPageAccessibility(MyPage);
 * ```
 */
export function withPageAccessibility<P extends object>(
  PageComponent: React.ComponentType<P>,
  config: AccessibilityConfig = {}
): React.ComponentType<P> {
  const mergedConfig = { ...defaultConfig, ...config };

  const AccessibilityWrapper = (props: P) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<MutationObserver | null>(null);

    useEffect(() => {
      const applyAccessibilityEnhancements = () => {
        const rootElement = document.getElementById('root') || document.body;
        const container = containerRef.current || rootElement;

        if (mergedConfig.debug) {
          console.log('[Accessibility] Applying enhancements to page...');
        }

        // 1. Apply document role to root element
        if (mergedConfig.applyDocumentRole && rootElement) {
          if (!rootElement.hasAttribute('role')) {
            rootElement.setAttribute('role', 'document');
            if (mergedConfig.debug) {
              console.log('[Accessibility] Applied role="document" to root element');
            }
          }
        }

        // 2. Enhance navigation elements
        if (mergedConfig.enhanceNavigation) {
          const navElements = container.querySelectorAll('nav');
          navElements.forEach((nav) => {
            if (!nav.hasAttribute('role')) {
              nav.setAttribute('role', 'navigation');
            }
            if (!nav.hasAttribute('aria-label') && !nav.querySelector('[aria-label]')) {
              nav.setAttribute('aria-label', mergedConfig.navigationAriaLabel || 'Main navigation');
            }
            if (mergedConfig.debug) {
              console.log('[Accessibility] Enhanced navigation element:', nav);
            }
          });
        }

        // 3. Enhance live regions for dynamic content
        if (mergedConfig.enhanceLiveRegions) {
          // Find elements that might need aria-live but don't have it
          const dynamicRegions = container.querySelectorAll(
            '[data-live-region], [data-notification], [data-alert], [data-toast]'
          );
          dynamicRegions.forEach((region) => {
            if (!region.hasAttribute('aria-live')) {
              const liveType = region.getAttribute('data-live-region') || 'polite';
              region.setAttribute('aria-live', liveType);
              region.setAttribute('aria-atomic', 'true');
              if (mergedConfig.debug) {
                console.log('[Accessibility] Enhanced live region:', region, liveType);
              }
            }
          });

          // Ensure existing aria-live regions have proper attributes
          const liveRegions = container.querySelectorAll('[aria-live]');
          liveRegions.forEach((region) => {
            if (!region.hasAttribute('aria-atomic')) {
              region.setAttribute('aria-atomic', 'true');
            }
          });
        }

        // 4. Enhance headings structure
        if (mergedConfig.enhanceHeadings) {
          const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
          let previousLevel = 0;
          
          headings.forEach((heading) => {
            const tagName = heading.tagName.toLowerCase();
            const level = parseInt(tagName.charAt(1));
            
            // Ensure proper heading hierarchy
            if (level > previousLevel + 1 && previousLevel > 0) {
              console.warn(
                `[Accessibility] Heading hierarchy issue: ${tagName} follows h${previousLevel}. Consider using h${previousLevel + 1} instead.`,
                heading
              );
            }
            
            // Add aria-level if not present (useful for custom headings)
            if (!heading.hasAttribute('aria-level')) {
              heading.setAttribute('aria-level', level.toString());
            }
            
            previousLevel = level;
          });

          if (mergedConfig.debug && headings.length > 0) {
            console.log(`[Accessibility] Enhanced ${headings.length} heading(s)`);
          }
        }

        // 5. Enhance non-semantic interactive elements
        if (mergedConfig.enhanceInteractiveElements) {
          // Elements with role="button" that need aria-label
          const buttonDivs = container.querySelectorAll('[role="button"]');
          buttonDivs.forEach((element) => {
            if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
              const textContent = element.textContent?.trim();
              if (textContent) {
                element.setAttribute('aria-label', textContent);
                if (mergedConfig.debug) {
                  console.log('[Accessibility] Added aria-label to button:', textContent);
                }
              }
            }
            // Ensure buttons are keyboard accessible
            if (!element.hasAttribute('tabindex') && element.tagName !== 'BUTTON') {
              element.setAttribute('tabindex', '0');
            }
          });

          // Elements with role="link" that need proper attributes
          const linkDivs = container.querySelectorAll('[role="link"]');
          linkDivs.forEach((element) => {
            if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
              const textContent = element.textContent?.trim();
              if (textContent) {
                element.setAttribute('aria-label', textContent);
              }
            }
            if (!element.hasAttribute('tabindex')) {
              element.setAttribute('tabindex', '0');
            }
          });

          // Ensure all anchor tags without href have proper roles
          const anchorTags = container.querySelectorAll('a:not([href])');
          anchorTags.forEach((anchor) => {
            if (!anchor.hasAttribute('role')) {
              anchor.setAttribute('role', 'button');
              anchor.setAttribute('tabindex', '0');
            }
          });
        }

        // 6. Enhance form elements
        if (mergedConfig.enhanceForms) {
          // Ensure all inputs have labels
          const inputs = container.querySelectorAll('input, textarea, select');
          inputs.forEach((input) => {
            const id = input.id || `input-${Math.random().toString(36).substr(2, 9)}`;
            if (!input.id) {
              input.id = id;
            }

            // Check if input has associated label
            const label = container.querySelector(`label[for="${id}"]`);
            if (!label && !input.hasAttribute('aria-label') && !input.hasAttribute('aria-labelledby')) {
              const placeholder = input.getAttribute('placeholder');
              if (placeholder) {
                input.setAttribute('aria-label', placeholder);
              }
            }

            // Add aria-required for required fields
            if (input.hasAttribute('required') && !input.hasAttribute('aria-required')) {
              input.setAttribute('aria-required', 'true');
            }

            // Add aria-invalid for error states
            if (input.classList.contains('error') || input.hasAttribute('data-error')) {
              if (!input.hasAttribute('aria-invalid')) {
                input.setAttribute('aria-invalid', 'true');
              }
            }
          });

          // Enhance form validation messages
          const errorMessages = container.querySelectorAll('[data-error-message], .error-message, [role="alert"]');
          errorMessages.forEach((error) => {
            if (!error.hasAttribute('role')) {
              error.setAttribute('role', 'alert');
            }
            if (!error.hasAttribute('aria-live')) {
              error.setAttribute('aria-live', 'polite');
            }
          });

          if (mergedConfig.debug && inputs.length > 0) {
            console.log(`[Accessibility] Enhanced ${inputs.length} form element(s)`);
          }
        }

        // 7. Enhance custom elements (modals, carousels, etc.)
        if (mergedConfig.enhanceCustomElements) {
          // Enhance modals/dialogs
          const modals = container.querySelectorAll('[data-modal], [role="dialog"]');
          modals.forEach((modal) => {
            if (!modal.hasAttribute('role')) {
              modal.setAttribute('role', 'dialog');
            }
            if (!modal.hasAttribute('aria-modal')) {
              modal.setAttribute('aria-modal', 'true');
            }
            if (!modal.hasAttribute('aria-labelledby') && !modal.hasAttribute('aria-label')) {
              const title = modal.querySelector('h1, h2, h3, h4, h5, h6, [data-modal-title]');
              if (title) {
                const titleId = title.id || `modal-title-${Math.random().toString(36).substr(2, 9)}`;
                if (!title.id) {
                  title.id = titleId;
                }
                modal.setAttribute('aria-labelledby', titleId);
              }
            }
          });

          // Enhance carousels/sliders
          const carousels = container.querySelectorAll('[data-carousel], [role="region"][aria-label*="carousel"]');
          carousels.forEach((carousel) => {
            if (!carousel.hasAttribute('role')) {
              carousel.setAttribute('role', 'region');
            }
            if (!carousel.hasAttribute('aria-label') && !carousel.hasAttribute('aria-labelledby')) {
              carousel.setAttribute('aria-label', 'Carousel');
            }
            const slides = carousel.querySelectorAll('[data-slide]');
            slides.forEach((slide, index) => {
              if (!slide.hasAttribute('aria-label')) {
                slide.setAttribute('aria-label', `Slide ${index + 1} of ${slides.length}`);
              }
            });
          });

          // Enhance accordions/collapsible sections
          const accordions = container.querySelectorAll('[data-accordion], [role="region"]');
          accordions.forEach((accordion) => {
            const trigger = accordion.querySelector('[data-accordion-trigger], button, [role="button"]');
            if (trigger && !trigger.hasAttribute('aria-expanded')) {
              trigger.setAttribute('aria-expanded', 'false');
            }
            if (trigger && !trigger.hasAttribute('aria-controls')) {
              const contentId = accordion.id || `accordion-${Math.random().toString(36).substr(2, 9)}`;
              if (!accordion.id) {
                accordion.id = contentId;
              }
              trigger.setAttribute('aria-controls', contentId);
            }
          });

          // Enhance tabs
          const tabPanels = container.querySelectorAll('[role="tabpanel"]');
          tabPanels.forEach((panel) => {
            if (!panel.hasAttribute('aria-labelledby') && !panel.hasAttribute('aria-label')) {
              const tabs = panel.closest('[role="tablist"]');
              if (tabs) {
                const tabId = `${panel.id || `tabpanel-${Math.random().toString(36).substr(2, 9)}`}-tab`;
                panel.setAttribute('aria-labelledby', tabId);
              }
            }
          });

          if (mergedConfig.debug && (modals.length > 0 || carousels.length > 0 || accordions.length > 0)) {
            console.log('[Accessibility] Enhanced custom elements:', {
              modals: modals.length,
              carousels: carousels.length,
              accordions: accordions.length,
            });
          }
        }

        // Ensure main content region exists
        const mainContent = container.querySelector('main, [role="main"]');
        if (!mainContent && container.tagName === 'MAIN') {
          container.setAttribute('role', 'main');
        } else if (!mainContent && container.querySelector('main')) {
          // main element already exists, ensure it has role
          const main = container.querySelector('main');
          if (main && !main.hasAttribute('role')) {
            main.setAttribute('role', 'main');
          }
        }
      };

      // Apply enhancements on mount
      applyAccessibilityEnhancements();

      // Watch for dynamic content changes
      if (typeof MutationObserver !== 'undefined') {
        observerRef.current = new MutationObserver(() => {
          // Debounce the enhancement application
          setTimeout(applyAccessibilityEnhancements, 100);
        });

        const container = containerRef.current || document.getElementById('root') || document.body;
        observerRef.current.observe(container, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'data-live-region', 'data-error'],
        });
      }

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, []);

    return (
      <div ref={containerRef}>
        <PageComponent {...props} />
      </div>
    );
  };

  // Set display name for better debugging
  AccessibilityWrapper.displayName = `withPageAccessibility(${PageComponent.displayName || PageComponent.name || 'Component'})`;

  return AccessibilityWrapper;
}

/**
 * Hook version for functional components that need more control
 * 
 * @param config - Configuration for accessibility features
 * @returns A ref to attach to the container element
 * 
 * @example
 * ```tsx
 * import { usePageAccessibility } from '@/lib/withPageAccessibility';
 * 
 * const MyPage = () => {
 *   const accessibilityRef = usePageAccessibility();
 *   
 *   return <div ref={accessibilityRef}>My Page Content</div>;
 * };
 * ```
 */
export function usePageAccessibility(config: AccessibilityConfig = {}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This will be implemented similarly to the HOC version
    // but allows for more granular control in components
    const mergedConfig = { ...defaultConfig, ...config };

    const applyAccessibilityEnhancements = () => {
      const container = containerRef.current;
      if (!container) return;

      // Apply the same enhancements as the HOC
      // Implementation would be similar to above
    };

    applyAccessibilityEnhancements();

    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        setTimeout(applyAccessibilityEnhancements, 100);
      });

      if (containerRef.current) {
        observer.observe(containerRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
        });
      }

      return () => observer.disconnect();
    }
  }, []);

  return containerRef;
}

