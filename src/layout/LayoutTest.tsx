import { Outlet } from "react-router";

export default function LayoutTest() {
  return (
    // 這裡我們只放最基本的結構：
    // 一個全屏的容器，背景設為鮮豔顏色，確保能看到它是否延伸到最頂端
    <div className="w-full min-h-screen bg-teal-600 text-white">
      <div className="p-4 pt-20">
        <h1 className="text-2xl font-bold">Layout Test Container</h1>
        <p>如果這個綠色背景充滿了整個螢幕頂部（包含時間/電量），代表 Layout 容器本身沒問題。</p>
        <div className="mt-8 p-4 bg-white/20 rounded-lg">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

