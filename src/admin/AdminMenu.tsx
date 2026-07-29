import { cn } from "@/utils/style";
import { NavLink } from "react-router";

type Item = {
  to: string;
  label: string;
};

const items: Item[] = [
  { to: "/admin/reward-rules", label: "獎金與派獎規則" },
  { to: "/admin/fees", label: "手續費相關" },
  { to: "/admin/refunds", label: "退款相關" },
  { to: "/admin/withdrawal", label: "提款相關" },
  { to: "/admin/referral-codes", label: "推薦碼管理" },
  { to: "/admin/passkeys", label: "通行金鑰" },
  // { to: '/admin/announcements', label: '公告管理' },
  // { to: '/admin/subscribers',  label: '訂閱者 email 匯出' },
];

const baseLink =
  "rounded-[4px] px-4 py-2 tx-14 lh-20 text-admin-text-sub hover:bg-white/70 transition-colors";
const activeLink = "bg-white text-admin-text-main font-semibold";

interface AdminMenuProps {
  /**
   * "sidebar" is the vertical list inside the desktop aside.
   * "tabs" is the horizontal scrolling strip shown under the header on phones.
   */
  variant?: "sidebar" | "tabs";
}

export default function AdminMenu({ variant = "sidebar" }: AdminMenuProps) {
  if (variant === "tabs") {
    return (
      // A <nav>, deliberately not a <main>/<section>: global.css forces
      // max-width:100vw + overflow-x:hidden on those under 767px, which would
      // clip this strip instead of letting it scroll.
      //
      // No gap-* here either. Items space themselves with their own px-4,
      // which doubles as a ~100px tap target and keeps the strip out of the
      // old-iOS flex-gap fallback entirely.
      <nav className="admin-tabstrip bg-admin-card flex shrink-0 overflow-x-auto border-b border-neutral-200 px-2 py-2 md:hidden">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(baseLink, "shrink-0 whitespace-nowrap", isActive && activeLink)
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(baseLink, "block", isActive && activeLink)
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
