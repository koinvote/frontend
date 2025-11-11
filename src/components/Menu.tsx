import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/style";

import AboutIcon from "@/assets/icons/menu-about.svg?react";
import SupportIcon from "@/assets/icons/menu-support.svg?react";
import TermsIcon from "@/assets/icons/menu-terms.svg?react";
import PrivacyIcon from "@/assets/icons/menu-privacy.svg?react";
// import ChargesnrefundsIcon from "@/assets/icons/menu_chargesnrefunds.svg?react";
import SubscribeIcon from "@/assets/icons/menu-subscribe.svg?react";
import HelpnFaqIcon from "@/assets/icons/menu-helpFaq.svg?react";
import VerificationIcon from "@/assets/icons/menu-verificationTool.svg?react";

interface MenuProps {
  onItemClick?: () => void
  collapsed?: boolean
}

type Item = { 
  to: string; 
  key: string; 
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> 
}

const items: Item[] = [
  { to: '/about',           key: 'menu.about',        Icon: AboutIcon },
  { to: '/support',         key: 'menu.support',      Icon: SupportIcon },
  { to: '/verification-tool',    key: 'menu.verification', Icon: VerificationIcon },
  { to: '/terms',           key: 'menu.terms',        Icon: TermsIcon },
  { to: '/privacy',         key: 'menu.privacy',      Icon: PrivacyIcon },
  { to: '/charges-refunds', key: 'menu.charges',      Icon: PrivacyIcon },
  { to: '/subscribe',       key: 'menu.subscribe',    Icon: SubscribeIcon },
  { to: '/help-faq',        key: 'menu.help',         Icon: HelpnFaqIcon },
]

const baseLink =
  'group flex items-center rounded-xl px-3 py-2 tx-16 lh-22 transition-colors ' +
  'text-secondary hover:bg-surface/70'

const activeLink =
  'bg-surface text-primary'


const Menu = ({ onItemClick, collapsed = false }: MenuProps) => {
  const { t } = useTranslation();

  return (
    <nav className="space-y-1">
      {items.map(({ to, key, Icon }) => (
        <NavLink
          key={to}
          to={to}
          aria-label={t(key)}
          className={({ isActive }) =>
            cn(baseLink, isActive && activeLink, collapsed ? 'justify-center px-2' : 'gap-3')
          }
          onClick={onItemClick}
        >
          <span
            className={cn(
              'inline-flex h-6 w-6 items-center justify-center rounded-md shrink-0',
              'text-current'
            )}
          >
            <Icon className="h-5 w-5" />
          </span>

          <span className={cn(collapsed && 'sr-only')}>{t(key)}</span>
        </NavLink>
      ))}
    </nav>
  )

};

export default Menu;
