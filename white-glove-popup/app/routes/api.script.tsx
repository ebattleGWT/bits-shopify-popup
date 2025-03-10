import { json, type LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response("Shop parameter is required", { status: 400 });
  }

  // Set cache headers for better performance
  const headers = {
    "Content-Type": "application/javascript",
    "Cache-Control": "public, max-age=300", // Cache for 5 minutes
  };

  // The actual script content
  const script = `
    (function() {
      const POPUP_STORAGE_PREFIX = 'shopify_popup_';
      let activePopup = null;

      // Add tracking function
      async function trackEvent(popupId, eventType, metadata = {}) {
        try {
          const deviceType = getDeviceType();
          const page = getCurrentPage();
          const country = await getVisitorCountry();
          const sessionId = getOrCreateSessionId();

          await fetch('/api/events', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              popupId,
              eventType,
              deviceType,
              country,
              page,
              metadata,
              sessionId,
              shop: '${shop}',
            }),
          });
        } catch (error) {
          console.error('Failed to track event:', error);
        }
      }

      // Helper function to manage session IDs
      function getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('popup_session_id');
        if (!sessionId) {
          sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
          sessionStorage.setItem('popup_session_id', sessionId);
        }
        return sessionId;
      }

      // Helper function to check device type
      function getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'MOBILE';
        if (width < 1024) return 'TABLET';
        return 'DESKTOP';
      }

      // Helper function to get current page path
      function getCurrentPage() {
        return window.location.pathname;
      }

      // Helper function to get visitor's country
      async function getVisitorCountry() {
        try {
          const response = await fetch('https://ipapi.co/country');
          return await response.text();
        } catch (error) {
          console.error('Failed to get visitor country:', error);
          return null;
        }
      }

      // Helper function to check if popup should be shown based on frequency
      function shouldShowBasedOnFrequency(popup) {
        const storageKey = POPUP_STORAGE_PREFIX + popup.id;
        const lastShown = localStorage.getItem(storageKey);
        
        if (!lastShown) return true;

        const lastShownDate = new Date(lastShown);
        const now = new Date();

        switch (popup.frequency) {
          case 'ONCE':
            return false;
          case 'DAILY':
            return now.getDate() !== lastShownDate.getDate() ||
                   now.getMonth() !== lastShownDate.getMonth() ||
                   now.getFullYear() !== lastShownDate.getFullYear();
          case 'WEEKLY':
            const weekDiff = (now.getTime() - lastShownDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
            return weekDiff >= 1;
          default: // ALWAYS
            return true;
        }
      }

      // Helper function to check if popup should be shown based on schedule
      function shouldShowBasedOnSchedule(popup) {
        const now = new Date();
        
        if (popup.startDate && new Date(popup.startDate) > now) return false;
        if (popup.endDate && new Date(popup.endDate) < now) return false;
        
        return true;
      }

      // Update createPopup function to track events
      function createPopup(popup) {
        // Track impression
        trackEvent(popup.id, 'IMPRESSION');

        // Create container
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.padding = '20px';
        container.style.borderRadius = '8px';
        container.style.maxWidth = '400px';
        container.style.width = '90%';
        container.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        container.style.zIndex = '999999';
        
        // Apply position
        switch (popup.position) {
          case 'TOP':
            container.style.top = '20px';
            container.style.left = '50%';
            container.style.transform = 'translateX(-50%)';
            break;
          case 'BOTTOM':
            container.style.bottom = '20px';
            container.style.left = '50%';
            container.style.transform = 'translateX(-50%)';
            break;
          case 'LEFT':
            container.style.left = '20px';
            container.style.top = '50%';
            container.style.transform = 'translateY(-50%)';
            break;
          case 'RIGHT':
            container.style.right = '20px';
            container.style.top = '50%';
            container.style.transform = 'translateY(-50%)';
            break;
          default: // CENTER
            container.style.top = '50%';
            container.style.left = '50%';
            container.style.transform = 'translate(-50%, -50%)';
        }

        // Apply theme
        switch (popup.theme) {
          case 'DARK':
            container.style.backgroundColor = '#333';
            container.style.color = '#fff';
            break;
          case 'CUSTOM':
            if (popup.customCss) {
              try {
                const customStyles = JSON.parse(popup.customCss);
                Object.assign(container.style, customStyles);
              } catch (e) {
                console.error('Failed to parse custom CSS');
              }
            }
            break;
          default: // LIGHT
            container.style.backgroundColor = '#fff';
            container.style.color = '#333';
        }

        // Prepare content based on popup type
        let contentHtml = '';
        if (popup.image) {
          contentHtml += \`
            <div style="margin-bottom: 15px">
              <img src="\${popup.image}" alt="" style="max-width: 100%; height: auto;">
            </div>
          \`;
        }

        contentHtml += \`
          <div style="margin-bottom: 15px">
            <h2 style="margin: 0; font-size: 1.2em">\${popup.title}</h2>
          </div>
          <div style="margin-bottom: 20px">
            <p style="margin: 0">\${popup.content}</p>
          </div>
        \`;

        // Add form for newsletter popups
        if (popup.popupType === 'NEWSLETTER') {
          contentHtml += \`
            <form id="popup-form-\${popup.id}" style="margin-bottom: 20px">
              <div style="margin-bottom: 15px">
                <input 
                  type="email" 
                  placeholder="\${popup.emailPlaceholder || 'Enter your email'}"
                  required
                  style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
                >
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 10px">
                <button 
                  type="button"
                  onclick="this.closest('.popup-container').remove(); window.trackPopupClose('\${popup.id}')"
                  style="padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; background: transparent; cursor: pointer"
                >
                  \${popup.secondaryButtonText || 'No, thanks'}
                </button>
                <button 
                  type="submit"
                  style="padding: 8px 16px; border: none; border-radius: 4px; background: \${popup.buttonColor || '#5c6ac4'}; color: \${popup.buttonTextColor || '#fff'}; cursor: pointer"
                >
                  \${popup.buttonText || 'Subscribe'}
                </button>
              </div>
            </form>
            <div id="popup-message-\${popup.id}" style="display: none; margin-top: 10px; text-align: center;"></div>
          \`;
        } else {
          // Standard buttons for non-newsletter popups
          contentHtml += \`
            <div style="display: flex; justify-content: flex-end; gap: 10px">
              <button 
                onclick="this.closest('.popup-container').remove(); window.trackPopupClose('\${popup.id}')"
                style="padding: 8px 16px; border: none; border-radius: 4px; background: \${popup.buttonColor || '#5c6ac4'}; color: \${popup.buttonTextColor || '#fff'}; cursor: pointer"
              >
                \${popup.buttonText || 'Close'}
              </button>
            </div>
          \`;
        }

        // Set content and add class
        container.innerHTML = contentHtml;
        container.className = 'popup-container';

        // Add form submission handler for newsletter popups
        if (popup.popupType === 'NEWSLETTER') {
          const form = container.querySelector(\`#popup-form-\${popup.id}\`);
          const messageDiv = container.querySelector(\`#popup-message-\${popup.id}\`);

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]').value;

            try {
              const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email,
                  popupId: popup.id,
                  shop: '${shop}',
                  metadata: {
                    page: getCurrentPage(),
                    deviceType: getDeviceType(),
                  },
                }),
              });

              const data = await response.json();
              
              if (data.success) {
                form.style.display = 'none';
                messageDiv.style.display = 'block';
                messageDiv.style.color = '#4caf50';
                messageDiv.textContent = popup.successMessage || 'Thank you for subscribing!';
                
                // Track conversion
                trackEvent(popup.id, 'CONVERSION', { email });
                
                // Remove popup after delay
                setTimeout(() => {
                  container.remove();
                }, 3000);
              } else {
                throw new Error(data.error || 'Subscription failed');
              }
            } catch (error) {
              messageDiv.style.display = 'block';
              messageDiv.style.color = '#f44336';
              messageDiv.textContent = popup.errorMessage || 'Something went wrong. Please try again.';
              console.error('Subscription error:', error);
            }
          });
        }

        // Add click tracking to the entire popup
        container.addEventListener('click', (e) => {
          // Don't track clicks on the close button or form elements
          if (!e.target.closest('button') && !e.target.closest('form')) {
            trackEvent(popup.id, 'CLICK', {
              elementType: e.target.tagName.toLowerCase(),
              text: e.target.textContent,
            });
          }
        });

        // Add to page
        document.body.appendChild(container);
        activePopup = container;

        // Store last shown time
        localStorage.setItem(POPUP_STORAGE_PREFIX + popup.id, new Date().toISOString());
      }

      // Add global tracking functions
      window.trackPopupClose = function(popupId) {
        trackEvent(popupId, 'CLOSE');
      };

      window.trackPopupConversion = function(popupId, metadata = {}) {
        trackEvent(popupId, 'CONVERSION', metadata);
      };

      // Main function to check and show popups
      async function checkAndShowPopups() {
        try {
          // Don't check if a popup is already showing
          if (activePopup) return;

          const response = await fetch('/api/popups?shop=${shop}');
          const { popups } = await response.json();

          const deviceType = getDeviceType();
          const currentPage = getCurrentPage();
          const country = await getVisitorCountry();

          for (const popup of popups) {
            if (!popup.isEnabled) continue;
            
            // Check schedule
            if (!shouldShowBasedOnSchedule(popup)) continue;

            // Check frequency
            if (!shouldShowBasedOnFrequency(popup)) continue;

            // Check device type
            if (popup.deviceTypes) {
              const allowedDevices = JSON.parse(popup.deviceTypes);
              if (!allowedDevices.includes(deviceType)) continue;
            }

            // Check page
            if (popup.showOnPages) {
              const allowedPages = JSON.parse(popup.showOnPages);
              if (!allowedPages.some(page => currentPage.includes(page))) continue;
            }

            // Check country
            if (popup.countries && country) {
              const allowedCountries = JSON.parse(popup.countries);
              if (!allowedCountries.includes(country)) continue;
            }

            // All checks passed, show popup after delay
            setTimeout(() => createPopup(popup), popup.delay * 1000);
            break; // Only show one popup at a time
          }
        } catch (error) {
          console.error('Failed to fetch or show popups:', error);
        }
      }

      // Check for popups when page loads and when it becomes visible
      document.addEventListener('DOMContentLoaded', checkAndShowPopups);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkAndShowPopups();
        }
      });

      // Add necessary CSS for animations
      const style = document.createElement('style');
      style.textContent = \`
        @keyframes fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bounce {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 0.8; }
          70% { transform: scale(0.9); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
      \`;
      document.head.appendChild(style);
    })();
  `;

  return new Response(script, { headers });
} 