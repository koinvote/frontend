// src/components/base/Toast.tsx
import { useEffect } from "react";
import { cn } from "@/utils/style";

export type ToastType = "success" | "fail" | "error" | "warn";

export type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
};

interface ToastProps {
  toast: ToastItem;
  onClose: (id: number) => void;
}

const TYPE_STYLE: Record<ToastType, string> = {
  success: "bg-green-600 text-white",
  fail: "bg-red-500 text-white",
  error: "bg-red-700 text-white",
  warn: "bg-orange-500 text-black",
};

export function Toast({ toast, onClose }: ToastProps) {
  const { id, type, message, duration = 3000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl shadow-lg",
        "tx-14 lh-20",
        "w-fit",
        TYPE_STYLE[type]
      )}
    >
      <div className="flex items-center justify-center gap-3">
        <span>{message}</span>
        <button
          onClick={() => onClose(id)}
          className="opacity-80 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
