import { useState } from "react";
import { cn } from "@/utils/style";
import Logo from "@/assets/logo/logo.svg?react";
import MenuIcon from "@/assets/icons/menu.svg?react";

export default function LayoutTest() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    // Root Container
    <div className="relative w-full min-h-screen bg-gray-900">
      {/* Header */}
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
            <span className="font-bold">Layout Test (Hardcoded Nested)</span>
          </div>
        </div>
      </header>

      {/* Main Flex Container */}
      <div className="relative flex w-full min-h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            "hidden md:block md:shrink-0 border-r border-white/20 bg-gray-800",
            "md:sticky md:top-0 md:h-screen",
            collapsed ? "md:w-[70px]" : "md:w-[280px]"
          )}
        >
          <div className="p-4 text-white">Sidebar</div>
        </aside>

        {/* 
            Main Content Area 
            這一次，我們把背景顏色從 main 拿掉。
            並在裡面放一個 div 來模擬 Outlet 出來的頁面。
            
            如果這個結構出現 "白條" 或 "黑邊"，那麼我們就找到了問題所在：
            問題在於 "多一層 div" (Nesting) 導致的佈局變化。
        */}
        <main className="min-w-0 flex-1 border-2 border-red-500 relative">
          {/* 這是模擬的 Page Component */}
          <div className="w-full min-h-screen bg-teal-600 text-white">
            <div className="pt-20 px-4 pb-10">
              <h1 className="text-2xl font-bold mb-4">
                Nested Content Simulation
              </h1>
              <p className="mb-4">
                這個綠色背景是在 main 內部的一層 div 上。
                <br />
                紅色邊框是 main 的範圍。
              </p>
              <p>
                1. 紅色邊框是否貼頂？
                <br />
                2. 綠色背景是否貼頂？
              </p>
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="mb-4 p-4 border border-white/20 rounded"
                >
                  Content Row {i + 1}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile drawer */}
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
        <div className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-neutral-900 p-3">
          <div className="text-white">Menu</div>
        </div>
      </div>
    </div>
  );
}
