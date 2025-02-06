export interface PopupConfig {
  id: string;
  shopId: string;
  name: string;
  isEnabled: boolean;
  displayConditions: {
    triggerType: 'pageLoad' | 'exitIntent' | 'scroll';
    delay?: number;
    scrollPercentage?: number;
  };
  targetAudience: {
    visitorType: 'all' | 'new' | 'returning';
    cartValueThreshold?: number;
    targetPages?: string[];
    geoLocation?: string[];
  };
  design: {
    template: string;
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
    };
    content: {
      heading: string;
      subheading?: string;
      body?: string;
      mediaUrl?: string;
      mediaType?: 'image' | 'video';
    };
  };
  cta: {
    type: 'discount' | 'addToCart' | 'emailCapture' | 'link';
    text: string;
    action: string;
  };
  frequency: {
    type: 'once' | 'recurring';
    interval?: 'session' | 'day' | 'week';
  };
  createdAt: Date;
  updatedAt: Date;
} 