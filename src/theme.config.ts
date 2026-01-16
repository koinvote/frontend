// theme.config.ts
import type { ThemeConfig } from "antd";
import { theme } from "antd";

export const getThemeConfig = (isDark: boolean): ThemeConfig => ({
  algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  components: {
    Button: {
      colorPrimary: isDark ? "#FFFFFF" : "#FF8904",
      colorPrimaryHover: isDark ? "#FF8904" : "#FF8904",
      colorPrimaryActive: isDark ? "#0050B3" : "#0050B3",
      colorText: isDark ? "#A1A1A1" : "#717182",
      colorLink: isDark ? "#A1A1A1" : "#717182",
      colorLinkHover: isDark ? "#FF8904" : "#FF8904",
      colorLinkActive: isDark ? "#FF8904" : "#FF8904",
    },
    Divider: {
      colorSplit: isDark ? "#262626" : "#262626",
    },
    Tooltip: {
      colorBgSpotlight: isDark ? "#ffffff" : "#C0C0C0",
      colorTextLightSolid: "#303133",
    },
  },
});
