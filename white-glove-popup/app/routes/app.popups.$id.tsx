import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import React from "react";
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
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

type ActionData = {
  errors?: {
    general?: string;
    name?: string;
    title?: string;
    content?: string;
  };
  success?: boolean;
};

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
  const { session } = await authenticate.admin(request);
  const { id } = params;

  if (request.method === "DELETE") {
    await prisma.popup.delete({
      where: {
        id,
        shop: session.shop,
      },
    });
    return json({ success: true });
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
    const popup = await prisma.popup.update({
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
  const isSubmitting = navigation.state === "submitting";
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  const [position, setPosition] = React.useState(popup.position);
  const [theme, setTheme] = React.useState(popup.theme);
  const [frequency, setFrequency] = React.useState(popup.frequency);
  const [animation, setAnimation] = React.useState(popup.animation);
  const [selectedDevices, setSelectedDevices] = React.useState<string[]>(
    popup.deviceTypes ? JSON.parse(popup.deviceTypes) : []
  );
  const [selectedPages, setSelectedPages] = React.useState<string[]>(
    popup.showOnPages ? JSON.parse(popup.showOnPages) : []
  );
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>(
    popup.countries ? JSON.parse(popup.countries) : []
  );
  const [{ month, year }, setDate] = React.useState({ 
    month: popup.startDate ? new Date(popup.startDate).getMonth() : new Date().getMonth(), 
    year: popup.startDate ? new Date(popup.startDate).getFullYear() : new Date().getFullYear() 
  });
  const [startDate, setStartDate] = React.useState<Date | null>(
    popup.startDate ? new Date(popup.startDate) : null
  );
  const [endDate, setEndDate] = React.useState<Date | null>(
    popup.endDate ? new Date(popup.endDate) : null
  );
  const [isEnabled, setIsEnabled] = React.useState(popup.isEnabled);

  const handleDelete = async () => {
    const response = await fetch(`/app/popups/${popup.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      navigate("/app/popups");
    }
  };

  return (
    <Page
      title={popup.name}
      backAction={{
        content: "Popups",
        onAction: () => navigate("/app/popups"),
      }}
      secondaryActions={[
        {
          content: "Delete",
          destructive: true,
          onAction: () => setShowDeleteModal(true),
        },
      ]}
    >
      <ContextualSaveBar
        message="Unsaved changes"
        saveAction={{
          content: "Save",
          onAction: () => {
            const form = document.querySelector('form');
            if (form) form.submit();
          },
          loading: isSubmitting,
        }}
        discardAction={{
          content: "Discard",
          onAction: () => window.location.reload(),
        }}
      />

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete popup"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: handleDelete,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowDeleteModal(false),
          },
        ]}
      >
        <Modal.Section>
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

          <Form method="post">
            <Layout>
              <Layout.Section>
                <Card>
                  <BlockStack gap="400">
                    <Box padding="400">
                      <BlockStack gap="400">
                        <Text variant="headingMd" as="h3">Status</Text>
                        <Checkbox
                          label="Enable popup"
                          checked={isEnabled}
                          onChange={(checked) => {
                            setIsEnabled(checked);
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
                            value={popup.name}
                            error={actionData?.errors?.name}
                            autoComplete="off"
                            helpText="Internal name for the popup"
                          />
                          <TextField
                            label="Title"
                            name="title"
                            value={popup.title}
                            error={actionData?.errors?.title}
                            autoComplete="off"
                            helpText="Title displayed to customers"
                          />
                          <TextField
                            label="Content"
                            name="content"
                            value={popup.content}
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
                            value={position}
                            onChange={setPosition}
                          />
                          <Select
                            label="Theme"
                            name="theme"
                            options={[
                              { label: "Light", value: "LIGHT" },
                              { label: "Dark", value: "DARK" },
                              { label: "Custom", value: "CUSTOM" },
                            ]}
                            value={theme}
                            onChange={setTheme}
                          />
                          <Select
                            label="Animation"
                            name="animation"
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
                            value={frequency}
                            onChange={setFrequency}
                            helpText="How often to show the popup to the same visitor"
                          />
                          <Box padding="400">
                            <Text variant="headingMd" as="h3">Schedule</Text>
                            <Grid>
                              <Grid.Cell columnSpan={{ xs: 6 }}>
                                <DatePicker
                                  month={month}
                                  year={year}
                                  onChange={({ start }) => {
                                    setStartDate(start);
                                    const startInput = document.createElement('input');
                                    startInput.type = 'hidden';
                                    startInput.name = 'startDate';
                                    startInput.value = start.toISOString();
                                    document.forms[0].appendChild(startInput);
                                  }}
                                  onMonthChange={(month, year) => setDate({ month, year })}
                                  selected={startDate ? { start: startDate, end: startDate } : undefined}
                                />
                              </Grid.Cell>
                              <Grid.Cell columnSpan={{ xs: 6 }}>
                                <DatePicker
                                  month={month}
                                  year={year}
                                  onChange={({ start }) => {
                                    setEndDate(start);
                                    const endInput = document.createElement('input');
                                    endInput.type = 'hidden';
                                    endInput.name = 'endDate';
                                    endInput.value = start.toISOString();
                                    document.forms[0].appendChild(endInput);
                                  }}
                                  onMonthChange={(month, year) => setDate({ month, year })}
                                  selected={endDate ? { start: endDate, end: endDate } : undefined}
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
                                  checked={selectedDevices.includes(device)}
                                  onChange={(checked) => {
                                    const newDevices = checked
                                      ? [...selectedDevices, device]
                                      : selectedDevices.filter((d) => d !== device);
                                    setSelectedDevices(newDevices);
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
                            value={selectedPages.join('\n')}
                            helpText="Enter page URLs (one per line)"
                            multiline={3}
                            autoComplete="off"
                            onChange={(value) => {
                              const pages = value.split('\n').filter(Boolean);
                              setSelectedPages(pages);
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
                            value={selectedCountries.join('\n')}
                            helpText="Enter country codes (one per line, e.g., US, CA)"
                            multiline={3}
                            autoComplete="off"
                            onChange={(value) => {
                              const countries = value.split('\n').filter(Boolean);
                              setSelectedCountries(countries);
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
  );
} 