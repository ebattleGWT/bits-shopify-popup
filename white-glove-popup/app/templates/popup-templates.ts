interface PopupTemplate {
  name: string;
  type: string;
  title: string;
  content: string;
  style: {
    width: string;
    height: string;
    borderRadius: string;
    backgroundColor: {
      hue: number;
      brightness: number;
      saturation: number;
      alpha: number;
    };
    textColor: {
      hue: number;
      brightness: number;
      saturation: number;
      alpha: number;
    };
    buttonColor: {
      hue: number;
      brightness: number;
      saturation: number;
      alpha: number;
    };
    buttonTextColor: {
      hue: number;
      brightness: number;
      saturation: number;
      alpha: number;
    };
    fontSize: string;
    fontFamily: string;
  };
  settings: {
    position: string;
    animation: string;
    delay: number;
    frequency: string;
    exitIntentEnabled?: boolean;
    scrollTriggerEnabled?: boolean;
    scrollTriggerPercentage?: number;
  };
}

export const popupTemplates: Record<string, PopupTemplate> = {
  newsletterBasic: {
    name: "Basic Newsletter",
    type: "NEWSLETTER",
    title: "Subscribe to Our Newsletter",
    content: "Stay up to date with our latest news and exclusive offers. Subscribe now and get 10% off your first purchase!",
    style: {
      width: "400px",
      height: "auto",
      borderRadius: "8px",
      backgroundColor: { hue: 0, brightness: 1, saturation: 0, alpha: 1 }, // White
      textColor: { hue: 0, brightness: 0.2, saturation: 0, alpha: 1 }, // Dark gray
      buttonColor: { hue: 215, brightness: 0.5, saturation: 0.8, alpha: 1 }, // Blue
      buttonTextColor: { hue: 0, brightness: 1, saturation: 0, alpha: 1 }, // White
      fontSize: "16px",
      fontFamily: "system-ui",
    },
    settings: {
      position: "CENTER",
      animation: "FADE",
      delay: 3,
      frequency: "ONCE",
    },
  },

  exitIntentOffer: {
    name: "Exit Intent Special Offer",
    type: "EXIT_INTENT",
    title: "Wait! Don't Leave Empty-Handed",
    content: "Get 15% off your purchase today! Use code SAVE15 at checkout.",
    style: {
      width: "450px",
      height: "auto",
      borderRadius: "12px",
      backgroundColor: { hue: 0, brightness: 1, saturation: 0, alpha: 1 }, // White
      textColor: { hue: 0, brightness: 0.2, saturation: 0, alpha: 1 }, // Dark gray
      buttonColor: { hue: 145, brightness: 0.5, saturation: 0.8, alpha: 1 }, // Green
      buttonTextColor: { hue: 0, brightness: 1, saturation: 0, alpha: 1 }, // White
      fontSize: "18px",
      fontFamily: "system-ui",
    },
    settings: {
      position: "CENTER",
      animation: "SLIDE",
      delay: 0,
      frequency: "DAILY",
      exitIntentEnabled: true,
    },
  },

  announcementBanner: {
    name: "Announcement Banner",
    type: "ANNOUNCEMENT",
    title: "🎉 New Collection Launch!",
    content: "Discover our latest collection - Fresh styles just dropped!",
    style: {
      width: "100%",
      height: "auto",
      borderRadius: "0px",
      backgroundColor: { hue: 215, brightness: 0.5, saturation: 0.8, alpha: 1 }, // Blue
      textColor: { hue: 0, brightness: 1, saturation: 0, alpha: 1 }, // White
      buttonColor: { hue: 0, brightness: 1, saturation: 0, alpha: 0.2 }, // Transparent white
      buttonTextColor: { hue: 0, brightness: 1, saturation: 0, alpha: 1 }, // White
      fontSize: "14px",
      fontFamily: "system-ui",
    },
    settings: {
      position: "TOP",
      animation: "SLIDE",
      delay: 0,
      frequency: "ALWAYS",
    },
  },

  promotionPopup: {
    name: "Sale Promotion",
    type: "PROMOTION",
    title: "Summer Sale! 🌞",
    content: "Enjoy up to 50% off on selected items. Limited time offer!",
    style: {
      width: "400px",
      height: "auto",
      borderRadius: "16px",
      backgroundColor: { hue: 350, brightness: 0.95, saturation: 0.9, alpha: 1 }, // Light pink
      textColor: { hue: 0, brightness: 0.2, saturation: 0, alpha: 1 }, // Dark gray
      buttonColor: { hue: 350, brightness: 0.5, saturation: 0.8, alpha: 1 }, // Dark pink
      buttonTextColor: { hue: 0, brightness: 1, saturation: 0, alpha: 1 }, // White
      fontSize: "16px",
      fontFamily: "system-ui",
    },
    settings: {
      position: "CENTER",
      animation: "BOUNCE",
      delay: 2,
      frequency: "DAILY",
    },
  },

  scrollTriggerPromo: {
    name: "Mid-Page Offer",
    type: "PROMOTION",
    title: "You're Half Way There!",
    content: "Complete your purchase now and get free shipping on orders over $50",
    style: {
      width: "380px",
      height: "auto",
      borderRadius: "10px",
      backgroundColor: { hue: 45, brightness: 0.95, saturation: 0.9, alpha: 1 }, // Light gold
      textColor: { hue: 0, brightness: 0.2, saturation: 0, alpha: 1 }, // Dark gray
      buttonColor: { hue: 30, brightness: 0.5, saturation: 0.8, alpha: 1 }, // Orange
      buttonTextColor: { hue: 0, brightness: 1, saturation: 0, alpha: 1 }, // White
      fontSize: "16px",
      fontFamily: "system-ui",
    },
    settings: {
      position: "RIGHT",
      animation: "FADE",
      delay: 0,
      frequency: "ONCE",
      scrollTriggerEnabled: true,
      scrollTriggerPercentage: 50,
    },
  },
}; 