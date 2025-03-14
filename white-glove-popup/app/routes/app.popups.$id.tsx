import { json, type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigate, useNavigation, useSubmit } from "@remix-run/react";
import React, { useCallback, useEffect } from "react";
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
  ContextualSaveBar,
  Modal,
  Frame,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { FormBuilder, type FormField, type FormSettings } from '../components/FormBuilder';
import type { Popup } from '@prisma/client';

type ActionData = {
  errors?: {
    general?: string;
    name?: string;
    title?: string;
    content?: string;
  };
  success?: boolean;
};

interface ExtendedPopup extends Popup {
  formEnabled?: boolean;
  formFields?: FormField[];
  formSettings?: FormSettings;
}

interface FormState {
  position: string;
  theme: string;
  frequency: string;
  animation: string;
  selectedDevices: string[];
  selectedPages: string[];
  selectedCountries: string[];
  date: {
    month: number;
    year: number;
  };
  startDate: Date | null;
  endDate: Date | null;
  isEnabled: boolean;
  name: string;
  title: string;
  content: string;
  formEnabled: boolean;
  formFields: FormField[];
  formSettings: FormSettings;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  const popup = await prisma.popup.findFirst({
    where: {
      id,
      shop: session.shop,
    },
  });

  if (!popup) {
    throw new Response("Popup not found", { status: 404 });
  }

  return json({ popup });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  if (!session?.shop) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  if (request.method === "DELETE") {
    await prisma.popup.delete({
      where: {
        id,
        shop: session.shop,
      },
    });
    return redirect("/app/popups");
  }

  const formData = await request.formData();
  const name = formData.get("name");
  const title = formData.get("title");
  const content = formData.get("content");
  const position = formData.get("position");
  const theme = formData.get("theme");
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  const delay = formData.get("delay");
  const frequency = formData.get("frequency");
  const animation = formData.get("animation");
  const deviceTypes = formData.getAll("deviceTypes");
  const showOnPages = formData.getAll("showOnPages");
  const countries = formData.getAll("countries");
  const isEnabled = formData.get("isEnabled") === "true";

  // Validate required fields
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Name is required";
  if (!title) errors.title = "Title is required";
  if (!content) errors.content = "Content is required";

  if (Object.keys(errors).length > 0) {
    return json({ errors });
  }

  try {
    await prisma.popup.update({
      where: {
        id,
        shop: session.shop,
      },
      data: {
        name: name as string,
        title: title as string,
        content: content as string,
        position: position as string || "CENTER",
        theme: theme as string || "LIGHT",
        startDate: startDate ? new Date(startDate as string) : null,
        endDate: endDate ? new Date(endDate as string) : null,
        delay: delay ? parseInt(delay as string, 10) : 0,
        frequency: frequency as string || "ALWAYS",
        animation: animation as string || "FADE",
        deviceTypes: deviceTypes.length ? JSON.stringify(deviceTypes) : null,
        showOnPages: showOnPages.length ? JSON.stringify(showOnPages) : null,
        countries: countries.length ? JSON.stringify(countries) : null,
        isEnabled,
        formEnabled: formData.get("formEnabled") === "true",
        formFields: formData.get("formFields") as string,
        formSettings: formData.get("formSettings") as string,
      },
    });

    return json({ success: true });
  } catch (error) {
    console.error("Failed to update popup:", error);
    return json({
      errors: {
        general: "An unexpected error occurred. Please try again.",
      },
    });
  }
}

export default function EditPopup() {
  const { popup } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showPreviewModal, setShowPreviewModal] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Reset dirty state and show success banner when the action is successful
  useEffect(() => {
    if (actionData?.success) {
      setIsDirty(false);
      setShowSuccessBanner(true);
      // Hide the success banner after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionData]);

  const [formState, setFormState] = React.useState<FormState>({
    position: popup.position,
    theme: popup.theme,
    frequency: popup.frequency,
    animation: popup.animation,
    selectedDevices: popup.deviceTypes ? JSON.parse(popup.deviceTypes) : [],
    selectedPages: popup.showOnPages ? JSON.parse(popup.showOnPages) : [],
    selectedCountries: popup.countries ? JSON.parse(popup.countries) : [],
    date: {
      month: popup.startDate ? new Date(popup.startDate).getMonth() : new Date().getMonth(),
      year: popup.startDate ? new Date(popup.startDate).getFullYear() : new Date().getFullYear(),
    },
    startDate: popup.startDate ? new Date(popup.startDate) : null,
    endDate: popup.endDate ? new Date(popup.endDate) : null,
    isEnabled: popup.isEnabled,
    name: popup.name,
    title: popup.title,
    content: popup.content,
    formEnabled: popup.formEnabled || false,
    formFields: popup.formFields ? JSON.parse(popup.formFields) as FormField[] : [],
    formSettings: popup.formSettings ? JSON.parse(popup.formSettings) as FormSettings : {
      submitButtonText: 'Submit',
      successMessage: 'Thank you for your submission!',
      errorMessage: 'Something went wrong. Please try again.',
      sendConfirmationEmail: false,
    },
  });

  const handleFormChange = (field: keyof FormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const appendFormData = (form: HTMLFormElement) => {
    const formEnabledInput = document.createElement('input');
    formEnabledInput.type = 'hidden';
    formEnabledInput.name = 'formEnabled';
    formEnabledInput.value = formState.formEnabled.toString();
    form.appendChild(formEnabledInput);

    const formFieldsInput = document.createElement('input');
    formFieldsInput.type = 'hidden';
    formFieldsInput.name = 'formFields';
    formFieldsInput.value = JSON.stringify(formState.formFields);
    form.appendChild(formFieldsInput);

    const formSettingsInput = document.createElement('input');
    formSettingsInput.type = 'hidden';
    formSettingsInput.name = 'formSettings';
    formSettingsInput.value = JSON.stringify(formState.formSettings);
    form.appendChild(formSettingsInput);
  };

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    appendFormData(form);
    const formData = new FormData(form);
    submit(formData, { method: 'post' });
  }, [formState, submit]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      const response = await fetch(`/app/popups/${popup.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete popup');
      }

      // Close the modal and navigate
      setShowDeleteModal(false);
      navigate("/app/popups");
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete popup');
    } finally {
      setIsDeleting(false);
    }
  };

  const getPreviewStyles = () => {
    const styles: React.CSSProperties = {
      position: 'fixed',
      padding: '20px',
      borderRadius: '8px',
      maxWidth: '400px',
      width: '90%',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      animation: `${formState.animation.toLowerCase()} 0.5s`,
      zIndex: 1000,
    };

    // Position styles
    switch (formState.position) {
      case 'TOP':
        styles.top = '20px';
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
        break;
      case 'BOTTOM':
        styles.bottom = '20px';
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
        break;
      case 'LEFT':
        styles.left = '20px';
        styles.top = '50%';
        styles.transform = 'translateY(-50%)';
        break;
      case 'RIGHT':
        styles.right = '20px';
        styles.top = '50%';
        styles.transform = 'translateY(-50%)';
        break;
      default: // CENTER
        styles.top = '50%';
        styles.left = '50%';
        styles.transform = 'translate(-50%, -50%)';
    }

    // Theme styles
    switch (formState.theme) {
      case 'DARK':
        styles.backgroundColor = '#333';
        styles.color = '#fff';
        break;
      case 'CUSTOM':
        // Use custom CSS if provided
        if (popup.customCss) {
          try {
            const customStyles = JSON.parse(popup.customCss);
            Object.assign(styles, customStyles);
          } catch (e) {
            console.error('Failed to parse custom CSS');
          }
        }
        break;
      default: // LIGHT
        styles.backgroundColor = '#fff';
        styles.color = '#333';
        break;
    }

    return styles;
  };

  const PreviewContent = () => {
    const styles = getPreviewStyles();
    
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={styles}>
          <div style={{ marginBottom: '15px' }}>
            <Text variant="headingMd" as="h2">{formState.title}</Text>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <Text variant="bodyMd" as="p">{formState.content}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button onClick={() => setShowPreviewModal(false)}>Close</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Frame>
      <Page
        title={formState.name}
        backAction={{
          content: "Popups",
          onAction: () => navigate("/app/popups"),
        }}
        secondaryActions={[
          {
            content: "Preview",
            onAction: () => setShowPreviewModal(true),
          },
          {
            content: "Delete",
            destructive: true,
            onAction: () => setShowDeleteModal(true),
          },
        ]}
      >
        {isDirty && (
          <ContextualSaveBar
            message="Unsaved changes"
            saveAction={{
              content: "Save",
              onAction: () => {
                const form = document.querySelector('form');
                if (form) form.requestSubmit();
              },
              loading: isSubmitting,
            }}
            discardAction={{
              content: "Discard",
              onAction: () => window.location.reload(),
            }}
          />
        )}

        <Modal
          open={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Preview Popup"
          size="large"
        >
          <Modal.Section>
            <div style={{ height: '80vh', position: 'relative', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '8px',
                backgroundColor: '#f6f6f7',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f57' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28c940' }}></div>
                <Text variant="bodyMd" as="span" tone="subdued">Preview Mode</Text>
              </div>
              <div style={{ height: '100%', paddingTop: '40px' }}>
                <PreviewContent />
              </div>
            </div>
          </Modal.Section>
        </Modal>

        <Modal
          open={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteError(null);
          }}
          title="Delete popup"
          primaryAction={{
            content: "Delete",
            destructive: true,
            onAction: handleDelete,
            loading: isDeleting,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => {
                setShowDeleteModal(false);
                setDeleteError(null);
              },
            },
          ]}
        >
          <Modal.Section>
            {deleteError && (
              <Box paddingBlock="400">
                <Banner tone="critical">
                  <p>{deleteError}</p>
                </Banner>
              </Box>
            )}
            <Text as="p">
              Are you sure you want to delete this popup? This action cannot be undone.
            </Text>
          </Modal.Section>
        </Modal>

        <Layout>
          <Layout.Section>
            {actionData?.errors?.general && (
              <Banner tone="critical">
                <p>{actionData.errors.general}</p>
              </Banner>
            )}
            
            {showSuccessBanner && (
              <Banner tone="success" onDismiss={() => setShowSuccessBanner(false)}>
                <p>Changes saved successfully!</p>
              </Banner>
            )}

            <Form method="post" onSubmit={handleSubmit}>
              <Layout>
                <Layout.Section>
                  <Card>
                    <BlockStack gap="400">
                      <Box padding="400">
                        <BlockStack gap="400">
                          <Text variant="headingMd" as="h3">Status</Text>
                          <Checkbox
                            label="Enable popup"
                            checked={formState.isEnabled}
                            onChange={(checked) => {
                              handleFormChange('isEnabled', checked);
                              const input = document.createElement('input');
                              input.type = 'hidden';
                              input.name = 'isEnabled';
                              input.value = checked.toString();
                              document.forms[0].appendChild(input);
                            }}
                          />
                        </BlockStack>
                      </Box>

                      <Box padding="400">
                        <BlockStack gap="400">
                          <Text variant="headingMd" as="h3">Basic Information</Text>
                          <FormLayout>
                            <TextField
                              label="Name"
                              name="name"
                              value={formState.name}
                              onChange={(value) => {
                                handleFormChange('name', value);
                              }}
                              error={actionData?.errors?.name}
                              autoComplete="off"
                              helpText="Internal name for the popup"
                            />
                            <TextField
                              label="Title"
                              name="title"
                              value={formState.title}
                              onChange={(value) => {
                                handleFormChange('title', value);
                              }}
                              error={actionData?.errors?.title}
                              autoComplete="off"
                              helpText="Title displayed to customers"
                            />
                            <TextField
                              label="Content"
                              name="content"
                              value={formState.content}
                              onChange={(value) => {
                                handleFormChange('content', value);
                              }}
                              error={actionData?.errors?.content}
                              autoComplete="off"
                              multiline={4}
                              helpText="Main content of the popup"
                            />
                          </FormLayout>
                        </BlockStack>
                      </Box>

                      <Box padding="400">
                        <BlockStack gap="400">
                          <Text variant="headingMd" as="h3">Appearance</Text>
                          <FormLayout>
                            <Select
                              label="Position"
                              name="position"
                              options={[
                                { label: "Center", value: "CENTER" },
                                { label: "Top", value: "TOP" },
                                { label: "Bottom", value: "BOTTOM" },
                                { label: "Left", value: "LEFT" },
                                { label: "Right", value: "RIGHT" },
                              ]}
                              value={formState.position}
                              onChange={(value) => {
                                handleFormChange('position', value);
                              }}
                            />
                            <Select
                              label="Theme"
                              name="theme"
                              options={[
                                { label: "Light", value: "LIGHT" },
                                { label: "Dark", value: "DARK" },
                                { label: "Custom", value: "CUSTOM" },
                              ]}
                              value={formState.theme}
                              onChange={(value) => {
                                handleFormChange('theme', value);
                              }}
                            />
                            <Select
                              label="Animation"
                              name="animation"
                              options={[
                                { label: "Fade", value: "FADE" },
                                { label: "Slide", value: "SLIDE" },
                                { label: "Bounce", value: "BOUNCE" },
                              ]}
                              value={formState.animation}
                              onChange={(value) => {
                                handleFormChange('animation', value);
                              }}
                            />
                            <TextField
                              label="Delay (seconds)"
                              name="delay"
                              type="number"
                              min="0"
                              value={popup.delay.toString()}
                              autoComplete="off"
                              helpText="Time to wait before showing the popup"
                            />
                          </FormLayout>
                        </BlockStack>
                      </Box>

                      <Box padding="400">
                        <BlockStack gap="400">
                          <Text variant="headingMd" as="h3">Display Settings</Text>
                          <FormLayout>
                            <Select
                              label="Frequency"
                              name="frequency"
                              options={[
                                { label: "Always", value: "ALWAYS" },
                                { label: "Once", value: "ONCE" },
                                { label: "Daily", value: "DAILY" },
                                { label: "Weekly", value: "WEEKLY" },
                              ]}
                              value={formState.frequency}
                              onChange={(value) => {
                                handleFormChange('frequency', value);
                              }}
                              helpText="How often to show the popup to the same visitor"
                            />
                            <Box padding="400">
                              <Text variant="headingMd" as="h3">Schedule</Text>
                              <Grid>
                                <Grid.Cell columnSpan={{ xs: 6 }}>
                                  <DatePicker
                                    month={formState.date.month}
                                    year={formState.date.year}
                                    onChange={({ start }) => {
                                      handleFormChange('startDate', start);
                                      const startInput = document.createElement('input');
                                      startInput.type = 'hidden';
                                      startInput.name = 'startDate';
                                      startInput.value = start.toISOString();
                                      document.forms[0].appendChild(startInput);
                                    }}
                                    onMonthChange={(month, year) => handleFormChange('date', { month, year })}
                                    selected={formState.startDate ? { start: formState.startDate, end: formState.startDate } : undefined}
                                  />
                                </Grid.Cell>
                                <Grid.Cell columnSpan={{ xs: 6 }}>
                                  <DatePicker
                                    month={formState.date.month}
                                    year={formState.date.year}
                                    onChange={({ start }) => {
                                      handleFormChange('endDate', start);
                                      const endInput = document.createElement('input');
                                      endInput.type = 'hidden';
                                      endInput.name = 'endDate';
                                      endInput.value = start.toISOString();
                                      document.forms[0].appendChild(endInput);
                                    }}
                                    onMonthChange={(month, year) => handleFormChange('date', { month, year })}
                                    selected={formState.endDate ? { start: formState.endDate, end: formState.endDate } : undefined}
                                  />
                                </Grid.Cell>
                              </Grid>
                            </Box>
                          </FormLayout>
                        </BlockStack>
                      </Box>

                      <Box padding="400">
                        <BlockStack gap="400">
                          <Text variant="headingMd" as="h3">Targeting</Text>
                          <FormLayout>
                            <Box padding="400">
                              <Text variant="headingMd" as="h3">Device Types</Text>
                              <InlineStack gap="300">
                                {["MOBILE", "DESKTOP", "TABLET"].map((device) => (
                                  <Checkbox
                                    key={device}
                                    label={device.charAt(0) + device.slice(1).toLowerCase()}
                                    checked={formState.selectedDevices.includes(device)}
                                    onChange={(checked) => {
                                      const newDevices = checked
                                        ? [...formState.selectedDevices, device]
                                        : formState.selectedDevices.filter((d) => d !== device);
                                      handleFormChange('selectedDevices', newDevices);
                                      const input = document.createElement('input');
                                      input.type = 'hidden';
                                      input.name = 'deviceTypes';
                                      input.value = device;
                                      if (checked) {
                                        document.forms[0].appendChild(input);
                                      } else {
                                        document.forms[0].querySelector(`input[name="deviceTypes"][value="${device}"]`)?.remove();
                                      }
                                    }}
                                  />
                                ))}
                              </InlineStack>
                            </Box>

                            <TextField
                              label="Show on Pages"
                              name="showOnPages"
                              value={formState.selectedPages.join('\n')}
                              helpText="Enter page URLs (one per line)"
                              multiline={3}
                              autoComplete="off"
                              onChange={(value) => {
                                const pages = value.split('\n').filter(Boolean);
                                handleFormChange('selectedPages', pages);
                                document.forms[0].querySelectorAll('input[name="showOnPages"]').forEach(el => el.remove());
                                pages.forEach(page => {
                                  const input = document.createElement('input');
                                  input.type = 'hidden';
                                  input.name = 'showOnPages';
                                  input.value = page;
                                  document.forms[0].appendChild(input);
                                });
                              }}
                            />

                            <TextField
                              label="Countries"
                              name="countries"
                              value={formState.selectedCountries.join('\n')}
                              helpText="Enter country codes (one per line, e.g., US, CA)"
                              multiline={3}
                              autoComplete="off"
                              onChange={(value) => {
                                const countries = value.split('\n').filter(Boolean);
                                handleFormChange('selectedCountries', countries);
                                document.forms[0].querySelectorAll('input[name="countries"]').forEach(el => el.remove());
                                countries.forEach(country => {
                                  const input = document.createElement('input');
                                  input.type = 'hidden';
                                  input.name = 'countries';
                                  input.value = country;
                                  document.forms[0].appendChild(input);
                                });
                              }}
                            />
                          </FormLayout>
                        </Box>

                        <Box padding="400">
                          <BlockStack gap="400">
                            <Text variant="headingMd" as="h3">Form Builder</Text>
                            <Checkbox
                              label="Enable form"
                              checked={formState.formEnabled}
                              onChange={(checked) => {
                                setFormState(prev => ({
                                  ...prev,
                                  formEnabled: checked
                                }));
                                setIsDirty(true);
                              }}
                            />

                            {formState.formEnabled && (
                              <FormBuilder
                                fields={formState.formFields}
                                settings={formState.formSettings}
                                onChange={(fields, settings) => {
                                  setFormState(prev => ({
                                    ...prev,
                                    formFields: fields,
                                    formSettings: settings
                                  }));
                                  setIsDirty(true);
                                }}
                              />
                            )}
                          </BlockStack>
                        </Box>
                      </BlockStack>
                    </Card>
                  </Layout.Section>
                </Layout>
              </Form>
            </Layout.Section>
          </Layout>
        </Page>
      </Frame>
    );
  }
} 