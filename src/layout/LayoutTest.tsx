import { useState } from "react";
import { cn } from "@/utils/style";
import Logo from "@/assets/logo/logo.svg?react";
import MenuIcon from "@/assets/icons/menu.svg?react";

export default function LayoutTest() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    // 步驟 1: 模仿 "成功版" 的 Layout 結構，但這次我們強制調整 Main 的行為
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
            <span className="font-bold">Layout Test (Full Screen Main)</span>
          </div>
        </div>
      </header>

      {/* 
         關鍵修正：
         如果 Sidebar 導致 Main 被擠壓或移位，我們試著在 Mobile 上完全隱藏 Sidebar 的 DOM 結構，
         或者改變 Main 的 positioning 策略。
         
         這裡我嘗試一個比較激進的做法：
         讓 Main 變成 Absolute 覆蓋全屏 (在 Mobile 上)，這樣它就會無視 Flex 帶來的副作用。
      */}
      <div className="relative flex w-full min-h-screen">
        {/* Sidebar (只在 md 以上渲染，避免干擾手機版佈局) */}
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
            修正策略：
            1. 在 Mobile (md:hidden) 上，我們不依賴 flex-1 自動佈局，而是直接 w-full。
            2. 關鍵：加上 -mt-[safe-area] 或類似的負 margin 試試看？ 
               不，我們先試試看最單純的：確保沒有任何父層 padding。
               
            觀察你的截圖，Sidebar 居然跑出來了？這代表 md:hidden 沒生效？
            喔！你的截圖看起來像是橫向捲動了？
            
            不，Sidebar 是黑色的，你的截圖左邊是一大片黑色的，右邊才是綠色的。
            這代表 flex 佈局生效了，但是 Sidebar 佔據了左邊的位置（即使它是 hidden??）。
            
            等等，如果 Sidebar 是 "hidden md:block"，那在手機上它應該 display: none，不佔空間。
            如果你看得到黑色 Sidebar，那代表 CSS 沒生效，或者 tailwind 配置有問題？
            
            讓我們再次確認 "成功版" 的代碼。成功版也有 Sidebar。
            
            這次我把 Sidebar 的 DOM 直接拿掉 (用 && 渲染)，確保它不會干擾。
        */}

        {/* 只在 Desktop 渲染 Sidebar 佔位符，確保 Mobile 完全乾淨 */}
        <div className="hidden md:block w-[280px]"></div>

        <main className="min-w-0 flex-1 relative border-2 border-red-500">
          {/* 
              這裡我再次把背景色放在 Main 上，這是唯一一次成功的模式。
              我們必須確認：到底是 "Nested Div" 導致失敗，還是 "Sidebar" 導致失敗。
           */}
          <div className="absolute inset-0 bg-teal-600 z-0"></div>

          <div className="relative z-10 pt-24 px-4 text-white">
            <h1 className="text-2xl font-bold">Debug Mode</h1>
            <p>Sidebar DOM is removed on mobile.</p>
            <p>Background is absolute inset-0.</p>
          </div>
        </main>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[240px] bg-gray-800 p-4 text-white">
            Drawer Menu
          </div>
        </div>
      )}
    </div>
  );
}
