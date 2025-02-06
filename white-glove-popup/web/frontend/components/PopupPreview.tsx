import { Card, Button, Text, Stack } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { PopupConfig } from "../types/popup";

interface PopupPreviewProps {
  design: PopupConfig['design'];
  cta: PopupConfig['cta'];
}

export function PopupPreview({ design, cta }: PopupPreviewProps) {
  const [isVisible, setIsVisible] = useState(true);

  const previewStyles = {
    container: {
      position: 'relative',
      padding: '20px',
      backgroundColor: design.colors.background,
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      maxWidth: '400px',
      margin: '0 auto',
    },
    heading: {
      color: design.colors.text,
      fontSize: '24px',
      marginBottom: '12px',
      fontWeight: 'bold',
    },
    subheading: {
      color: design.colors.text,
      fontSize: '16px',
      marginBottom: '16px',
    },
    body: {
      color: design.colors.text,
      fontSize: '14px',
      marginBottom: '20px',
    },
    button: {
      backgroundColor: design.colors.primary,
      color: design.colors.secondary,
      border: 'none',
      padding: '10px 20px',
      borderRadius: '4px',
      cursor: 'pointer',
      width: '100%',
    },
  } as const;

  return (
    <Card sectioned title="Preview">
      <div style={previewStyles.container}>
        <Stack vertical spacing="tight">
          {design.content.heading && (
            <Text as="h2" variant="headingLg" style={previewStyles.heading}>
              {design.content.heading}
            </Text>
          )}
          
          {design.content.subheading && (
            <Text as="h3" variant="headingSm" style={previewStyles.subheading}>
              {design.content.subheading}
            </Text>
          )}
          
          {design.content.body && (
            <Text as="p" variant="bodyMd" style={previewStyles.body}>
              {design.content.body}
            </Text>
          )}

          {design.content.mediaUrl && (
            <div style={{ marginBottom: '16px' }}>
              {design.content.mediaType === 'image' ? (
                <img 
                  src={design.content.mediaUrl} 
                  alt="Popup media"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              ) : (
                <video 
                  src={design.content.mediaUrl}
                  controls
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              )}
            </div>
          )}

          <Button
            primary
            style={previewStyles.button}
          >
            {cta.text || 'Click Here'}
          </Button>
        </Stack>
      </div>
    </Card>
  );
} 