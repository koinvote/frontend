import ComputerIcon from "@/assets/icons/computer.svg?react";
import LogoutIcon from "@/assets/icons/logout.svg?react";
import ProfileIcon from "@/assets/icons/profile.svg?react";
import { Outlet, useNavigate } from "react-router";

import AdminMenu from "@/admin/AdminMenu";
import { removeAdminToken } from "@/api/http";
import Logo from "@/assets/logo/logo.svg?react";

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeAdminToken();
    navigate("/admin/login");
  };

  return (
    <div className="bg-admin-bg text-admin-text-main min-h-screen">
      {/* Top bar */}
      <header className="flex h-12 items-center justify-between border-b border-neutral-200 bg-white px-6">
        <div className="flex items-center gap-2">
          <Logo className="h-5 w-5" />
          <span className="fw-m tx-18">Admin 後台管理</span>
        </div>

        <div className="tx-14 flex items-center gap-4">
          <button
            type="button"
            className="text-admin-text-sub hover:text-admin-text-main flex cursor-pointer items-center gap-1 transition-colors"
            onClick={() => (window.location.href = "/")}
          >
            <ComputerIcon className="h-5 w-5" />
            切換至前台
          </button>
          <div className="flex items-center gap-1">
            <span>
              <ProfileIcon className="h-5 w-5" />
            </span>
            <span className="text-admin-text-sub">Admin</span>
          </div>
          <button
            type="button"
            className="tx-14 text-admin-text-sub hover:text-admin-text-main flex cursor-pointer items-center gap-1"
            onClick={handleLogout}
          >
            <LogoutIcon className="h-5 w-5" />
            登出
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex min-h-screen">
        {/* 左側 menu 區 */}
        <aside className="bg-admin-card w-56 shrink-0 overflow-y-auto border-neutral-200 px-4 py-20">
          <AdminMenu />
        </aside>

        {/* 右側內容區 */}
        <main className="bg-admin-surface flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
