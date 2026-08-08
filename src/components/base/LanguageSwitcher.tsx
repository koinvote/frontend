import { GlobalOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { CheckMark } from "@/components/base/CheckMark";
import { SUPPORTED_LANGUAGES, type AppLanguage } from "@/i18n";
import { useLanguagesStore } from "@/stores/languagesStore";
import { useThemeStore } from "@/stores/themeStore";

/**
 * Language picker for the menu footer.
 *
 * A two-language site could get away with a toggle whose label named the
 * *other* language ("中文" while reading English). With three it cannot, so
 * the button names the language in use and opens a menu of all of them.
 *
 * The menu opens upward: this control sits at the bottom of the desktop
 * sidebar and at the bottom of the mobile drawer, so there is never room
 * below it.
 */
export function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const { current, setLanguage } = useLanguagesStore();

  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const currentName =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === current)?.name ?? current;
  const label = t("menu.language", "Language");

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const select = (code: AppLanguage) => {
    if (code !== current) setLanguage(code);
    setIsOpen(false);
  };

  const trigger = (
    <Button
      type="link"
      size="middle"
      onClick={() => setIsOpen((open) => !open)}
      className="w-auto px-3"
      icon={<GlobalOutlined />}
      autoInsertSpace={false}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-label={`${label}: ${currentName}`}
    >
      {!collapsed && (
        <span className="inline-flex items-center">
          <span lang={current}>{currentName}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={`ml-1 shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </Button>
  );

  return (
    <div
      ref={rootRef}
      className="relative inline-block"
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !isOpen) return;
        // The drawer and the header both close on a window-level Escape. Kept
        // here, the first Escape closes only this menu and leaves the drawer
        // open where the reader left it.
        e.stopPropagation();
        setIsOpen(false);
      }}
    >
      {collapsed ? (
        <Tooltip
          placement="right"
          title={currentName}
          color={theme === "dark" ? "#000" : "#fff"}
        >
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}

      {isOpen && (
        <div
          role="menu"
          aria-label={label}
          className="border-border bg-bg absolute bottom-full left-0 z-50 mb-2 w-44 rounded-xl border py-1 shadow-lg"
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = lang.code === current;
            return (
              <button
                key={lang.code}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                // Tells the browser which script this row is, so 中文 and
                // 日本語 get their own font rather than one CJK fallback.
                lang={lang.code}
                onClick={() => select(lang.code)}
                className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-black/[0.06] dark:hover:bg-white/10 ${
                  isActive ? "text-accent font-medium" : "text-primary"
                }`}
              >
                <span>{lang.name}</span>
                {isActive && <CheckMark />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
