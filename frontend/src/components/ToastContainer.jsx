import { useState, useEffect } from "react";
import Toast from "./Toast";

let toastId = 0;

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Listen for custom toast events
    const handleToast = (event) => {
      const { message, type, duration } = event.detail;
      addToast(message, type, duration);
    };

    window.addEventListener("showToast", handleToast);
    return () => window.removeEventListener("showToast", handleToast);
  }, []);

  const addToast = (message, type = "success", duration = 4000) => {
    const id = ++toastId;
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-[60] space-y-3 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Utility function to show toasts from anywhere in the app
export const showToast = (message, type = "success", duration = 4000) => {
  const event = new CustomEvent("showToast", {
    detail: { message, type, duration },
  });
  window.dispatchEvent(event);
};

export default ToastContainer;
