import { useState } from "react";
import { Outlet } from "react-router";
import { cn } from "@/utils/style";
import Logo from "@/assets/logo/logo.svg?react";
import MenuIcon from "@/assets/icons/menu.svg?react";

export default function LayoutTest() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    // 步驟 1: 恢復為上次成功的結構 (relative + min-h-screen)
    <div className="relative w-full min-h-screen bg-gray-900">
      {/* Header: 完全複製成功的樣式 */}
      <header
        className="absolute top-0 left-0 w-full z-50 border-b border-white/20 px-2"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="flex h-14 w-full items-center md:h-16 md:px-4 text-white">
          <button className="md:hidden p-2 mr-2" onClick={() => setOpen(!open)}>
            <MenuIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-auto" />
            <span className="font-bold">Layout Test (Restored)</span>
          </div>
        </div>
      </header>

      {/* 步驟 2: 恢復主要的容器結構 (relative + flex) */}
      <div className="relative flex w-full min-h-screen">
        {/* Sidebar (Desktop only) */}
        <aside
          className={cn(
            "hidden md:block md:shrink-0 border-r border-white/20 bg-gray-800",
            "md:sticky md:top-0 md:h-screen",
            collapsed ? "md:w-[70px]" : "md:w-[280px]"
          )}
        >
          <div className="p-4 text-white">Sidebar Content</div>
        </aside>

        {/* 
            Main Content:
            上次成功的關鍵點：
            1. bg-teal-600 是直接下在 main 標籤上 (我這裡先拿掉，讓 Outlet 的內容來決定背景)
            2. main 是 flex-1
        */}
        <main className="min-w-0 flex-1">
          {/* 這裡插入 Outlet */}
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer (為了完整性保留) */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${
          open ? "" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <button
          className={`absolute inset-0 bg-black/50 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 w-[85%] max-w-[320px] transform bg-neutral-900 p-3 shadow-2xl transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="text-white p-4">Menu</div>
        </div>
      </div>
    </div>
  );
}
