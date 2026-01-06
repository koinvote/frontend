import React from "react";

const TestSafeArea: React.FC = () => {
  return (
    <div className="w-full min-h-[200vh] bg-gradient-to-b from-red-500 via-yellow-500 to-blue-500">
      <div className="p-4 text-white font-bold text-2xl pt-20">
        <p>測試頁面 (Test Safe Area)</p>
        <p className="mt-4">
          請往下滑動，觀察頂部狀態欄區域。
        </p>
        <p>
          如果狀態欄變成紅色/黃色，表示透明成功。
        </p>
        <p>
          如果狀態欄一直是黑色，表示還有黑色圖層擋住。
        </p>
      </div>
      {/* 產生大量內容以供捲動 */}
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} className="p-4 border-b border-white/20 text-white">
          Scroll Item {i + 1}
        </div>
      ))}
    </div>
  );
};

export default TestSafeArea;

