import { Page, Layout, Card, Button, Text } from "@shopify/polaris";
import { useState } from "react";
import { PopupList } from "../components/PopupList";
import { CreatePopupButton } from "../components/CreatePopupButton";

export default function HomePage() {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <Page
      title="White Glove Popup"
      primaryAction={
        <CreatePopupButton onClick={() => setIsCreating(true)} />
      }
    >
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Text variant="headingMd" as="h2">
              Welcome to White Glove Popup
            </Text>
            <Text variant="bodyMd" as="p">
              Create and manage your store's popups to boost engagement and sales.
            </Text>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <PopupList />
        </Layout.Section>
      </Layout>
    </Page>
  );
} 