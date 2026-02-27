import { ConfigProvider } from "antd";
import { Suspense, useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./router";
import { getThemeConfig } from "./theme.config";

import { PageLoading } from "@/components";
import { registerToast } from "@/components/base/Toast/toast";
import { ToastProvider } from "@/components/base/Toast/ToastProvider";
import { useToast } from "@/components/base/Toast/useToast";
import {
  DEFAULT_REFRESH_INTERVAL_MS,
  useSystemParametersStore,
} from "@/stores/systemParametersStore";
import { useThemeStore } from "@/stores/themeStore";
import { version } from "../package.json";

const gaId = import.meta.env.VITE_GA_ID;

function ToastRegister() {
  const { showToast } = useToast();

  // 註冊一次即可（StrictMode 下可能會跑兩次，但覆寫同一個 handler 沒差）
  useEffect(() => {
    registerToast(showToast);
  }, [showToast]);

  return null;
}

function App() {
  const theme = useThemeStore((state) => state.theme);
  const initTheme = useThemeStore((state) => state.init);

  useEffect(() => {
    initTheme();
    useSystemParametersStore.getState().fetch();
    useSystemParametersStore
      .getState()
      .startAutoRefresh(DEFAULT_REFRESH_INTERVAL_MS); // auto refresh every 10 seconds
    return () => useSystemParametersStore.getState().stopAutoRefresh();
  }, [initTheme]);

  useEffect(() => {
    console.log(`Koinvote v${version}`);
  }, []);

  // Track SPA route changes for Google Analytics
  useEffect(() => {
    if (!window.gtag || !gaId) return;

    let lastPathname = location.pathname;

    const unsub = router.subscribe((state) => {
      const pathname = state.location.pathname;

      // 確保狀態是 idle 且路徑真的變了
      if (state.navigation.state === "idle" && pathname !== lastPathname) {
        lastPathname = pathname;

        // 使用 setTimeout 確保 document.title 已經被路由插件更新
        setTimeout(() => {
          window.gtag?.("event", "page_view", {
            page_path: pathname + state.location.search,
            page_title: document.title,
            send_to: gaId, // 明確指定發送到哪個 ID
          });
        }, 0);
      }
    });

    return unsub;
  }, []);

  // workaround: Twitter/X in-app browser 首次載入時 innerWidth 可能不準，
  // 多次觸發 resize 讓 Layout 重新讀取正確的 viewport 寬度
  useEffect(() => {
    const delays = [100, 300, 1000];
    const timers = delays.map((ms) =>
      setTimeout(() => window.dispatchEvent(new Event("resize")), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <ConfigProvider key={theme} theme={getThemeConfig(theme === "dark")}>
      <ToastProvider>
        <ToastRegister />
        <Suspense fallback={<PageLoading />}>
          <RouterProvider router={router} />
        </Suspense>
      </ToastProvider>
    </ConfigProvider>
  );
}

export default App;
