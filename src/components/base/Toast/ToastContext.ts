// src/components/base/Toast/ToastContext.ts
import { createContext } from "react";

export type ToastType = "success" | "fail" | "error" | "warn";

export type ToastContextType = {
  showToast: (type: ToastType, message: string, duration?: number) => void;
};

export const ToastContext = createContext<ToastContextType | null>(null);
