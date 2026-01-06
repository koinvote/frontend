import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router";

import Menu from "../components/Menu";
import { Button } from "../components/base/Button";
import { cn } from "@/utils/style";

import Logo from "@/assets/logo/logo.svg?react";
import LanguagesEarth from "@/assets/icons/languages-earth.svg?react";
import RightArrow from "@/assets/icons/rightArrow.svg?react";
import LeftArrow from "@/assets/icons/leftArrow.svg?react";
import ModeLight from "@/assets/icons/mode-light.svg?react";
import ModeDark from "@/assets/icons/mode-dark.svg?react";
import MenuIcon from "@/assets/icons/menu.svg?react";

import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { useLanguagesStore } from "@/stores/languagesStore";

export default function Layout() {
  const [open, setOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop sidebar
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const { current, setLanguage } = useLanguagesStore();
  const toggleLang = () => setLanguage(current === "en" ? "zh" : "en");
  const navigate = useNavigate();
  const location = useLocation();

  // Handle window resize to auto-close drawer on desktop
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) {
        setOpen(false);
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    // 1. Root Container
    <div className="relative w-full min-h-screen">
      {/* 2. Header */}
      <header
        className="absolute top-0 left-0 w-full z-50 border-b border-border px-2 text-(--color-primary)"
        style={{
          backgroundColor: "var(--header-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="flex h-14 w-full items-center md:h-16 md:px-4">
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex items-center justify-center rounded-md md:hidden"
            onClick={() => setOpen(true)}
          >
            <MenuIcon className="w-6 h-6" />
          </button>

          <div className="flex flex-1 items-center justify-start ml-2 md:ml-0">
            <Link to="/" className="flex items-center gap-2">
              <span>
                <Logo />
              </span>
              <span className="text-lg font-semibold tracking-wide md:text-xl">
                {t("layout.title")}
              </span>
            </Link>
          </div>

          <div className="ml-2 flex items-center gap-2">
            <Button size="md" onClick={toggleLang} className="w-auto px-3">
              <LanguagesEarth className="mr-2" />
              <span className="tx-12">{current === "en" ? "EN" : "中文"}</span>
            </Button>
            <Button size="md" onClick={toggle} className="w-auto px-3">
              {theme === "dark" ? <ModeLight /> : <ModeDark />}
              <span className="tx-12">
                {theme === "dark" ? "Light" : "Dark"}
              </span>
            </Button>
            <Button
              size="md"
              text="sm"
              block={false}
              className="w-auto md:w-[140px] md:tx-14 lg:tx-16"
              onClick={() => {
                if (location.pathname === "/create-event") {
                  sessionStorage.setItem("fromCreateEvent", "true");
                  navigate("/");
                } else {
                  navigate("/create-event");
                }
              }}
            >
              <span className="md:hidden">{t("layout.createEvent")}</span>
              <span className="hidden md:inline">
                {t("layout.createEventFull")}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* 
          3. Main Content Container 
          
          FIX: Sidebar DOM removal on Mobile.
          我們使用 CSS Grid 或 Flex 都可以，但重點是：
          在 Mobile (md:hidden) 時，我們不要渲染 Sidebar 的 HTML 結構，
          避免 flex item 即使 hidden 也可能造成的佈局怪異 (雖然理論上不應該，但在 iOS safari 有時會有 ghost space)。
          或者更簡單：直接在 JSX 裡條件渲染 Sidebar。
      */}
      <div className="relative flex w-full min-h-screen">
        {/* Full-height divider line (Desktop Only) */}
        {/* 使用 media query 隱藏 DOM 可能更保險，但這裡我們先用 CSS hidden */}
        <div
          className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-border pointer-events-none z-0"
          style={{
            left: collapsed ? "70px" : "280px",
            transition: "left 200ms ease-out",
          }}
        />

        {/* Sidebar (Desktop Only - Conditional Rendering recommended if flex issues persist, but CSS hidden usually works) */}
        {/* 為了保險起見，我們這裡保持 hidden md:block，但在 content 裡我們會確保它是 flex-1 */}
        <aside
          className={cn(
            "hidden md:block md:shrink-0",
            "md:sticky md:top-[calc(4rem+var(--sat))]",
            "md:h-[calc(100dvh-4rem-var(--sat))]",
            "md:backdrop-blur",
            "transition-[width] duration-200 ease-out",
            "border-r border-border bg-(--color-bg)",
            collapsed ? "md:w-[70px]" : "md:w-[280px]"
          )}
        >
          <div
            className={cn(
              "h-full overflow-y-auto py-2",
              collapsed ? "px-0" : "px-2"
            )}
          >
            <Menu collapsed={collapsed} onItemClick={() => setOpen(false)} />
          </div>
        </aside>

        {/* Sidebar Toggle (Desktop Only) */}
        <div className="relative hidden md:block md:sticky md:top-[calc(4rem+var(--sat))] md:h-[calc(100dvh-4rem-var(--sat))] w-px z-10">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 mt-3",
              "inline-flex h-8 w-8 items-center justify-center rounded-2xl",
              "border border-border bg-surface",
              "shadow hover:bg-surface/80 transition-colors cursor-pointer"
            )}
          >
            {collapsed ? <RightArrow /> : <LeftArrow />}
          </button>
        </div>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 relative">
          {/* 
              注意：這裡沒有任何 padding，也沒有 overflow-hidden (除非必要)。
              內容組件 (Outlet) 負責填滿這個空間。
           */}
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {/* 條件渲染：只在 open 時渲染 DOM，或者保持 hidden */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${
          open ? "" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <button
          className={`absolute inset-0 bg-black/50 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
          aria-label="Close menu backdrop"
        />

        {/* Panel */}
        <div
          ref={drawerRef}
          className={`absolute inset-y-0 left-0 w-[85%] max-w-[320px] transform bg-neutral-900 p-3 shadow-2xl transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchMove={(e) => {
            if (touchStartX.current === null) return;
            const currentX = e.touches[0].clientX;
            const diff = touchStartX.current - currentX;
            if (open && diff > 0 && drawerRef.current) {
              const maxTranslate = drawerRef.current.offsetWidth;
              const translate = Math.min(diff, maxTranslate);
              drawerRef.current.style.transform = `translateX(-${translate}px)`;
            }
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const endX = e.changedTouches[0].clientX;
            const diff = touchStartX.current - endX;
            const threshold = 50;

            if (drawerRef.current) {
              drawerRef.current.style.transform = "";
            }

            if (open && diff > threshold) {
              setOpen(false);
            }

            touchStartX.current = null;
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-base font-semibold">Menu</span>
            <button
              ref={closeBtnRef}
              onClick={() => setOpen(false)}
              className="rounded-md p-2"
              aria-label="Close menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div className="max-h-[calc(100dvh-72px)] overflow-y-auto">
            <Menu onItemClick={() => setOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}
