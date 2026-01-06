import { useState } from "react";
import { Outlet } from "react-router";
import Logo from "@/assets/logo/logo.svg?react";
import MenuIcon from "@/assets/icons/menu.svg?react";

export default function LayoutTest() {
  const [open, setOpen] = useState(false);

  return (
    // 1. 最外層容器：全屏，背景色 (模擬有背景色的頁面)
    <div className="relative w-full min-h-screen bg-teal-600 text-white">
      {/* 2. Header: 絕對定位，Top 0 */}
      <header
        className="absolute top-0 left-0 w-full z-50 border-b border-white/20 px-2"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.2)", // 半透明背景
          backdropFilter: "blur(12px)", // 模糊效果
          WebkitBackdropFilter: "blur(12px)",
          paddingTop: "env(safe-area-inset-top)", // 避開動態島
        }}
      >
        <div className="flex h-14 w-full items-center md:h-16 md:px-4">
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            <MenuIcon className="w-6 h-6 text-white" />
          </button>
          <div className="ml-2 flex items-center gap-2">
            <Logo className="h-8 w-auto text-white" />
            <span className="font-bold text-lg">Layout Test</span>
          </div>
        </div>
      </header>

      {/* 3. 頁面內容區域 */}
      {/* 注意：這裡沒有加 pt-safe-area，因為我們要讓內容「可以」滾動到 Header 後面 */}
      {/* 但為了不讓一開始的內容被擋住，我們加一個頂部 Padding */}
      <div className="w-full">
        {/* 模擬很多內容以便滾動 */}
        <div className="pt-24 px-4 pb-10">
          <h1 className="text-3xl font-bold mb-4">捲動測試</h1>
          <p className="mb-8 text-lg opacity-90">
            請往上捲動，觀察 Header 背景是否模糊，且內容是否能穿過動態島區域。
          </p>

          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="mb-4 p-6 bg-white/10 rounded-xl border border-white/10"
            >
              <h2 className="text-xl font-semibold mb-2">Card Item {i + 1}</h2>
              <p className="opacity-70">
                This is some dummy content to make the page scrollable. We want
                to ensure this content flows smoothly behind the sticky/fixed
                header and reaches the very top of the screen (the Dynamic
                Island area).
              </p>
            </div>
          ))}
        </div>

        <Outlet />
      </div>
    </div>
  );
}
