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
import prisma from "../db.server";
import type { LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  const popups = await prisma.popup.findMany({
    where: {
      shop: session.shop,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
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
        url: "new",
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
                  url={`/app/popups/${popup.id}`}
                >
                  <Text as="h3" variant="bodyMd">
                    {popup.name}
                  </Text>
                  <Badge tone={popup.isEnabled ? "success" : "warning"}>
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