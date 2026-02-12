import { useEffect } from "react";

import { BackToTopButton } from "@/pages/home/component/BackToTopButton";
import { EventList } from "@/pages/home/component/EventList";
import { HomeToolbar } from "@/pages/home/component/HomeToolbar";
import { useHomeStore } from "@/stores/homeStore";

export function HomePage() {
  const scrollY = useHomeStore((state) => state.scrollY);
  const setScrollY = useHomeStore((state) => state.setScrollY);

  useEffect(() => {
    if (scrollY > 0) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount to restore scroll position

  // Track scroll position
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setScrollY(window.scrollY);
      }, 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [setScrollY]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-16 pt-4 md:pt-6 md:px-6">
      <HomeToolbar />
      <EventList />
      <BackToTopButton />
    </div>
  );
}

export default HomePage;
