import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";

import { cn } from "@/utils/style";
import Menu from "../components/Menu";
import { Button } from "../components/base/Button";

import LeftArrow from "@/assets/icons/leftArrow.svg?react";
import MenuIcon from "@/assets/icons/menu.svg?react";
import RightArrow from "@/assets/icons/rightArrow.svg?react";
import Logo from "@/assets/logo/logo.svg?react";

import { useHomeStore } from "@/stores/homeStore";
import { useTranslation } from "react-i18next";

export default function Layout() {
  const [open, setOpen] = useState(false); // mobile drawer
  const [isClosing, setIsClosing] = useState(false); // 控制关闭动画
  const [isOpening, setIsOpening] = useState(false); // 控制打开动画
  const [headerVisible, setHeaderVisible] = useState(true); // mobile header visibility
  const lastScrollY = useRef(0);
  // desktop sidebar state persisted in store
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const { isDesktop, setIsDesktop, collapsed, setCollapsed } = useHomeStore();

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, [setIsDesktop]);

  // Mobile header show/hide on scroll
  useEffect(() => {
    if (isDesktop) {
      setHeaderVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Show header when scrolling up or at top
      if (scrollDelta < -5 || currentScrollY < 10) {
        setHeaderVisible(true);
      }
      // Hide header when scrolling down
      else if (scrollDelta > 5 && currentScrollY > 60) {
        setHeaderVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDesktop]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 200);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  useEffect(() => {
    if (open) {
      setIsClosing(false);
      setIsOpening(true);
      const timer = setTimeout(() => {
        setIsOpening(false);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsOpening(false);
    }
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - touchEndX;
    const deltaY = Math.abs(touchStartY.current - touchEndY);

    const SWIPE_THRESHOLD = 50;
    if (deltaX > SWIPE_THRESHOLD && deltaX > deltaY) {
      handleClose();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    // 1. Root Container
    <div className="w-full min-h-screen">
      {/* 2. Header */}
      <header
        className={cn(
          "fixed top-0 left-0 w-full z-50 bg-white dark:bg-black border-b border-border px-2 text-(--color-primary)",
          "transition-transform duration-300 ease-out",
          !headerVisible && !isDesktop && "-translate-y-full"
        )}
        style={{
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
            <Button
              size="md"
              text="sm"
              block={false}
              className="w-auto md:w-[140px] md:tx-14 lg:tx-16"
              onClick={() => {
                if (location.pathname === "/create-event") {
                  return;
                }
                navigate("/create-event");
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

      {/* 3. Main Content Container */}
      <div className="relative flex w-full min-h-screen pt-14 md:pt-16">
        {/* Sidebar (Desktop Only - Fixed) */}
        {isDesktop && (
          <aside
            className={cn(
              "fixed top-16 left-0 z-40",
              "h-[calc(100dvh-4rem)]",
              "backdrop-blur",
              "transition-[width] duration-200 ease-out",
              "border-r border-border bg-(--color-bg)",
              collapsed ? "w-[70px]" : "w-[280px]"
            )}
          >
            <div
              className={cn(
                "h-full overflow-y-auto py-2",
                collapsed ? "px-0" : "px-2"
              )}
            >
              <Menu collapsed={collapsed} onItemClick={handleClose} />
            </div>

            {/* Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={
                collapsed ? "Expand navigation" : "Collapse navigation"
              }
              className={cn(
                "absolute -right-4 top-3",
                "inline-flex h-8 w-8 items-center justify-center rounded-2xl",
                "border border-border bg-surface",
                "shadow hover:bg-surface/80 transition-colors cursor-pointer"
              )}
            >
              {collapsed ? <RightArrow /> : <LeftArrow />}
            </button>
          </aside>
        )}

        {/* Main Content Area */}
        <main
          className={cn(
            "min-w-0 flex-1 transition-[margin] duration-200 ease-out",
            isDesktop && (collapsed ? "ml-[70px]" : "ml-[280px]")
          )}
        >
          <div className="py-4 md:px-6 md:py-6 lg:px-12 border-b border-border">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/50 transition-opacity duration-200"
            style={{ opacity: isClosing ? 0 : 1 }}
            onClick={handleClose}
            aria-label="Close menu backdrop"
          />
          <div
            ref={drawerRef}
            className={cn(
              "absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-white dark:bg-neutral-900 p-3 shadow-2xl transition-transform duration-200 ease-out",
              isClosing || isOpening ? "-translate-x-full" : "translate-x-0"
            )}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-base font-semibold">
                {t("layout.menu", "Menu")}
              </span>
              <button
                ref={closeBtnRef}
                onClick={handleClose}
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
              <Menu onItemClick={handleClose} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
