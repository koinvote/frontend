import { useState } from "react";
import { cn } from "@/utils/style";
import Logo from "@/assets/logo/logo.svg?react";
import MenuIcon from "@/assets/icons/menu.svg?react";

export default function LayoutTest() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    // 步驟 1: 模仿 Layout.tsx 的最外層結構
    <div className="relative w-full min-h-screen bg-gray-900">
      {/* Header: 完全複製 Layout.tsx 的 Header 樣式 */}
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
            <span className="font-bold">Layout Test (Step-by-Step)</span>
          </div>
        </div>
      </header>

      {/* 步驟 2: 模仿 Layout.tsx 的主要容器 (Flex + Sidebar + Main) */}
      <div className="relative flex w-full min-h-screen">
        {/* 模擬 Sidebar (Desktop only) */}
        <aside
          className={cn(
            "hidden md:block md:shrink-0 border-r border-white/20 bg-gray-800",
            "md:sticky md:top-0 md:h-screen",
            collapsed ? "md:w-[70px]" : "md:w-[280px]"
          )}
        >
          <div className="p-4 text-white">Sidebar Content</div>
        </aside>

        {/* 模擬 Main Content */}
        {/* 這裡我放一個鮮豔的背景 (bg-teal-600) 來觀察它到底延伸到哪裡 */}
        <main className="min-w-0 flex-1 bg-teal-600">
          {/* 
            為了模擬你的首頁內容，我在這裡加一點 padding-top 讓文字不要一開始就被 Header 擋住。
            但在 "真實" 情況下，如果你的首頁有 Banner，Banner 應該要頂到最上面。
          */}
          <div className="pt-20 px-4 pb-10 text-white">
            <h1 className="text-2xl font-bold mb-4">測試目標：觀察綠色背景</h1>
            <p className="mb-4">
              1. 這個綠色背景 (teal-600) 是直接上在 <code>main</code> 標籤上的。
            </p>
            <p className="mb-4">
              2. 請往下滑動：
              <br />
              - 綠色背景是否有延伸到 Header 後面？
              <br />- 綠色背景是否有延伸到最頂端（動態島）？
            </p>

            {/* 產生長內容以供捲動 */}
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="mb-4 p-4 border border-white/20 rounded">
                Test Content Row {i + 1}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
