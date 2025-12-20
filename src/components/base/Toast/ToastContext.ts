// src/components/base/Toast/ToastContext.ts
import { createContext } from "react";
import type { ToastType } from "./Toast.tsx";

export type ToastContextType = {
  showToast: (type: ToastType, message: string, duration?: number) => void;
};

export const ToastContext = createContext<ToastContextType | null>(null);
