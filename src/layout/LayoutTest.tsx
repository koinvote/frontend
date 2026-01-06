import { useState } from "react";
import { Outlet } from "react-router"; // Import Outlet
import { cn } from "@/utils/style";
import Logo from "@/assets/logo/logo.svg?react";
import MenuIcon from "@/assets/icons/menu.svg?react";
import RightArrow from "@/assets/icons/rightArrow.svg?react";
import LeftArrow from "@/assets/icons/leftArrow.svg?react";

export default function LayoutTest() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Helper to mimic Layout.tsx Menu
  const MockMenu = () => (
    <div className="text-white p-4">
      <div className="mb-4">Menu Item 1</div>
      <div className="mb-4">Menu Item 2</div>
      <div className="mb-4">Menu Item 3</div>
    </div>
  );

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
            <span className="font-bold">Layout Test (With Outlet)</span>
          </div>
        </div>
      </header>

      {/* Main Flex Container */}
      <div className="relative flex w-full min-h-screen">
        {/* Full-height divider line (Desktop) */}
        <div
          className="absolute left-0 top-0 bottom-0 hidden md:block w-px bg-white/20 pointer-events-none z-0"
          style={{
            left: collapsed ? "70px" : "280px",
            transition: "left 200ms ease-out",
          }}
        />

        {/* Sidebar (Desktop) */}
        <aside
          className={cn(
            "hidden md:block md:shrink-0 border-r border-white/20 bg-gray-800",
            // Note: mimicking Layout.tsx sticky behavior exactly
            "md:sticky md:top-[calc(4rem+env(safe-area-inset-top))]",
            "md:h-[calc(100dvh-4rem-env(safe-area-inset-top))]",
            "md:backdrop-blur",
            "transition-[width] duration-200 ease-out",
            collapsed ? "md:w-[70px]" : "md:w-[280px]"
          )}
        >
          <div
            className={cn(
              "h-full overflow-y-auto py-2",
              collapsed ? "px-0" : "px-2"
            )}
          >
            <MockMenu />
          </div>
        </aside>

        {/* Sidebar Toggle (Desktop) */}
        <div className="relative hidden md:block md:sticky md:top-[calc(4rem+env(safe-area-inset-top))] md:h-[calc(100dvh-4rem-env(safe-area-inset-top))] w-px z-10">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 mt-3",
              "inline-flex h-8 w-8 items-center justify-center rounded-2xl",
              "border border-white/20 bg-gray-700 text-white",
              "shadow cursor-pointer"
            )}
          >
            {collapsed ? <RightArrow /> : <LeftArrow />}
          </button>
        </div>

        {/* Main Content Area */}
        {/* 
            Update: Added 'flex flex-col relative' 
            Added debug border (red) to see where 'main' actually starts.
        */}
        <main className="min-w-0 flex-1 flex flex-col relative border-2 border-red-500">
          {/* Outlet Renders Here */}
          <Outlet />
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
        <div
          className={`absolute inset-y-0 left-0 w-[85%] max-w-[320px] transform bg-neutral-900 p-3 shadow-2xl transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-2 flex items-center justify-between text-white">
            <span className="text-base font-semibold">Menu</span>
            <button onClick={() => setOpen(false)} className="p-2">
              Close
            </button>
          </div>
          <MockMenu />
        </div>
      </div>
    </div>
  );
}
