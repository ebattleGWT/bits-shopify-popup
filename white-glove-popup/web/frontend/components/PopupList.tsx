import { Card, ResourceList, ResourceItem, Text, Badge } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { PopupConfig } from "../types/popup";

export function PopupList() {
  const [popups, setPopups] = useState<PopupConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch popups from API
    setIsLoading(false);
  }, []);

  return (
    <Card>
      <ResourceList
        resourceName={{ singular: 'popup', plural: 'popups' }}
        items={popups}
        loading={isLoading}
        emptyState={
          <Text variant="bodyMd" as="p">
            No popups created yet. Click the "Create popup" button to get started.
          </Text>
        }
        renderItem={(popup: PopupConfig) => (
          <ResourceItem
            id={popup.id}
            onClick={() => {/* TODO: Navigate to popup editor */}}
          >
            <Text variant="bodyMd" as="h3">
              {popup.name}
            </Text>
            <Badge status={popup.isEnabled ? 'success' : 'warning'}>
              {popup.isEnabled ? 'Active' : 'Inactive'}
            </Badge>
          </ResourceItem>
        )}
      />
    </Card>
  );
} 