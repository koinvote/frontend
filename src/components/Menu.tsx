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
import { useLanguagesStore } from "@/stores/languagesStore";
import { useThemeStore } from "@/stores/themeStore";

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
  { to: "/support", key: "menu.support", Icon: SupportIcon },
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

interface MenuItemProps {
  item: Item;
  collapsed: boolean;
  theme: string;
  onLinkClick?: () => void;
  labelClassName?: string;
}

function MenuItem({
  item,
  collapsed,
  theme,
  onLinkClick,
  labelClassName,
}: MenuItemProps) {
  const { t } = useTranslation();
  const { to, key, Icon } = item;

  const iconWrapper = (isActive: boolean) => (
    <span
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
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
  );

  if (to) {
    return (
      <NavLink
        to={to}
        aria-label={t(key)}
        className={({ isActive }) =>
          cn(
            baseLink,
            isActive && activeLink,
            collapsed ? "justify-center px-2" : "gap-3",
          )
        }
        onClick={onLinkClick}
      >
        {({ isActive }) => (
          <>
            {collapsed ? (
              <Tooltip
                placement="right"
                title={t(key)}
                color={theme === "dark" ? "#000" : "#fff"}
              >
                {iconWrapper(isActive)}
              </Tooltip>
            ) : (
              iconWrapper(isActive)
            )}
            <span className={cn(collapsed && "sr-only", labelClassName)}>
              {t(key)}
            </span>
          </>
        )}
      </NavLink>
    );
  }

  return (
    <div
      className={cn(
        baseLink,
        collapsed ? "justify-center px-2" : "gap-3",
        "cursor-pointer",
      )}
    >
      {collapsed ? (
        <Tooltip
          placement="right"
          title={t(key)}
          color={theme === "dark" ? "#000" : "#fff"}
        >
          {iconWrapper(false)}
        </Tooltip>
      ) : (
        iconWrapper(false)
      )}
      <span className={cn(collapsed && "sr-only", labelClassName)}>
        {t(key)}
      </span>
    </div>
  );
}

const Menu = ({ onItemClick, collapsed = false }: MenuProps) => {
  const { t } = useTranslation();

  const theme = useThemeStore((state) => state.theme);
  const toggle = useThemeStore((state) => state.toggle);

  const { current, setLanguage } = useLanguagesStore();
  const toggleLang = () => setLanguage(current === "en" ? "zh" : "en");

  return (
    <nav className="space-y-1">
      {items.map((item) => (
        <MenuItem
          key={item.to || item.key}
          item={item}
          collapsed={collapsed}
          theme={theme}
          onLinkClick={onItemClick}
        />
      ))}

      <Divider styles={{ root: { margin: "8px 0" } }} />
      {!collapsed && (
        <div className="mb-2 p-3 pb-0 text-xs font-medium text-neutral-500">
          {t("menu.terms", "TERMS")}
        </div>
      )}
      {termItems.map((item) => (
        <MenuItem
          key={item.to || item.key}
          item={item}
          collapsed={collapsed}
          theme={theme}
          onLinkClick={onItemClick}
          labelClassName="text-sm"
        />
      ))}

      <div className="absolute bottom-0 left-0 w-full">
        <div className="border-border border-t p-4">
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
