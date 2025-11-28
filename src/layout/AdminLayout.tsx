import { Outlet } from 'react-router'
import AdminMenu from '@/admin/AdminMenu'
import Logo from '@/assets/logo/logo.svg?react'

import ComputerIcon from '@/assets/icons/computer.svg?react'
import ProfileIcon from '@/assets/icons/profile.svg?react'
import LogoutIcon from '@/assets/icons/logout.svg?react'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-admin-bg text-admin-text-main">
      {/* Top bar */}
      <header className="h-12 flex items-center justify-between px-6 border-b border-admin-border bg-white">
        <div className="flex items-center gap-2">
          <Logo className="h-5 w-5" />
          <span className="fw-m tx-18">Admin 後台管理</span>
        </div>

        <div className="flex items-center gap-4 tx-14">
          <button
            type="button"
            className="flex items-center gap-1 text-admin-text-sub hover:text-admin-text-main transition-colors cursor-pointer"
            onClick={() => window.location.href = '/'}
          >
            <ComputerIcon className="w-5 h-5" />
            切換至前台
          </button>
          <div className="flex items-center gap-1">
            <span><ProfileIcon className="w-5 h-5" /></span>
            <span className="text-admin-text-sub">Admin</span>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 tx-14 text-admin-text-sub hover:text-admin-text-main cursor-pointer"
          >
            <LogoutIcon className="w-5 h-5" />
            登出
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex min-h-screen">
        {/* 左側 menu 區 */}
        <aside className="w-56 overflow-y-auto shrink-0 border-admin-border bg-admin-card px-4 py-20">
          <AdminMenu />
        </aside>

        {/* 右側內容區 */}
        <main className="flex-1 bg-admin-surface">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
