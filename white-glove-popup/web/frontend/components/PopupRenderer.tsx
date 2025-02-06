import React from 'react';
import { PopupConfig } from '../types/popup';

interface PopupRendererProps {
  popup: PopupConfig;
  onClose: () => void;
  onAction: (action: string) => void;
}

const PopupRenderer: React.FC<PopupRendererProps> = ({ popup, onClose, onAction }) => {
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    popup: {
      backgroundColor: popup.design.colors.background,
      padding: '20px',
      borderRadius: '8px',
      maxWidth: '90%',
      width: '400px',
      position: 'relative',
    },
    closeButton: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: popup.design.colors.text,
    },
  } as const;

  return (
    <div style={styles.overlay}>
      <div style={styles.popup}>
        <button style={styles.closeButton} onClick={onClose}>×</button>
        <h2 style={{ color: popup.design.colors.text }}>
          {popup.design.content.heading}
        </h2>
        {popup.design.content.subheading && (
          <h3 style={{ color: popup.design.colors.text }}>
            {popup.design.content.subheading}
          </h3>
        )}
        {popup.design.content.body && (
          <p style={{ color: popup.design.colors.text }}>
            {popup.design.content.body}
          </p>
        )}
        <button
          style={{
            backgroundColor: popup.design.colors.primary,
            color: popup.design.colors.secondary,
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
            marginTop: '20px',
          }}
          onClick={() => onAction(popup.cta.action)}
        >
          {popup.cta.text}
        </button>
      </div>
    </div>
  );
};

export default PopupRenderer; 