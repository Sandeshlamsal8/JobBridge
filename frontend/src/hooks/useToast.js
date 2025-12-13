import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState({ 
    isVisible: false, 
    message: "", 
    type: "success" 
  });

  const showToast = (message, type = "success") => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const showSuccess = (message) => showToast(message, "success");
  const showError = (message) => showToast(message, "error");
  const showInfo = (message) => showToast(message, "info");
  const showWarning = (message) => showToast(message, "warning");

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
}