import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";

import MenuIcon from "@/assets/icons/menu.svg?react";
import Logo from "@/assets/logo/logo.svg?react";
import { useHomeStore } from "@/stores/homeStore";
import { cn } from "@/utils/style";
import { Button } from "../components/base/Button";

export default function Header({
  open,
  setOpen,
  setIsClosing,
  setIsOpening,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  setIsClosing: (value: boolean) => void;
  setIsOpening: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDesktop, setScrollY } = useHomeStore();

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 200);
  }, [setIsClosing, setOpen]);

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
  }, [open, setIsClosing, setIsOpening]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogoClick = () => {
    navigate("/");
    setScrollY(0);
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header
      className={cn(
        "top-0 left-0 w-full z-50 bg-white dark:bg-black md:border-b border-border px-2 text-(--color-primary)",
        "transition-transform duration-300 ease-out",
        isDesktop && "fixed"
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
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={handleLogoClick}
          >
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
  );
}
