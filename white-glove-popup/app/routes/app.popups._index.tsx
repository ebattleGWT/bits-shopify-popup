import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  ResourceList,
  ResourceItem,
  Text,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  // TODO: Replace with actual database query once we set up the schema
  const popups = [];
  
  return json({
    popups,
  });
};

export default function PopupsIndex() {
  const { popups } = useLoaderData<typeof loader>();

  return (
    <Page
      title="Popups"
      primaryAction={{
        content: "Create popup",
        url: "popups/new",
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <ResourceList
              resourceName={{ singular: "popup", plural: "popups" }}
              items={popups}
              emptyState={
                <Text as="p" variant="bodyMd">
                  No popups created yet. Click "Create popup" to get started.
                </Text>
              }
              renderItem={(popup) => (
                <ResourceItem
                  id={popup.id}
                  url={`popups/${popup.id}`}
                >
                  <Text as="h3" variant="bodyMd">
                    {popup.name}
                  </Text>
                  <Badge status={popup.isEnabled ? "success" : "warning"}>
                    {popup.isEnabled ? "Active" : "Inactive"}
                  </Badge>
                </ResourceItem>
              )}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 