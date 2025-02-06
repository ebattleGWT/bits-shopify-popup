import { PopupConfig } from "../types/popup";

export async function createPopup(popup: Omit<PopupConfig, 'id' | 'shopId' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch('/api/popups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(popup),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create popup');
  }

  return response.json();
}

export async function getPopups() {
  const response = await fetch('/api/popups');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch popups');
  }

  return response.json();
} 