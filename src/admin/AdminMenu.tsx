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
  // { to: "/admin/system-setting", label: "系統設定" },
  // { to: '/admin/announcements', label: '公告管理' },
  // { to: '/admin/subscribers',  label: '訂閱者 email 匯出' },
];

const baseLink =
  "block rounded-[4px] px-4 py-2 tx-14 lh-20 text-admin-text-sub hover:bg-white/70 transition-colors";
const activeLink = "bg-white text-admin-text-main font-semibold";

export default function AdminMenu() {
  return (
    <nav className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cn(baseLink, isActive && activeLink)}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
