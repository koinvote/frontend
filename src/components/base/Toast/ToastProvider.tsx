// src/components/base/Toast/ToastProvider.tsx
import { message } from "antd";
import { useCallback, type ReactNode } from "react";

import { ToastContext, type ToastType } from "./ToastContext";

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messageApi, contextHolder] = message.useMessage();

  const showToast = useCallback(
    (type: ToastType, msg: string, duration?: number) => {
      const durationInSeconds = duration ? duration / 1000 : 3;

      switch (type) {
        case "success":
          messageApi.success(msg, durationInSeconds);
          break;
        case "fail":
        case "error":
          messageApi.error(msg, durationInSeconds);
          break;
        case "warn":
          messageApi.warning(msg, durationInSeconds);
          break;
        default:
          messageApi.info(msg, durationInSeconds);
      }
    },
    [messageApi],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {contextHolder}
      {children}
    </ToastContext.Provider>
  );
}
