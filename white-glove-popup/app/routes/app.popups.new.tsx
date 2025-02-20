import { json, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigate, useNavigation, useSubmit } from "@remix-run/react";
import React, { useState, useEffect, useCallback } from "react";
import {
  Page,
  Layout,
  FormLayout,
  Card,
  TextField,
  Button,
  Select,
  DatePicker,
  Box,
  Text,
  Grid,
  Checkbox,
  InlineStack,
  BlockStack,
  Banner,
  ColorPicker,
  RangeSlider,
  Icon,
  Tabs,
  LegacyStack,
  Divider,
  Modal,
  type TextFieldProps,
  type ColorPickerProps,
  type RangeSliderProps,
  type TextProps,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { ImageIcon } from "@shopify/polaris-icons";
import { popupTemplates } from "../templates/popup-templates";
import type { Prisma } from "@prisma/client";

type ActionData = {
  errors?: {
    general?: string;
    name?: string;
    title?: string;
    content?: string;
    width?: string;
    height?: string;
    fontSize?: string;
    image?: string;
    delay?: string;
    cookieExpiration?: string;
    scrollTriggerPercentage?: string;
    deviceTypes?: string;
    showOnPages?: string;
    countries?: string;
  };
  success?: boolean;
};

interface HSBAColor {
  hue: number;
  saturation: number;
  brightness: number;
  alpha: number;
}

type PopupType = "STANDARD" | "NEWSLETTER" | "EXIT_INTENT" | "ANNOUNCEMENT" | "PROMOTION";

// Add validation functions
function validateDimension(value: string): string | undefined {
  if (!value) return undefined;
  if (!value.match(/^\d+(%|px|em|rem|vh|vw)$|^auto$/)) {
    return "Invalid format. Use values like '400px', '90%', or 'auto'";
  }
  return undefined;
}

function validateFontSize(value: string): string | undefined {
  if (!value) return undefined;
  if (!value.match(/^\d+(%|px|em|rem|pt)$/)) {
    return "Invalid format. Use values like '16px', '1.2em', or '12pt'";
  }
  return undefined;
}

function validateUrl(value: string): string | undefined {
  if (!value) return undefined;
  try {
    new URL(value);
    return undefined;
  } catch {
    return "Invalid URL format";
  }
}

function validateNumber(value: string | null, min: number, max: number): string | undefined {
  if (!value) return undefined;
  const num = parseInt(value, 10);
  if (isNaN(num)) return "Must be a number";
  if (num < min || num > max) return `Must be between ${min} and ${max}`;
  return undefined;
}

const tabs = [
  {
    id: 'basic-info',
    content: 'Basic Info',
    accessibilityLabel: 'Basic information',
    panelID: 'basic-info-panel',
  },
  {
    id: 'design',
    content: 'Design',
    accessibilityLabel: 'Design customization',
    panelID: 'design-panel',
  },
  {
    id: 'content',
    content: 'Content',
    accessibilityLabel: 'Content settings',
    panelID: 'content-panel',
  },
  {
    id: 'targeting',
    content: 'Targeting',
    accessibilityLabel: 'Targeting options',
    panelID: 'targeting-panel',
  },
  {
    id: 'advanced',
    content: 'Advanced',
    accessibilityLabel: 'Advanced settings',
    panelID: 'advanced-panel',
  },
];

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);

  const formData = await request.formData();
  
  // Helper function to safely get string values from FormData
  const getStringValue = (key: string): string | null => {
    const value = formData.get(key);
    if (value instanceof File) return null;
    return value?.toString() || null;
  };

  // Get form values
  const name = getStringValue('name');
  const title = getStringValue('title');
  const content = getStringValue('content');
  const popupType = getStringValue('popupType');
  const template = getStringValue('template');
  
  // Design customization
  const width = getStringValue('width') || "400px";
  const height = getStringValue('height') || "auto";
  const borderRadius = getStringValue('borderRadius') || "8px";
  const backgroundColor = getStringValue('backgroundColor');
  const textColor = getStringValue('textColor');
  const buttonColor = getStringValue('buttonColor');
  const buttonTextColor = getStringValue('buttonTextColor');
  const fontSize = getStringValue('fontSize') || "16px";
  const fontFamily = getStringValue('fontFamily') || "system-ui";
  const overlayColor = getStringValue('overlayColor');
  const overlayOpacity = getStringValue('overlayOpacity') ? parseFloat(getStringValue('overlayOpacity') as string) : 0.5;
  
  // Content customization
  const image = getStringValue('image') || "";
  const buttonText = getStringValue('buttonText') || "Close";
  const secondaryButtonText = getStringValue('secondaryButtonText') || "";
  
  // Form settings for newsletter
  const collectEmail = popupType === "NEWSLETTER";
  const emailPlaceholder = getStringValue('emailPlaceholder') || "Enter your email";
  const submitEndpoint = getStringValue('submitEndpoint');
  const successMessage = getStringValue('successMessage') || "Thank you for subscribing!";
  const errorMessage = getStringValue('errorMessage') || "Something went wrong. Please try again.";
  
  // Discount settings
  const discountType = getStringValue('discountType');
  const discountValue = getStringValue('discountValue');
  const discountDuration = getStringValue('discountDuration');
  
  // Display settings
  const position = getStringValue('position') || "CENTER";
  const theme = getStringValue('theme') || "LIGHT";
  const customCss = getStringValue('customCss');
  const animation = getStringValue('animation') || "FADE";
  const delay = getStringValue('delay');
  const frequency = getStringValue('frequency') || "ALWAYS";
  const startDate = getStringValue('startDate');
  const endDate = getStringValue('endDate');
  
  // Targeting options
  const deviceTypes = getStringValue('deviceTypes') ? JSON.parse(getStringValue('deviceTypes') as string) : [];
  const showOnPages = getStringValue('showOnPages') ? JSON.parse(getStringValue('showOnPages') as string) : [];
  const countries = getStringValue('countries') ? JSON.parse(getStringValue('countries') as string) : [];
  
  // Advanced settings
  const exitIntentEnabled = getStringValue('exitIntentEnabled') === "true";
  const scrollTriggerEnabled = getStringValue('scrollTriggerEnabled') === "true";
  const scrollTriggerPercentage = getStringValue('scrollTriggerPercentage') ? 
    parseInt(getStringValue('scrollTriggerPercentage') as string, 10) : 50;
  const cookieExpiration = getStringValue('cookieExpiration') ? 
    parseInt(getStringValue('cookieExpiration') as string, 10) : null;

  // Create discount code if needed
  let discountCode = null;
  if (popupType === "PROMOTION" && discountType && discountValue) {
    try {
      const response = await admin.graphql(`
        mutation discountCodeBasicCreate($input: DiscountCodeBasicInput!) {
          discountCodeBasicCreate(basicCodeDiscount: $input) {
            codeDiscountNode {
              id
              codeDiscount {
                ... on DiscountCodeBasic {
                  codes(first: 1) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `, {
        variables: {
          input: {
            title: `${name} - Popup Discount`,
            code: `POPUP${Math.random().toString(36).substring(7).toUpperCase()}`,
            startsAt: startDate ? new Date(startDate.toString()).toISOString() : new Date().toISOString(),
            endsAt: endDate ? new Date(endDate.toString()).toISOString() : null,
            customerSelection: {
              all: true
            },
            customerGets: {
              value: {
                percentage: discountType === 'percentage' ? parseFloat(discountValue as string) : null,
                amount: discountType === 'fixed' ? parseFloat(discountValue as string) : null,
              },
              items: {
                all: true
              }
            },
            appliesOncePerCustomer: true
          }
        }
      });

      const responseJson = await response.json();
      if (responseJson.data?.discountCodeBasicCreate?.codeDiscountNode) {
        discountCode = responseJson.data.discountCodeBasicCreate.codeDiscountNode.codeDiscount.codes.edges[0].node.code;
      }
    } catch (error) {
      console.error("Failed to create discount code:", error);
      return json({
        errors: {
          general: "Failed to create discount code. Please try again.",
        },
      });
    }
  }

  // Validate all fields
  const errors: Record<string, string> = {};
  
  // Required fields
  if (!name) errors.name = "Name is required";
  if (!title) errors.title = "Title is required";
  if (!content) errors.content = "Content is required";
  
  // Dimension validations
  const widthError = validateDimension(width as string);
  if (widthError) errors.width = widthError;
  
  const heightError = validateDimension(height as string);
  if (heightError) errors.height = heightError;
  
  // Font size validation
  const fontSizeError = validateFontSize(fontSize as string);
  if (fontSizeError) errors.fontSize = fontSizeError;
  
  // Image URL validation
  if (image) {
    const imageError = validateUrl(image as string);
    if (imageError) errors.image = imageError;
  }
  
  // Number validations
  if (delay) {
    const delayError = validateNumber(delay as string, 0, 60);
    if (delayError) errors.delay = delayError;
  }
  
  if (cookieExpiration) {
    const cookieError = validateNumber(cookieExpiration.toString(), 1, 365);
    if (cookieError) errors.cookieExpiration = cookieError;
  }
  
  if (scrollTriggerEnabled) {
    const scrollError = validateNumber(scrollTriggerPercentage.toString(), 0, 100);
    if (scrollError) errors.scrollTriggerPercentage = scrollError;
  }
  
  // Targeting validations
  if (deviceTypes.length === 0) {
    errors.deviceTypes = "Select at least one device type";
  }
  
  // URL format validation for pages
  if (showOnPages.length > 0) {
    const invalidUrls = showOnPages.some(page => validateUrl(page as string));
    if (invalidUrls) errors.showOnPages = "Invalid URL format in page list";
  }
  
  // Country code validation
  if (countries.length > 0) {
    const invalidCodes = countries.some(code => !code.toString().match(/^[A-Z]{2}$/));
    if (invalidCodes) errors.countries = "Invalid country code format (use ISO 2-letter codes)";
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors });
  }

  try {
    const createData: Prisma.PopupCreateInput = {
      // Basic Information
      name: name as string,
      title: title as string,
      content: content as string,
      popupType: popupType as string,
      template: (template as string) || null,
      
      // Design customization
      width: width as string,
      height: height as string,
      borderRadius: borderRadius as string,
      backgroundColor: JSON.stringify(backgroundColor),
      textColor: JSON.stringify(textColor),
      buttonColor: JSON.stringify(buttonColor),
      buttonTextColor: JSON.stringify(buttonTextColor),
      fontSize: fontSize as string,
      fontFamily: fontFamily as string,
      overlayColor: JSON.stringify(overlayColor),
      overlayOpacity,
      
      // Content customization
      image: (image as string) || null,
      buttonText: buttonText as string,
      secondaryButtonText: (secondaryButtonText as string) || null,
      
      // Form settings
      collectEmail,
      emailPlaceholder,
      submitEndpoint: submitEndpoint as string || null,
      successMessage: successMessage as string,
      errorMessage: errorMessage as string,
      
      // Discount settings
      discountCode,
      discountType: discountType as string || null,
      discountValue: discountValue ? parseFloat(discountValue as string) : null,
      discountDuration: discountDuration ? parseInt(discountDuration as string, 10) : null,
      
      // Display settings
      position: position as string,
      theme: theme as string,
      customCss: customCss as string || null,
      animation: animation as string,
      delay: delay ? parseInt(delay.toString(), 10) : 0,
      frequency: frequency as string,
      startDate: startDate ? new Date(startDate.toString()) : null,
      endDate: endDate ? new Date(endDate.toString()) : null,
      
      // Targeting options
      deviceTypes: deviceTypes.length ? JSON.stringify(deviceTypes) : null,
      showOnPages: showOnPages.length ? JSON.stringify(showOnPages) : null,
      countries: countries.length ? JSON.stringify(countries) : null,
      
      // Advanced settings
      exitIntentEnabled,
      scrollTriggerEnabled,
      scrollTriggerPercentage,
      cookieExpiration,
      
      // Shop and status
      shop: session.shop,
      isEnabled: true,
    };

    const popup = await prisma.popup.create({
      data: createData,
    });

    return redirect("/app/popups");
  } catch (error) {
    console.error("Failed to create popup:", error);
    return json({
      errors: {
        general: "An unexpected error occurred. Please try again.",
      },
    });
  }
}

export default function NewPopup() {
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";

  const [position, setPosition] = useState("CENTER");
  const [theme, setTheme] = useState("LIGHT");
  const [frequency, setFrequency] = useState("ALWAYS");
  const [animation, setAnimation] = useState("FADE");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [{ month, year }, setDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [popupType, setPopupType] = useState("STANDARD");
  const [template, setTemplate] = useState("");
  
  // Design customization state
  const [width, setWidth] = useState("400px");
  const [height, setHeight] = useState("auto");
  const [borderRadius, setBorderRadius] = useState("8px");
  const [backgroundColor, setBackgroundColor] = useState({
    hue: 0,
    brightness: 1,
    saturation: 0,
    alpha: 1
  });
  const [textColor, setTextColor] = useState({
    hue: 0,
    brightness: 0.2,
    saturation: 0,
    alpha: 1
  });
  const [buttonColor, setButtonColor] = useState({
    hue: 230,
    brightness: 0.77,
    saturation: 0.54,
    alpha: 1
  });
  const [buttonTextColor, setButtonTextColor] = useState({
    hue: 0,
    brightness: 1,
    saturation: 0,
    alpha: 1
  });
  const [fontSize, setFontSize] = useState("16px");
  const [fontFamily, setFontFamily] = useState("system-ui");
  const [overlayColor, setOverlayColor] = useState({
    hue: 0,
    brightness: 0,
    saturation: 0,
    alpha: 0.5
  });
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  
  // Content customization state
  const [image, setImage] = useState("");
  const [buttonText, setButtonText] = useState("Close");
  const [secondaryButtonText, setSecondaryButtonText] = useState("");
  
  // Advanced settings state
  const [exitIntentEnabled, setExitIntentEnabled] = useState(false);
  const [scrollTriggerEnabled, setScrollTriggerEnabled] = useState(false);
  const [scrollTriggerPercentage, setScrollTriggerPercentage] = useState(50);
  const [cookieExpiration, setCookieExpiration] = useState<number | null>(7);
  
  // Form settings state
  const [formFields, setFormFields] = useState([]);
  const [submitEndpoint, setSubmitEndpoint] = useState("");
  const [successMessage, setSuccessMessage] = useState("Thank you for subscribing!");
  const [errorMessage, setErrorMessage] = useState("Something went wrong. Please try again.");
  const [emailPlaceholder, setEmailPlaceholder] = useState("Enter your email");

  // Discount settings state
  const [discountType, setDiscountType] = useState<"percentage" | "fixed" | "">("");
  const [discountValue, setDiscountValue] = useState("");
  const [discountDuration, setDiscountDuration] = useState("");

  const [selectedTab, setSelectedTab] = useState(0);
  const [delay, setDelay] = useState<number | null>(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Convert HSBA color to CSS rgba
  const hsbaToRgba = (color: HSBAColor) => {
    const { hue, saturation, brightness, alpha } = color;
    const h = hue / 360;
    const s = saturation;
    const v = brightness;
    
    let r, g, b;
    
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
      default: r = v; g = t; b = p;
    }
    
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
  };

  // Preview modal content
  const previewModalContent = (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        backgroundColor: '#f6f6f7',
        overflow: 'hidden',
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: hsbaToRgba(overlayColor),
          opacity: overlayOpacity,
        }}
      />
      
      {/* Popup */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: width,
          height: height === 'auto' ? 'auto' : height,
          backgroundColor: hsbaToRgba(backgroundColor),
          borderRadius: borderRadius,
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          animation: `${animation.toLowerCase()} 0.3s ease-in-out`,
        }}
      >
        {/* Close button */}
        <button
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            color: hsbaToRgba(textColor),
          }}
          onClick={() => setShowPreviewModal(false)}
        >
          ×
        </button>
        
        {/* Content */}
        <div
          style={{
            color: hsbaToRgba(textColor),
            fontFamily: fontFamily,
            fontSize: fontSize,
          }}
        >
          {image && (
            <img
              src={image}
              alt="Popup image"
              style={{
                maxWidth: '100%',
                height: 'auto',
                marginBottom: '15px',
              }}
            />
          )}
          
          <h2 style={{ marginBottom: '10px' }}>{title}</h2>
          <div style={{ marginBottom: '20px' }}>{content}</div>
          
          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            {secondaryButtonText && (
              <button
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${hsbaToRgba(buttonColor)}`,
                  borderRadius: '4px',
                  background: 'transparent',
                  color: hsbaToRgba(buttonColor),
                  cursor: 'pointer',
                }}
              >
                {secondaryButtonText}
              </button>
            )}
            <button
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: hsbaToRgba(buttonColor),
                color: hsbaToRgba(buttonTextColor),
                cursor: 'pointer',
              }}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTextField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    helpText: string,
    multiline?: number
  ) => (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      helpText={helpText}
      autoComplete="off"
      multiline={multiline}
    />
  );

  const renderColorPicker = (
    label: string,
    color: HSBAColor,
    onChange: (color: HSBAColor) => void
  ) => (
    <BlockStack>
      <Text as="span" variant="bodyMd">{label}</Text>
      <ColorPicker
        onChange={onChange}
        color={color}
      />
    </BlockStack>
  );

  const handleRangeSliderChange = (value: number | [number, number], id?: string) => {
    if (typeof value === 'number') {
      const newValue = Math.min(Math.max(value, 0), 1);
      setOverlayOpacity(newValue);
      setOverlayColor(prev => ({
        ...prev,
        alpha: newValue
      }));
    }
  };

  const handleScrollTriggerChange = (value: number | [number, number], id?: string) => {
    if (typeof value === 'number') {
      const newValue = Math.min(Math.max(value, 0), 100);
      setScrollTriggerPercentage(newValue);
    }
  };

  const defaultColor: HSBAColor = {
    hue: 0,
    saturation: 0,
    brightness: 1,
    alpha: 1
  };

  const handleTemplateChange = (templateId: string) => {
    if (!templateId) return;

    const template = popupTemplates[templateId];
    if (!template) return;

    // Update all state values based on the template
    setPopupType(template.type);
    setName(template.name);
    setTitle(template.title);
    setContent(template.content);
    
    // Update style settings
    setWidth(template.style.width);
    setHeight(template.style.height);
    setBorderRadius(template.style.borderRadius);
    setBackgroundColor(template.style.backgroundColor);
    setTextColor(template.style.textColor);
    setButtonColor(template.style.buttonColor);
    setButtonTextColor(template.style.buttonTextColor);
    setFontSize(template.style.fontSize);
    setFontFamily(template.style.fontFamily);
    
    // Update display settings
    setPosition(template.settings.position);
    setAnimation(template.settings.animation);
    setDelay(template.settings.delay);
    setFrequency(template.settings.frequency);
    
    // Update advanced settings if they exist
    if (template.settings.exitIntentEnabled !== undefined) {
      setExitIntentEnabled(template.settings.exitIntentEnabled);
    }
    if (template.settings.scrollTriggerEnabled !== undefined) {
      setScrollTriggerEnabled(template.settings.scrollTriggerEnabled);
    }
    if (template.settings.scrollTriggerPercentage !== undefined) {
      setScrollTriggerPercentage(template.settings.scrollTriggerPercentage);
    }
  };

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    // Add color values
    formData.set('backgroundColor', JSON.stringify(backgroundColor));
    formData.set('textColor', JSON.stringify(textColor));
    formData.set('buttonColor', JSON.stringify(buttonColor));
    formData.set('buttonTextColor', JSON.stringify(buttonTextColor));
    formData.set('overlayColor', JSON.stringify(overlayColor));
    formData.set('overlayOpacity', overlayOpacity.toString());
    
    // Add device types (even if empty)
    if (selectedDevices.length === 0) {
      formData.append('deviceTypes', 'DESKTOP'); // Default to desktop if none selected
    } else {
      selectedDevices.forEach(device => {
        formData.append('deviceTypes', device);
      });
    }
    
    // Add dates if set
    if (startDate) {
      formData.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      formData.set('endDate', endDate.toISOString());
    }
    
    // Add other form fields
    formData.set('name', name);
    formData.set('title', title);
    formData.set('content', content);
    formData.set('popupType', popupType);
    formData.set('template', template);
    formData.set('width', width);
    formData.set('height', height);
    formData.set('borderRadius', borderRadius);
    formData.set('fontSize', fontSize);
    formData.set('fontFamily', fontFamily);
    formData.set('buttonText', buttonText);
    formData.set('secondaryButtonText', secondaryButtonText);
    formData.set('position', position);
    formData.set('theme', theme);
    formData.set('animation', animation);
    formData.set('frequency', frequency);
    formData.set('delay', delay?.toString() || '0');
    formData.set('exitIntentEnabled', exitIntentEnabled.toString());
    formData.set('scrollTriggerEnabled', scrollTriggerEnabled.toString());
    formData.set('scrollTriggerPercentage', scrollTriggerPercentage.toString());
    if (cookieExpiration !== null) {
      formData.set('cookieExpiration', cookieExpiration.toString());
    }

    // Add newsletter and form settings
    formData.set('collectEmail', (popupType === 'NEWSLETTER').toString());
    formData.set('emailPlaceholder', emailPlaceholder);
    formData.set('submitEndpoint', submitEndpoint);
    formData.set('successMessage', successMessage);
    formData.set('errorMessage', errorMessage);

    submit(formData, { method: 'post' });
  }, [
    backgroundColor, textColor, buttonColor, buttonTextColor, overlayColor,
    overlayOpacity, selectedDevices, startDate, endDate, popupType, template,
    width, height, borderRadius, fontSize, fontFamily, buttonText,
    secondaryButtonText, position, theme, animation, frequency, delay,
    exitIntentEnabled, scrollTriggerEnabled, scrollTriggerPercentage,
    cookieExpiration, submit, emailPlaceholder, submitEndpoint,
    successMessage, errorMessage, name, title, content
  ]);

  return (
    <Page
      title="Create New Popup"
      backAction={{
        content: "Popups",
        onAction: () => navigate("/app/popups"),
      }}
      primaryAction={{
        content: isSubmitting ? "Creating..." : "Create Popup",
        onAction: () => {
          const form = document.querySelector('form');
          if (form) form.requestSubmit();
        },
        disabled: isSubmitting
      }}
      secondaryActions={[
        {
          content: "Preview",
          onAction: () => setShowPreviewModal(true),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          {actionData?.errors?.general && (
            <Banner tone="critical">
              <p>{actionData.errors.general}</p>
            </Banner>
          )}

          <Form method="post" onSubmit={handleSubmit}>
            <Card>
              <BlockStack gap="400">
                <Box padding="400">
                  <Select
                    label="Start from Template"
                    options={[
                      { label: "Choose a template...", value: "" },
                      ...Object.entries(popupTemplates).map(([id, template]) => ({
                        label: template.name,
                        value: id,
                      })),
                    ]}
                    onChange={handleTemplateChange}
                    helpText="Select a template to start with, or create from scratch"
                  />
                </Box>
              </BlockStack>
            </Card>

            <Tabs
              tabs={tabs}
              selected={selectedTab}
              onSelect={setSelectedTab}
              fitted
            >
              <Card>
                <BlockStack gap="400">
                  {selectedTab === 0 && (
                    <Box padding="400">
                      <BlockStack gap="400">
                        <Text variant="headingMd" as="h3">Basic Information</Text>
                        <FormLayout>
                          <Select
                            label="Popup Type"
                            options={[
                              { label: "Standard Popup", value: "STANDARD" },
                              { label: "Newsletter", value: "NEWSLETTER" },
                              { label: "Exit Intent", value: "EXIT_INTENT" },
                              { label: "Announcement", value: "ANNOUNCEMENT" },
                              { label: "Promotion", value: "PROMOTION" },
                            ]}
                            value={popupType}
                            onChange={(value) => setPopupType(value)}
                            helpText="Choose the type of popup you want to create"
                          />
                          <TextField
                            label="Name"
                            name="name"
                            value={name}
                            onChange={setName}
                            error={actionData?.errors?.name}
                            autoComplete="off"
                            helpText="Internal name for the popup"
                          />
                          <TextField
                            label="Title"
                            name="title"
                            value={title}
                            onChange={setTitle}
                            error={actionData?.errors?.title}
                            autoComplete="off"
                            helpText="Title displayed to customers"
                          />
                          <TextField
                            label="Content"
                            name="content"
                            value={content}
                            onChange={setContent}
                            error={actionData?.errors?.content}
                            autoComplete="off"
                            multiline={4}
                            helpText="Main content of the popup"
                          />
                        </FormLayout>
                      </BlockStack>
                    </Box>
                  )}

                  {selectedTab === 1 && (
                    <Box padding="400">
                      <BlockStack gap="400">
                        <Text variant="headingMd" as="h3">Design Customization</Text>
                        <FormLayout>
                          <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
                              {renderTextField("Width", width, setWidth, "e.g., 400px or 90%")}
                            </Grid.Cell>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
                              {renderTextField("Height", height, setHeight, "e.g., 300px or auto")}
                            </Grid.Cell>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
                              {renderTextField("Border Radius", borderRadius, setBorderRadius, "e.g., 8px")}
                            </Grid.Cell>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
                              {renderTextField("Font Size", fontSize, setFontSize, "e.g., 16px")}
                            </Grid.Cell>
                          </Grid>

                          <Divider />

                          <Text variant="headingMd" as="h3">Colors</Text>
                          <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
                              <BlockStack gap="200">
                                <Text as="span" variant="bodyMd">Background Color</Text>
                                <ColorPicker onChange={setBackgroundColor} color={backgroundColor} />
                              </BlockStack>
                            </Grid.Cell>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
                              <BlockStack gap="200">
                                <Text as="span" variant="bodyMd">Text Color</Text>
                                <ColorPicker onChange={setTextColor} color={textColor} />
                              </BlockStack>
                            </Grid.Cell>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
                              <BlockStack gap="200">
                                <Text as="span" variant="bodyMd">Button Color</Text>
                                <ColorPicker onChange={setButtonColor} color={buttonColor} />
                              </BlockStack>
                            </Grid.Cell>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}>
                              <BlockStack gap="200">
                                <Text as="span" variant="bodyMd">Button Text Color</Text>
                                <ColorPicker onChange={setButtonTextColor} color={buttonTextColor} />
                              </BlockStack>
                            </Grid.Cell>
                          </Grid>

                          <Divider />

                          <Text variant="headingMd" as="h3">Overlay</Text>
                          <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                              <BlockStack gap="200">
                                <Text as="span" variant="bodyMd">Overlay Color</Text>
                                <ColorPicker onChange={setOverlayColor} color={overlayColor} />
                              </BlockStack>
                            </Grid.Cell>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                              <RangeSlider
                                label="Overlay Opacity"
                                value={overlayOpacity}
                                onChange={handleRangeSliderChange}
                                output
                                min={0}
                                max={1}
                                step={0.1}
                              />
                            </Grid.Cell>
                          </Grid>
                        </FormLayout>
                      </BlockStack>
                    </Box>
                  )}

                  {selectedTab === 2 && (
                    <Box padding="400">
                      <BlockStack gap="400">
                        <Text variant="headingMd" as="h3">Content Settings</Text>
                        <FormLayout>
                          <TextField
                            label="Image URL"
                            value={image}
                            onChange={setImage}
                            prefix={<Icon source={ImageIcon} />}
                            helpText="Enter the URL of your image"
                            autoComplete="off"
                          />
                          {popupType === "NEWSLETTER" && (
                            <>
                              <TextField
                                label="Email Placeholder"
                                name="emailPlaceholder"
                                value={emailPlaceholder}
                                onChange={setEmailPlaceholder}
                                helpText="Placeholder text for the email input field"
                                autoComplete="off"
                              />
                              <TextField
                                label="Submit Endpoint"
                                name="submitEndpoint"
                                value={submitEndpoint}
                                onChange={setSubmitEndpoint}
                                helpText="Optional custom endpoint for form submission"
                                autoComplete="off"
                              />
                            </>
                          )}
                          {popupType === "PROMOTION" && (
                            <>
                              <Select
                                label="Discount Type"
                                name="discountType"
                                options={[
                                  { label: "Percentage Off", value: "percentage" },
                                  { label: "Fixed Amount Off", value: "fixed" },
                                ]}
                                value={discountType}
                                onChange={(value) => setDiscountType(value as "" | "fixed" | "percentage")}
                                helpText="Choose the type of discount to offer"
                              />
                              <TextField
                                label={discountType === "percentage" ? "Percentage Off" : "Amount Off"}
                                name="discountValue"
                                type="number"
                                value={discountValue}
                                onChange={setDiscountValue}
                                helpText={discountType === "percentage" ? "Enter percentage (e.g., 15 for 15% off)" : "Enter amount (e.g., 10 for $10 off)"}
                                autoComplete="off"
                              />
                              <TextField
                                label="Duration (days)"
                                name="discountDuration"
                                type="number"
                                value={discountDuration}
                                onChange={setDiscountDuration}
                                helpText="How long the discount code will be valid"
                                autoComplete="off"
                              />
                            </>
                          )}
                          <TextField
                            label="Button Text"
                            value={buttonText}
                            onChange={setButtonText}
                            helpText="Text for the primary button"
                            autoComplete="off"
                          />
                          <TextField
                            label="Secondary Button Text"
                            value={secondaryButtonText}
                            onChange={setSecondaryButtonText}
                            helpText="Text for the secondary button (optional)"
                            autoComplete="off"
                          />
                          {(popupType === "NEWSLETTER" || popupType === "PROMOTION") && (
                            <>
                              <TextField
                                label="Success Message"
                                value={successMessage}
                                onChange={setSuccessMessage}
                                multiline={2}
                                helpText="Message shown after successful form submission"
                                autoComplete="off"
                              />
                              <TextField
                                label="Error Message"
                                value={errorMessage}
                                onChange={setErrorMessage}
                                multiline={2}
                                helpText="Message shown if form submission fails"
                                autoComplete="off"
                              />
                            </>
                          )}
                        </FormLayout>
                      </BlockStack>
                    </Box>
                  )}

                  {selectedTab === 3 && (
                    <Box padding="400">
                      <BlockStack gap="400">
                        <Text variant="headingMd" as="h3">Targeting Options</Text>
                        <FormLayout>
                          <Box padding="400">
                            <Text variant="headingMd" as="h3">Device Types</Text>
                            <InlineStack gap="300">
                              {["MOBILE", "DESKTOP", "TABLET"].map((device) => (
                                <Checkbox
                                  key={device}
                                  label={device.charAt(0) + device.slice(1).toLowerCase()}
                                  checked={selectedDevices.includes(device)}
                                  onChange={(checked) => {
                                    const newDevices = checked
                                      ? [...selectedDevices, device]
                                      : selectedDevices.filter((d) => d !== device);
                                    setSelectedDevices(newDevices);
                                  }}
                                />
                              ))}
                            </InlineStack>
                          </Box>

                          <TextField
                            label="Show on Pages"
                            value={selectedPages.join('\n')}
                            onChange={(value) => {
                              const pages = value.split('\n').filter(Boolean);
                              setSelectedPages(pages);
                            }}
                            multiline={3}
                            helpText="Enter page URLs (one per line)"
                            autoComplete="off"
                          />

                          <TextField
                            label="Countries"
                            value={selectedCountries.join('\n')}
                            onChange={(value) => {
                              const countries = value.split('\n').filter(Boolean);
                              setSelectedCountries(countries);
                            }}
                            multiline={3}
                            helpText="Enter country codes (one per line, e.g., US, CA)"
                            autoComplete="off"
                          />
                        </FormLayout>
                      </BlockStack>
                    </Box>
                  )}

                  {selectedTab === 4 && (
                    <Box padding="400">
                      <BlockStack gap="400">
                        <Text variant="headingMd" as="h3">Advanced Settings</Text>
                        <FormLayout>
                          <Checkbox
                            label="Enable Exit Intent"
                            checked={exitIntentEnabled}
                            onChange={setExitIntentEnabled}
                            helpText="Show popup when visitor attempts to leave the page"
                          />
                          <Checkbox
                            label="Enable Scroll Trigger"
                            checked={scrollTriggerEnabled}
                            onChange={setScrollTriggerEnabled}
                            helpText="Show popup when visitor scrolls to a certain point"
                          />
                          {scrollTriggerEnabled && (
                            <RangeSlider
                              label="Scroll Percentage"
                              value={scrollTriggerPercentage}
                              onChange={handleScrollTriggerChange}
                              min={0}
                              max={100}
                              helpText="Show popup when visitor scrolls this percentage of the page"
                            />
                          )}
                          <TextField
                            label="Cookie Expiration (days)"
                            type="number"
                            value={cookieExpiration?.toString() || ""}
                            onChange={(value) => setCookieExpiration(value ? parseInt(value, 10) : null)}
                            helpText="Number of days before showing the popup again to the same visitor"
                            autoComplete="off"
                          />
                          <Select
                            label="Animation"
                            options={[
                              { label: "Fade", value: "FADE" },
                              { label: "Slide", value: "SLIDE" },
                              { label: "Bounce", value: "BOUNCE" },
                            ]}
                            value={animation}
                            onChange={setAnimation}
                          />
                          <TextField
                            label="Delay (seconds)"
                            type="number"
                            min="0"
                            value={delay?.toString() || ""}
                            onChange={(value) => setDelay(value ? parseInt(value, 10) : null)}
                            helpText="Time to wait before showing the popup"
                            autoComplete="off"
                          />
                        </FormLayout>
                      </BlockStack>
                    </Box>
                  )}
                </BlockStack>
              </Card>
            </Tabs>

            <Box padding="400">
              <Button variant="primary" submit disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Popup"}
              </Button>
            </Box>
          </Form>
        </Layout.Section>
      </Layout>

      {/* Preview Modal */}
      <Modal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Popup Preview"
      >
        <Modal.Section>
          {previewModalContent}
        </Modal.Section>
      </Modal>
    </Page>
  );
} 