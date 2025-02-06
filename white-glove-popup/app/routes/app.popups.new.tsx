import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation, useNavigate } from "@remix-run/react";
import React from "react";
import {
  Page,
  Layout,
  FormLayout,
  Card,
  TextField,
  Button,
  Select,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

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

  // Validate required fields
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Name is required";
  if (!title) errors.title = "Title is required";
  if (!content) errors.content = "Content is required";

  if (Object.keys(errors).length > 0) {
    return json({ errors });
  }

  try {
    const response = await fetch("/app/popups/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        title,
        content,
        position: position || "CENTER",
        theme: theme || "LIGHT",
      }),
    });

    if (!response.ok) {
      return json({
        errors: {
          general: "Failed to create popup. Please try again.",
        },
      });
    }

    return json({ success: true });
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

          <Card>
            <Form method="post">
              <FormLayout>
                <TextField
                  label="Name"
                  name="name"
                  error={actionData?.errors?.name}
                  autoComplete="off"
                />

                <TextField
                  label="Title"
                  name="title"
                  error={actionData?.errors?.title}
                  autoComplete="off"
                />

                <TextField
                  label="Content"
                  name="content"
                  error={actionData?.errors?.content}
                  autoComplete="off"
                  multiline={4}
                />

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

                <Button variant="primary" submit disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Popup"}
                </Button>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 