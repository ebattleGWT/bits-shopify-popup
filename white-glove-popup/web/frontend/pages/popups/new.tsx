import { Page, Layout, Form, FormLayout, TextField, Select, Card, ColorPicker, Stack, Button, Toast } from "@shopify/polaris";
import { useState, useCallback } from "react";
import { useNavigate } from "@shopify/app-bridge-react";
import { PopupConfig } from "../types/popup";
import { createPopup } from "../services/popupService";
import { PopupPreview } from "../components/PopupPreview";

interface FormErrors {
  name?: string;
  heading?: string;
  ctaText?: string;
  ctaAction?: string;
  delay?: string;
  scrollPercentage?: string;
}

export default function NewPopupPage() {
  const navigate = useNavigate();
  
  // Basic Settings
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<PopupConfig['displayConditions']['triggerType']>("pageLoad");
  const [visitorType, setVisitorType] = useState<PopupConfig['targetAudience']['visitorType']>("all");
  const [template, setTemplate] = useState("default");
  
  // Display Conditions
  const [delay, setDelay] = useState<number>(0);
  const [scrollPercentage, setScrollPercentage] = useState<number>(50);
  
  // Design Settings
  const [colors, setColors] = useState({
    primary: "#000000",
    secondary: "#ffffff",
    background: "#ffffff",
    text: "#000000"
  });
  
  // Content
  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [body, setBody] = useState("");
  
  // CTA Settings
  const [ctaType, setCtaType] = useState<PopupConfig['cta']['type']>("discount");
  const [ctaText, setCtaText] = useState("");
  const [ctaAction, setCtaAction] = useState("");
  
  // Frequency Settings
  const [frequencyType, setFrequencyType] = useState<PopupConfig['frequency']['type']>("once");
  const [frequencyInterval, setFrequencyInterval] = useState<string>("session");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastProps, setToastProps] = useState({ active: false, content: '', error: false });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    
    // Required fields validation
    if (!name.trim()) {
      newErrors.name = 'Popup name is required';
    }
    
    if (!heading.trim()) {
      newErrors.heading = 'Heading is required';
    }
    
    if (!ctaText.trim()) {
      newErrors.ctaText = 'Button text is required';
    }
    
    // CTA action validation based on type
    if (!ctaAction.trim()) {
      newErrors.ctaAction = 'Action is required';
    } else {
      switch (ctaType) {
        case 'discount':
          if (!/^[A-Z0-9_-]{3,}$/.test(ctaAction)) {
            newErrors.ctaAction = 'Invalid discount code format';
          }
          break;
        case 'link':
          try {
            new URL(ctaAction);
          } catch {
            newErrors.ctaAction = 'Invalid URL format';
          }
          break;
        case 'addToCart':
          if (!/^\d+$/.test(ctaAction)) {
            newErrors.ctaAction = 'Product ID must be a number';
          }
          break;
      }
    }
    
    // Numeric field validation
    if (triggerType === 'pageLoad') {
      if (delay < 0) {
        newErrors.delay = 'Delay must be a positive number';
      }
    }
    
    if (triggerType === 'scroll') {
      if (scrollPercentage < 0 || scrollPercentage > 100) {
        newErrors.scrollPercentage = 'Scroll percentage must be between 0 and 100';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, heading, ctaText, ctaAction, ctaType, triggerType, delay, scrollPercentage]);

  const handleFieldChange = useCallback((field: string, value: string) => {
    setIsDirty(true);
    switch (field) {
      case 'name':
        setName(value);
        break;
      case 'heading':
        setHeading(value);
        break;
      case 'ctaText':
        setCtaText(value);
        break;
      case 'ctaAction':
        setCtaAction(value);
        break;
      // Add other fields as needed
    }
  }, []);

  const handleSubmit = async () => {
    setIsDirty(true);
    
    if (!validateForm()) {
      setToastProps({
        active: true,
        content: 'Please fix the errors before submitting',
        error: true,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newPopup = {
        name,
        isEnabled: false,
        displayConditions: {
          triggerType,
          ...(triggerType === 'pageLoad' && { delay }),
          ...(triggerType === 'scroll' && { scrollPercentage }),
        },
        targetAudience: {
          visitorType,
          targetPages: [],
        },
        design: {
          template,
          colors,
          content: {
            heading,
            subheading,
            body,
          },
        },
        cta: {
          type: ctaType,
          text: ctaText,
          action: ctaAction,
        },
        frequency: {
          type: frequencyType,
          interval: frequencyInterval as PopupConfig['frequency']['interval'],
        },
      };

      await createPopup(newPopup);
      setToastProps({
        active: true,
        content: 'Popup created successfully!',
        error: false,
      });
      navigate("/");
    } catch (error) {
      setToastProps({
        active: true,
        content: error.message || 'Failed to create popup',
        error: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Page
        title="Create New Popup"
        breadcrumbs={[{ content: "Popups", url: "/" }]}
      >
        <Layout>
          <Layout.Section oneHalf>
            <Card sectioned title="Basic Settings">
              <FormLayout>
                <TextField
                  label="Popup Name"
                  value={name}
                  onChange={(value) => handleFieldChange('name', value)}
                  autoComplete="off"
                  required
                  error={isDirty ? errors.name : undefined}
                />
                
                <Select
                  label="Trigger Type"
                  options={[
                    { label: "On Page Load", value: "pageLoad" },
                    { label: "Exit Intent", value: "exitIntent" },
                    { label: "Scroll Position", value: "scroll" },
                  ]}
                  value={triggerType}
                  onChange={setTriggerType}
                />

                {triggerType === 'pageLoad' && (
                  <TextField
                    label="Delay (seconds)"
                    type="number"
                    value={String(delay)}
                    onChange={(value) => setDelay(Number(value))}
                  />
                )}

                {triggerType === 'scroll' && (
                  <TextField
                    label="Scroll Percentage"
                    type="number"
                    value={String(scrollPercentage)}
                    onChange={(value) => setScrollPercentage(Number(value))}
                    helpText="Popup will appear when user scrolls to this percentage of the page"
                  />
                )}
              </FormLayout>
            </Card>

            <Card sectioned title="Design">
              <FormLayout>
                <Select
                  label="Template"
                  options={[
                    { label: "Default", value: "default" },
                    { label: "Newsletter", value: "newsletter" },
                    { label: "Discount", value: "discount" },
                  ]}
                  value={template}
                  onChange={setTemplate}
                />

                <TextField
                  label="Heading"
                  value={heading}
                  onChange={(value) => handleFieldChange('heading', value)}
                  autoComplete="off"
                  required
                  error={isDirty ? errors.heading : undefined}
                />

                <TextField
                  label="Subheading"
                  value={subheading}
                  onChange={setSubheading}
                  autoComplete="off"
                />

                <TextField
                  label="Body Text"
                  value={body}
                  onChange={setBody}
                  multiline={4}
                />
              </FormLayout>
            </Card>

            <Card sectioned title="Call to Action">
              <FormLayout>
                <Select
                  label="CTA Type"
                  options={[
                    { label: "Discount Code", value: "discount" },
                    { label: "Add to Cart", value: "addToCart" },
                    { label: "Email Capture", value: "emailCapture" },
                    { label: "Custom Link", value: "link" },
                  ]}
                  value={ctaType}
                  onChange={setCtaType}
                />

                <TextField
                  label="Button Text"
                  value={ctaText}
                  onChange={(value) => handleFieldChange('ctaText', value)}
                  autoComplete="off"
                  required
                  error={isDirty ? errors.ctaText : undefined}
                />

                <TextField
                  label={ctaType === 'discount' ? 'Discount Code' : 
                         ctaType === 'addToCart' ? 'Product ID' :
                         ctaType === 'link' ? 'URL' : 'Form Action'}
                  value={ctaAction}
                  onChange={(value) => handleFieldChange('ctaAction', value)}
                  autoComplete="off"
                  required
                  error={isDirty ? errors.ctaAction : undefined}
                />
              </FormLayout>
            </Card>

            <Card sectioned title="Display Frequency">
              <FormLayout>
                <Select
                  label="Frequency Type"
                  options={[
                    { label: "Show Once", value: "once" },
                    { label: "Show Recurring", value: "recurring" },
                  ]}
                  value={frequencyType}
                  onChange={setFrequencyType}
                />

                {frequencyType === 'recurring' && (
                  <Select
                    label="Interval"
                    options={[
                      { label: "Every Session", value: "session" },
                      { label: "Every Day", value: "day" },
                      { label: "Every Week", value: "week" },
                    ]}
                    value={frequencyInterval}
                    onChange={setFrequencyInterval}
                  />
                )}
              </FormLayout>
            </Card>
          </Layout.Section>

          <Layout.Section oneHalf>
            <PopupPreview
              design={{
                template,
                colors,
                content: {
                  heading,
                  subheading,
                  body,
                  mediaUrl: undefined,
                  mediaType: undefined,
                },
              }}
              cta={{
                type: ctaType,
                text: ctaText,
                action: ctaAction,
              }}
            />
          </Layout.Section>

          <Layout.Section>
            <Card sectioned>
              <Form onSubmit={handleSubmit}>
                <Button 
                  primary 
                  submit 
                  loading={isSubmitting}
                  disabled={isSubmitting || (isDirty && Object.keys(errors).length > 0)}
                >
                  Create Popup
                </Button>
              </Form>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
      {toastProps.active && (
        <Toast
          content={toastProps.content}
          error={toastProps.error}
          onDismiss={() => setToastProps({ ...toastProps, active: false })}
        />
      )}
    </>
  );
} 