// src/components/base/Toast/toast.ts
import type { ToastType } from "./ToastContext";

type ToastHandler = (
  type: ToastType,
  message: string,
  duration?: number
) => void;

let handler: ToastHandler | null = null;

export function registerToast(fn: ToastHandler) {
  handler = fn;
}

export function toast(type: ToastType, message: string, duration?: number) {
  if (!handler) {
    console.warn("Toast handler not registered");
    return;
  }
  handler(type, message, duration);
}
