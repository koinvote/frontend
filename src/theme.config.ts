// theme.config.ts
import type { ThemeConfig } from "antd";
import { theme } from "antd";

export const getThemeConfig = (isDark: boolean): ThemeConfig => ({
  algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  components: {
    Divider: {
      colorSplit: isDark ? "#262626" : "#262626",
    },
    Tooltip: {
      colorBgSpotlight: isDark ? "#ffffff" : "#C0C0C0",
      colorTextLightSolid: "#303133",
    },
  },
});
