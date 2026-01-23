// theme.config.ts
import type { ThemeConfig } from "antd";
import { theme } from "antd";

type Components = NonNullable<ThemeConfig["components"]>;
type ComponentKey = keyof Components;

// CSS variable references
const cssVar = {
  // Colors
  white: "var(--color-white)",
  black: "var(--color-black)",
  orange500: "var(--color-orange-500)", // #ff8904
  gray400: "var(--color-gray-400)", // #a1a1a1
  gray450: "var(--color-gray-450)", // #262626
  gray500: "var(--color-gray-500)", // #717182
  gray600: "var(--color-gray-600)", // #c0c0c0
  gray950: "var(--color-gray-950)", // #0a0a0a
  border: "var(--color-border)", // dark: #232428, light: #e6e6ea
  surface: "var(--color-surface)", // dark: #111214, light #f3f3f5
  btnPrimaryBgHover: "var(--btn-primary-bg-hover)", // dark: #f3f3f5, light: #ff9c2b
};

// Shared component styles (same in both themes)
const sharedComponents: ThemeConfig["components"] = {
  Input: {
    activeBorderColor: cssVar.orange500,
    hoverBorderColor: cssVar.border,
  },
  Segmented: {
    trackPadding: 4,
    trackBg: cssVar.surface,

    ".ant-segmented-thumb": {
      borderRadius: 12,
    },
  },
};

// Dark theme specific styles
const darkComponents: ThemeConfig["components"] = {
  Button: {
    // TODO: global token
    colorPrimary: cssVar.white,
    colorPrimaryBg: cssVar.white,
    colorPrimaryHover: cssVar.btnPrimaryBgHover,
    colorPrimaryActive: cssVar.btnPrimaryBgHover,
    colorText: cssVar.white,
    colorLink: cssVar.gray400,
    colorLinkHover: cssVar.orange500,
    colorLinkActive: cssVar.orange500,
    // design token
    primaryColor: cssVar.gray950,
  },
  Divider: {
    // TODO: global token
    colorSplit: cssVar.gray450,
  },
  Tooltip: {
    // TODO: global token
    colorBgSpotlight: cssVar.white,
    colorTextLightSolid: "#303133",
  },
  Segmented: {
    itemSelectedBg: cssVar.white,
    itemSelectedColor: cssVar.black,
    itemHoverColor: cssVar.gray400,
  },
};

// Light theme specific styles
const lightComponents: ThemeConfig["components"] = {
  Button: {
    colorPrimary: cssVar.orange500,
    colorPrimaryHover: cssVar.btnPrimaryBgHover,
    colorPrimaryActive: cssVar.btnPrimaryBgHover,
    colorText: cssVar.gray950,
    colorLink: cssVar.gray500,
    colorLinkHover: cssVar.orange500,
    colorLinkActive: cssVar.orange500,
  },
  Divider: {
    colorSplit: cssVar.gray450,
  },
  Tooltip: {
    colorBgSpotlight: cssVar.gray600,
    colorTextLightSolid: "#303133",
  },
};

// Merge shared and theme-specific components
const mergeComponents = (
  themeComponents: ThemeConfig["components"],
): ThemeConfig["components"] => {
  const result: Components = { ...sharedComponents };

  (Object.keys(themeComponents ?? {}) as ComponentKey[]).forEach(
    (componentName) => {
      result[componentName] = {
        ...(sharedComponents?.[componentName] ?? {}),
        ...(themeComponents?.[componentName] ?? {}),
      };
    },
  );

  return result;
};

// Export theme configurations
export const darkThemeConfig: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  components: mergeComponents(darkComponents),
};

export const lightThemeConfig: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  components: mergeComponents(lightComponents),
};

// Legacy function for backward compatibility
export const getThemeConfig = (isDark: boolean): ThemeConfig =>
  isDark ? darkThemeConfig : lightThemeConfig;
