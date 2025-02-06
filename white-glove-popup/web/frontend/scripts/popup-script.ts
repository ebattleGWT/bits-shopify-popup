interface PopupManager {
  init(): void;
  showPopup(popup: any): void;
  hidePopup(): void;
  handleAction(action: string): void;
  checkTriggerConditions(popup: any): boolean;
}

class StorePopupManager implements PopupManager {
  private container: HTMLDivElement | null = null;
  private currentPopup: any = null;

  init() {
    this.container = document.createElement('div');
    this.container.id = 'shopify-popup-container';
    document.body.appendChild(this.container);
    this.fetchAndInitPopups();
  }

  private async fetchAndInitPopups() {
    try {
      const response = await fetch('/apps/popup/active');
      const popups = await response.json();
      
      popups.forEach((popup: any) => {
        if (this.checkTriggerConditions(popup)) {
          this.showPopup(popup);
        }
      });
    } catch (error) {
      console.error('Failed to fetch popups:', error);
    }
  }

  showPopup(popup: any) {
    if (!this.container) return;
    
    this.currentPopup = popup;
    const html = this.generatePopupHTML(popup);
    this.container.innerHTML = html;
    this.container.style.display = 'block';
    
    this.trackView(popup);
  }

  hidePopup() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  handleAction(action: string) {
    if (!this.currentPopup) return;

    switch (this.currentPopup.cta.type) {
      case 'discount':
        this.applyDiscount(action);
        break;
      case 'addToCart':
        this.addToCart(action);
        break;
      case 'emailCapture':
        this.captureEmail();
        break;
      case 'link':
        window.location.href = action;
        break;
    }

    this.trackConversion(this.currentPopup);
    this.hidePopup();
  }

  checkTriggerConditions(popup: any): boolean {
    switch (popup.displayConditions.triggerType) {
      case 'pageLoad':
        return this.handlePageLoadTrigger(popup);
      case 'exitIntent':
        return this.handleExitIntentTrigger(popup);
      case 'scroll':
        return this.handleScrollTrigger(popup);
      default:
        return false;
    }
  }

  private handlePageLoadTrigger(popup: any): boolean {
    if (popup.displayConditions.delay) {
      setTimeout(() => this.showPopup(popup), popup.displayConditions.delay * 1000);
      return false;
    }
    return true;
  }

  private handleExitIntentTrigger(popup: any): boolean {
    document.addEventListener('mouseleave', (e) => {
      if (e.clientY <= 0) {
        this.showPopup(popup);
      }
    });
    return false;
  }

  private handleScrollTrigger(popup: any): boolean {
    const scrollHandler = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= popup.displayConditions.scrollPercentage) {
        this.showPopup(popup);
        window.removeEventListener('scroll', scrollHandler);
      }
    };
    window.addEventListener('scroll', scrollHandler);
    return false;
  }

  private generatePopupHTML(popup: any): string {
    // Generate HTML based on popup configuration
    return `
      <div class="popup-overlay">
        <div class="popup-content" style="background-color: ${popup.design.colors.background}">
          <button class="popup-close" onclick="popupManager.hidePopup()">×</button>
          <h2 style="color: ${popup.design.colors.text}">${popup.design.content.heading}</h2>
          ${popup.design.content.subheading ? `<h3 style="color: ${popup.design.colors.text}">${popup.design.content.subheading}</h3>` : ''}
          ${popup.design.content.body ? `<p style="color: ${popup.design.colors.text}">${popup.design.content.body}</p>` : ''}
          <button 
            class="popup-cta"
            style="background-color: ${popup.design.colors.primary}; color: ${popup.design.colors.secondary}"
            onclick="popupManager.handleAction('${popup.cta.action}')"
          >
            ${popup.cta.text}
          </button>
        </div>
      </div>
    `;
  }

  private async applyDiscount(code: string) {
    // Implement discount code application
  }

  private async addToCart(productId: string) {
    // Implement add to cart functionality
  }

  private async captureEmail() {
    // Implement email capture functionality
  }

  private trackView(popup: any) {
    // Implement view tracking
  }

  private trackConversion(popup: any) {
    // Implement conversion tracking
  }
}

// Initialize popup manager
const popupManager = new StorePopupManager();
popupManager.init();

// Make it available globally
(window as any).popupManager = popupManager; 