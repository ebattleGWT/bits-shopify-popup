import React, { useState } from 'react';
import type { FormField, FormSettings } from './FormBuilder';

interface PopupFormProps {
  fields: FormField[];
  settings: FormSettings;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  className?: string;
}

export function PopupForm({ fields, settings, onSubmit, className = '' }: PopupFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && !value) {
      return `${field.label} is required`;
    }

    if (value) {
      switch (field.type) {
        case 'email':
          const emailPattern = field.validation?.pattern || /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!new RegExp(emailPattern).test(value)) {
            return field.validation?.message || 'Please enter a valid email address';
          }
          break;

        case 'phone':
          if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) {
            return field.validation.message || 'Please enter a valid phone number';
          }
          break;
      }
    }

    return null;
  };

  const handleChange = (field: FormField, value: any) => {
    setFormData(prev => ({ ...prev, [field.id]: value }));
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field.id]: error || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(formData);
      setSubmitStatus('success');
      if (settings.redirectUrl) {
        window.location.href = settings.redirectUrl;
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className={`popup-form-success ${className}`}>
        <p>{settings.successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`popup-form ${className}`}>
      {submitStatus === 'error' && (
        <div className="popup-form-error">
          <p>{settings.errorMessage}</p>
        </div>
      )}

      {fields.map(field => (
        <div key={field.id} className="popup-form-field">
          <label htmlFor={field.id}>{field.label}</label>

          {field.type === 'textarea' ? (
            <textarea
              id={field.id}
              value={formData[field.id] || ''}
              onChange={e => handleChange(field, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          ) : field.type === 'select' ? (
            <select
              id={field.id}
              value={formData[field.id] || ''}
              onChange={e => handleChange(field, e.target.value)}
              required={field.required}
            >
              <option value="">Select...</option>
              {field.options?.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : field.type === 'checkbox' ? (
            <div className="checkbox-group">
              {field.options?.map(option => (
                <label key={option}>
                  <input
                    type="checkbox"
                    checked={formData[field.id]?.includes(option)}
                    onChange={e => {
                      const currentValues = formData[field.id] || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter((v: string) => v !== option);
                      handleChange(field, newValues);
                    }}
                  />
                  {option}
                </label>
              ))}
            </div>
          ) : field.type === 'radio' ? (
            <div className="radio-group">
              {field.options?.map(option => (
                <label key={option}>
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={formData[field.id] === option}
                    onChange={e => handleChange(field, e.target.value)}
                  />
                  {option}
                </label>
              ))}
            </div>
          ) : (
            <input
              type={field.type}
              id={field.id}
              value={formData[field.id] || ''}
              onChange={e => handleChange(field, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          )}

          {errors[field.id] && (
            <div className="popup-form-error-message">{errors[field.id]}</div>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isSubmitting}
        className="popup-form-submit"
      >
        {isSubmitting ? 'Submitting...' : settings.submitButtonText}
      </button>

      <style jsx>{`
        .popup-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .popup-form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .popup-form-field label {
          font-weight: 500;
        }

        .popup-form-field input,
        .popup-form-field textarea,
        .popup-form-field select {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .checkbox-group,
        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .checkbox-group label,
        .radio-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: normal;
        }

        .popup-form-error-message {
          color: #d82c0d;
          font-size: 0.875rem;
        }

        .popup-form-submit {
          padding: 0.75rem 1.5rem;
          background-color: #008060;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .popup-form-submit:hover {
          background-color: #006e52;
        }

        .popup-form-submit:disabled {
          background-color: #8c9196;
          cursor: not-allowed;
        }

        .popup-form-success {
          text-align: center;
          padding: 1rem;
          color: #008060;
        }

        .popup-form-error {
          background-color: #ffd6d6;
          color: #d82c0d;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
      `}</style>
    </form>
  );
} 