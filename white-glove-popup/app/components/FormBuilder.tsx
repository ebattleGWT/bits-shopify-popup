import React, { useState } from 'react';
import {
  Card,
  Button,
  BlockStack,
  InlineStack,
  Box,
  Text,
  TextField,
  Select,
  Icon,
  Checkbox,
  Banner,
} from '@shopify/polaris';
import { DragHandleMinor, DeleteMinor } from '@shopify/polaris-icons';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, checkbox, radio
  defaultValue?: string;
  validation?: {
    pattern?: string;
    message?: string;
  };
}

export interface FormSettings {
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
  redirectUrl?: string;
  sendConfirmationEmail: boolean;
  emailTemplate?: string;
}

interface FormBuilderProps {
  fields: FormField[];
  settings: FormSettings;
  onChange: (fields: FormField[], settings: FormSettings) => void;
}

export function FormBuilder({ fields, settings, onChange }: FormBuilderProps) {
  const [activeField, setActiveField] = useState<string | null>(null);

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: `New ${type} field`,
      required: false,
      placeholder: '',
      options: type === 'select' || type === 'checkbox' || type === 'radio' ? ['Option 1'] : undefined,
    };
    onChange([...fields, newField], settings);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    const updatedFields = fields.map(field =>
      field.id === id ? { ...field, ...updates } : field
    );
    onChange(updatedFields, settings);
  };

  const removeField = (id: string) => {
    const updatedFields = fields.filter(field => field.id !== id);
    onChange(updatedFields, settings);
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(field => field.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) {
      return;
    }

    const newFields = [...fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    onChange(newFields, settings);
  };

  const updateSettings = (updates: Partial<FormSettings>) => {
    onChange(fields, { ...settings, ...updates });
  };

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <Box padding="400">
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Form Fields</Text>
              <InlineStack gap="300">
                <Button onClick={() => addField('text')}>Add Text Field</Button>
                <Button onClick={() => addField('email')}>Add Email Field</Button>
                <Button onClick={() => addField('phone')}>Add Phone Field</Button>
                <Button onClick={() => addField('textarea')}>Add Text Area</Button>
                <Button onClick={() => addField('select')}>Add Dropdown</Button>
                <Button onClick={() => addField('checkbox')}>Add Checkbox</Button>
                <Button onClick={() => addField('radio')}>Add Radio</Button>
              </InlineStack>
            </BlockStack>
          </Box>

          {fields.map((field, index) => (
            <Box
              key={field.id}
              padding="400"
              background={activeField === field.id ? 'bg-surface-secondary' : undefined}
            >
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <InlineStack gap="200">
                    <Button
                      icon={DragHandleMinor}
                      onClick={() => setActiveField(field.id)}
                      plain
                    />
                    <Text variant="bodyMd" as="span">{field.type.toUpperCase()}</Text>
                  </InlineStack>
                  <InlineStack gap="200">
                    <Button
                      onClick={() => moveField(field.id, 'up')}
                      disabled={index === 0}
                      plain
                    >
                      ↑
                    </Button>
                    <Button
                      onClick={() => moveField(field.id, 'down')}
                      disabled={index === fields.length - 1}
                      plain
                    >
                      ↓
                    </Button>
                    <Button
                      icon={DeleteMinor}
                      onClick={() => removeField(field.id)}
                      tone="critical"
                      plain
                    />
                  </InlineStack>
                </InlineStack>

                <TextField
                  label="Field Label"
                  value={field.label}
                  onChange={(value) => updateField(field.id, { label: value })}
                />

                <TextField
                  label="Placeholder"
                  value={field.placeholder || ''}
                  onChange={(value) => updateField(field.id, { placeholder: value })}
                />

                {(field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') && (
                  <TextField
                    label="Options (one per line)"
                    value={field.options?.join('\n') || ''}
                    multiline={3}
                    onChange={(value) =>
                      updateField(field.id, { options: value.split('\n').filter(Boolean) })
                    }
                  />
                )}

                <Checkbox
                  label="Required field"
                  checked={field.required}
                  onChange={(checked) => updateField(field.id, { required: checked })}
                />

                {field.type !== 'checkbox' && (
                  <TextField
                    label="Default Value"
                    value={field.defaultValue || ''}
                    onChange={(value) => updateField(field.id, { defaultValue: value })}
                  />
                )}

                {(field.type === 'email' || field.type === 'phone') && (
                  <TextField
                    label="Validation Pattern"
                    value={field.validation?.pattern || ''}
                    onChange={(value) =>
                      updateField(field.id, {
                        validation: { ...field.validation, pattern: value },
                      })
                    }
                    helpText={
                      field.type === 'email'
                        ? 'Default email validation will be used if empty'
                        : 'Regular expression for validation'
                    }
                  />
                )}
              </BlockStack>
            </Box>
          ))}
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Box padding="400">
            <Text variant="headingMd" as="h3">Form Settings</Text>
          </Box>
          <Box padding="400">
            <BlockStack gap="400">
              <TextField
                label="Submit Button Text"
                value={settings.submitButtonText}
                onChange={(value) => updateSettings({ submitButtonText: value })}
              />

              <TextField
                label="Success Message"
                value={settings.successMessage}
                multiline={2}
                onChange={(value) => updateSettings({ successMessage: value })}
              />

              <TextField
                label="Error Message"
                value={settings.errorMessage}
                multiline={2}
                onChange={(value) => updateSettings({ errorMessage: value })}
              />

              <TextField
                label="Redirect URL (optional)"
                value={settings.redirectUrl || ''}
                onChange={(value) => updateSettings({ redirectUrl: value })}
                helpText="Redirect users after successful form submission"
              />

              <Checkbox
                label="Send confirmation email"
                checked={settings.sendConfirmationEmail}
                onChange={(checked) => updateSettings({ sendConfirmationEmail: checked })}
              />

              {settings.sendConfirmationEmail && (
                <TextField
                  label="Email Template"
                  value={settings.emailTemplate || ''}
                  multiline={4}
                  onChange={(value) => updateSettings({ emailTemplate: value })}
                  helpText="Use {{field_name}} to insert form field values"
                />
              )}
            </BlockStack>
          </Box>
        </BlockStack>
      </Card>
    </BlockStack>
  );
} 