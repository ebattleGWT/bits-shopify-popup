import { json, type ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigate, useNavigation } from "@remix-run/react";
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

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

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

  // Validate required fields
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Name is required";
  if (!title) errors.title = "Title is required";
  if (!content) errors.content = "Content is required";

  if (Object.keys(errors).length > 0) {
    return json({ errors });
  }

  try {
    const popup = await prisma.popup.create({
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
        shop: session.shop,
      },
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
  const isSubmitting = navigation.state === "submitting";

  const [position, setPosition] = React.useState("CENTER");
  const [theme, setTheme] = React.useState("LIGHT");
  const [frequency, setFrequency] = React.useState("ALWAYS");
  const [animation, setAnimation] = React.useState("FADE");
  const [selectedDevices, setSelectedDevices] = React.useState<string[]>([]);
  const [selectedPages, setSelectedPages] = React.useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>([]);
  const [{ month, year }, setDate] = React.useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
  const [startDate, setStartDate] = React.useState<Date | null>(null);
  const [endDate, setEndDate] = React.useState<Date | null>(null);
  const [name, setName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");

  return (
    <Page
      title="Create New Popup"
      backAction={{
        content: "Popups",
        onAction: () => navigate("/app/popups"),
      }}
    >
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
                        <Text variant="headingMd" as="h3">Basic Information</Text>
                        <FormLayout>
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
                            value="0"
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

              <Layout.Section>
                <Button variant="primary" submit disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Popup"}
                </Button>
              </Layout.Section>
            </Layout>
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 