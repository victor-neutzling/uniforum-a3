import { useCallback, useState } from "react";
import { Alert, Stack } from "@mui/joy";

type ToastType = "success" | "danger" | "warning" | "neutral";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "neutral") => {
      const id = Date.now();

      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 3000);
    },
    [],
  );

  const ToastContainer = () => (
    <Stack
      spacing={1}
      sx={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 9999,
        minWidth: 300,
      }}
    >
      {toasts.map((toast) => (
        <Alert key={toast.id} color={toast.type} variant="soft">
          {toast.message}
        </Alert>
      ))}
    </Stack>
  );

  return {
    showToast,
    ToastContainer,
  };
}
