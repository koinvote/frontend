import { Suspense, useEffect } from "react";

import { RouterProvider } from "react-router";
import { router } from "./router";
import { PageLoading } from "@/components";
import {
  useSystemParametersStore,
  DEFAULT_REFRESH_INTERVAL_MS,
} from "@/stores/systemParametersStore";

import { ToastProvider } from "@/components/base/Toast/ToastProvider";
import { useToast } from "@/components/base/Toast/useToast";
import { registerToast } from "@/components/base/Toast/toast";

function ToastRegister() {
  const { showToast } = useToast();

  // 註冊一次即可（StrictMode 下可能會跑兩次，但覆寫同一個 handler 沒差）
  useEffect(() => {
    registerToast(showToast);
  }, [showToast]);

  return null;
}

function App() {
  useEffect(() => {
    useSystemParametersStore.getState().fetch();
    useSystemParametersStore
      .getState()
      .startAutoRefresh(DEFAULT_REFRESH_INTERVAL_MS); // auto refresh every 10 seconds
    return () => useSystemParametersStore.getState().stopAutoRefresh();
  }, []);

  return (
    <ToastProvider>
      <ToastRegister />
      <Suspense fallback={<PageLoading />}>
        <RouterProvider router={router} />
      </Suspense>
    </ToastProvider>
  );
}

export default App;
