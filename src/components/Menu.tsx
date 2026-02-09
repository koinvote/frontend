import { cn } from "@/utils/style";
import { GlobalOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Divider, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

import AboutIcon from "@/assets/icons/menu-about.svg?react";
import ChargesnrefundsIcon from "@/assets/icons/menu-chargenrefund.svg?react";
import PrivacyIcon from "@/assets/icons/menu-privacy.svg?react";
import RewardIcon from "@/assets/icons/menu-reward.svg?react";
import SubscribeIcon from "@/assets/icons/menu-subscribe.svg?react";
import SupportIcon from "@/assets/icons/menu-support.svg?react";
import TermsIcon from "@/assets/icons/menu-terms.svg?react";
import VerificationIcon from "@/assets/icons/menu-verificationTool.svg?react";
import { useToast } from "@/components/base/Toast/useToast";
import CONSTS from "@/consts";
import { useLanguagesStore } from "@/stores/languagesStore";
import { useThemeStore } from "@/stores/themeStore";
import { useDebouncedClick } from "@/utils/helper";

interface MenuProps {
  onItemClick?: () => void;
  collapsed?: boolean;
}

type Item = {
  to: string;
  key: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const items: Item[] = [
  { to: "/about", key: "menu.about", Icon: AboutIcon },
  { to: "/subscribe", key: "menu.subscribe", Icon: SubscribeIcon },
  {
    to: "/verification-tool",
    key: "menu.verification",
    Icon: VerificationIcon,
  },
  { to: "", key: "menu.support", Icon: SupportIcon },
];
const termItems: Item[] = [
  { to: "/charges-refunds", key: "menu.charges", Icon: ChargesnrefundsIcon },
  {
    to: "/terms-reward-distribution",
    key: "menu.termsOfRewardDistribution",
    Icon: RewardIcon,
  },

  { to: "/terms", key: "menu.termsOfService", Icon: TermsIcon },

  { to: "/privacy", key: "menu.privacy", Icon: PrivacyIcon },
];

const baseLink =
  "group flex items-center rounded-xl px-3 py-2 tx-16 lh-22 transition-colors " +
  "text-secondary hover:bg-surface/70";

const activeLink = "bg-surface text-primary";

const Menu = ({ onItemClick, collapsed = false }: MenuProps) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const theme = useThemeStore((state) => state.theme);
  const toggle = useThemeStore((state) => state.toggle);

  const { current, setLanguage } = useLanguagesStore();
  const toggleLang = () => setLanguage(current === "en" ? "zh" : "en");

  const handleSupportClick = useDebouncedClick(async () => {
    if (!CONSTS.SUPPORT_EMAIL) return;

    try {
      await navigator.clipboard.writeText(CONSTS.SUPPORT_EMAIL);
      showToast(
        "success",
        t(
          "support.copyEmailSuccess",
          "Support email copied: support@koinvote.com",
        ),
      );
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast(
        "error",
        t(
          "common.failedToCopyText",
          "Failed to copy support email: support@koinvote.com",
        ),
      );
    }
  });

  return (
    <nav className="space-y-1">
      {items.map(({ to, key, Icon }) =>
        to ? (
          <NavLink
            key={to}
            to={to}
            aria-label={t(key)}
            className={({ isActive }) =>
              cn(
                baseLink,
                isActive && activeLink,
                collapsed ? "justify-center px-2" : "gap-3",
              )
            }
            onClick={onItemClick}
          >
            {({ isActive }) => (
              <>
                {collapsed ? (
                  <Tooltip
                    placement="right"
                    title={t(key)}
                    color={theme === "dark" ? "#000" : "#fff"}
                  >
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                        "text-current",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5! w-5!",
                          isActive ? "text-primary" : "text-secondary",
                        )}
                        style={{
                          width: "1.25rem",
                          height: "1.25rem",
                        }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                      "text-current",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5! w-5!",
                        isActive ? "text-primary" : "text-secondary",
                      )}
                      style={{ width: "1.25rem", height: "1.25rem" }}
                    />
                  </span>
                )}
                <span className={cn(collapsed && "sr-only")}>{t(key)}</span>
              </>
            )}
          </NavLink>
        ) : (
          <div
            className={cn(
              baseLink,
              collapsed ? "justify-center px-2" : "gap-3",
              `cursor-pointer`,
            )}
            key={key}
            onClick={handleSupportClick}
          >
            {collapsed ? (
              <Tooltip
                placement="right"
                title={t(key)}
                color={theme === "dark" ? "#000" : "#fff"}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                    "text-current",
                  )}
                >
                  <Icon
                    className="h-5! w-5! text-secondary"
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                    }}
                  />
                </span>
              </Tooltip>
            ) : (
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                  "text-current",
                )}
              >
                <Icon
                  className="h-5! w-5! text-secondary"
                  style={{ width: "1.25rem", height: "1.25rem" }}
                />
              </span>
            )}
            <span className={cn(collapsed && "sr-only")}>{t(key)}</span>
          </div>
        ),
      )}

      <Divider styles={{ root: { margin: "8px 0" } }} />
      {!collapsed && (
        <div className="p-3 pb-0 mb-2 text-xs text-neutral-500 font-medium">
          {t("menu.terms", "TERMS")}
        </div>
      )}
      {termItems.map(({ to, key, Icon }) =>
        to ? (
          <NavLink
            key={to}
            to={to}
            aria-label={t(key)}
            className={({ isActive }) =>
              cn(
                baseLink,
                isActive && activeLink,
                collapsed ? "justify-center px-2" : "gap-3",
              )
            }
            onClick={onItemClick}
          >
            {({ isActive }) => (
              <>
                {collapsed ? (
                  <Tooltip
                    placement="right"
                    title={t(key)}
                    color={theme === "dark" ? "#000" : "#fff"}
                  >
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                        "text-current",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5! w-5!",
                          isActive ? "text-primary" : "text-secondary",
                        )}
                        style={{
                          width: "1.25rem",
                          height: "1.25rem",
                        }}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                      "text-current",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5! w-5!",
                        isActive ? "text-primary" : "text-secondary",
                      )}
                      style={{ width: "1.25rem", height: "1.25rem" }}
                    />
                  </span>
                )}
                <span className={cn(collapsed && "sr-only", "text-sm")}>
                  {t(key)}
                </span>
              </>
            )}
          </NavLink>
        ) : (
          <div
            className={cn(
              baseLink,
              collapsed ? "justify-center px-2" : "gap-3",
              `cursor-pointer`,
            )}
            key={key}
            onClick={handleSupportClick}
          >
            {collapsed ? (
              <Tooltip
                placement="right"
                title={t(key)}
                color={theme === "dark" ? "#000" : "#fff"}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                    "text-current",
                  )}
                >
                  <Icon
                    className="h-5! w-5! text-secondary"
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                    }}
                  />
                </span>
              </Tooltip>
            ) : (
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-md shrink-0",
                  "text-current",
                )}
              >
                <Icon
                  className="h-5! w-5! text-secondary"
                  style={{ width: "1.25rem", height: "1.25rem" }}
                />
              </span>
            )}
            <span className={cn(collapsed && "sr-only")}>{t(key)}</span>
          </div>
        ),
      )}

      <div className="absolute bottom-0 left-0 w-full">
        <div className="p-4 border-t border-border">
          {collapsed ? (
            <div>
              <Tooltip
                placement="right"
                title={current === "en" ? "EN" : "中文"}
                color={theme === "dark" ? "#000" : "#fff"}
              >
                <Button
                  type="link"
                  size="middle"
                  onClick={toggleLang}
                  className="w-auto px-3"
                  icon={<GlobalOutlined />}
                  autoInsertSpace={false}
                ></Button>
              </Tooltip>
              <Tooltip
                placement="right"
                title={theme === "dark" ? t("menu.light") : t("menu.dark")}
                color={theme === "dark" ? "#000" : "#fff"}
              >
                <Button
                  type="link"
                  size="middle"
                  onClick={toggle}
                  className="w-auto px-3"
                  icon={theme === "dark" ? <SunOutlined /> : <MoonOutlined />}
                  autoInsertSpace={false}
                ></Button>
              </Tooltip>
            </div>
          ) : (
            <div>
              <Button
                type="link"
                size="middle"
                onClick={toggleLang}
                className="w-auto px-3"
                icon={<GlobalOutlined />}
                autoInsertSpace={false}
              >
                {current === "en" ? "EN" : "中文"}
              </Button>
              <Button
                type="link"
                size="middle"
                onClick={toggle}
                className="w-auto px-3"
                icon={theme === "dark" ? <SunOutlined /> : <MoonOutlined />}
                autoInsertSpace={false}
              >
                {theme === "dark" ? t("menu.light") : t("menu.dark")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Menu;
