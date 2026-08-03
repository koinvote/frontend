import ComputerIcon from "@/assets/icons/computer.svg?react";
import LogoutIcon from "@/assets/icons/logout.svg?react";
import ProfileIcon from "@/assets/icons/profile.svg?react";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router";

import AdminMenu from "@/admin/AdminMenu";
import { AdminAPI } from "@/api";
import { isTokenExpired, subscribeSessionExpired } from "@/api/adminSession";
import { getAdminToken, removeAdminToken } from "@/api/http";
import Logo from "@/assets/logo/logo.svg?react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const token = getAdminToken();
  // A token whose own `exp` has passed is already worthless, so the probe
  // request below is skipped entirely: no request, no 401, nothing flashing
  // between the URL and the login form.
  const staleToken = !!token && isTokenExpired(token);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // A 401 from anywhere under this layout lands here, so the redirect stays a
  // router transition instead of a full page reload.
  useEffect(() => subscribeSessionExpired(() => setSessionExpired(true)), []);

  useEffect(() => {
    if (staleToken) removeAdminToken();
  }, [staleToken]);

  useEffect(() => {
    if (!token || staleToken) return;
    AdminAPI.getSystemParameters()
      .then(() => setAuthChecked(true))
      .catch(() => {
        // A 401 arrives via subscribeSessionExpired above. Anything else (a
        // network blip, a 500) leaves the layout unrendered rather than
        // showing an admin shell we could not authenticate.
      });
  }, [token, staleToken]);

  // Expiry is checked before the plain "no token" case on purpose: a 401 has
  // already cleared the token by the time this re-renders, and the two would
  // otherwise be indistinguishable — losing the reason the admin was sent back.
  if (staleToken || sessionExpired)
    return (
      <Navigate to="/admin/login" replace state={{ sessionExpired: true }} />
    );
  if (!token) return <Navigate to="/admin/login" replace />;
  if (!authChecked) return null;

  const handleLogout = () => {
    removeAdminToken();
    navigate("/admin/login");
  };

  return (
    // Responsiveness here is CSS-only on purpose. The public site branches on
    // `isDesktop` from homeStore, but that value is only ever set by a resize
    // listener in Layout.tsx, and Layout never mounts on /admin — it is a
    // sibling route. Reading it here would render the mobile branch on desktop.
    <div
      className="bg-admin-bg text-admin-text-main flex min-h-screen flex-col"
      style={{
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {/* Top bar. The safe-area padding sits on the outer element rather than
          the fixed-height row: preflight makes everything border-box, so
          padding on the h-12 box would squash its contents instead of pushing
          it clear of the status bar. Mirrors src/layout/Header.tsx:74-78. */}
      <header
        className="shrink-0 border-b border-neutral-200 bg-white"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-12 items-center justify-between gap-2 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Logo className="h-5 w-5 shrink-0" />
            <span className="fw-m tx-16 md:tx-18 truncate">Admin 後台管理</span>
          </div>

          <div className="tx-14 flex shrink-0 items-center gap-3 md:gap-4">
            <button
              type="button"
              aria-label="切換至前台"
              title="切換至前台"
              className="text-admin-text-sub hover:text-admin-text-main flex cursor-pointer items-center gap-1 transition-colors"
              onClick={() => (window.location.href = "/")}
            >
              <ComputerIcon className="h-5 w-5 shrink-0" />
              <span className="hidden md:inline">切換至前台</span>
            </button>

            {/* One admin, one account: the identity chip earns no space on a
                phone, where every pixel is contested. */}
            <div className="hidden items-center gap-1 md:flex">
              <span>
                <ProfileIcon className="h-5 w-5" />
              </span>
              <span className="text-admin-text-sub">Admin</span>
            </div>

            <button
              type="button"
              aria-label="登出"
              title="登出"
              className="tx-14 text-admin-text-sub hover:text-admin-text-main flex cursor-pointer items-center gap-1"
              onClick={handleLogout}
            >
              <LogoutIcon className="h-5 w-5 shrink-0" />
              <span className="hidden md:inline">登出</span>
            </button>
          </div>
        </div>
      </header>

      {/* Phone navigation: the sidebar collapses into a scrolling tab strip. */}
      <AdminMenu variant="tabs" />

      {/* flex-1 replaces min-h-[calc(100vh-48px)]. The row inherits the
          remaining height from the min-h-screen column, so there is no raw
          100vh — which on iOS reports the toolbar-collapsed viewport — and no
          need for a new .min-h-dvh-* helper (those are plain classes, not
          @utility, so they cannot carry an md: variant anyway). */}
      <div className="flex flex-1">
        <aside className="bg-admin-card hidden w-56 shrink-0 overflow-y-auto border-neutral-200 px-4 py-20 md:block">
          <AdminMenu />
        </aside>

        {/* min-w-0 is the fix for the row overflowing the viewport: without it
            a flex item's min-width resolves to min-content, so the content
            column refuses to shrink and pushes the layout wider than the
            screen. Mirrors src/layout/Layout.tsx:141. */}
        <main
          className="bg-admin-surface min-w-0 flex-1"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
