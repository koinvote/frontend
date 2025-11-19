import { useEffect } from 'react'
import { HomeToolbar } from '@/pages/home/component/HomeToolbar'
import { EventList } from '@/pages/home/component/EventList'
import { BackToTopButton } from '@/pages/home/component/BackToTopButton'
import { useHomeStore } from '@/stores/homeStore'

export function HomePage() {
  const { scrollY, setScrollY } = useHomeStore()

  // mount 時恢復捲動位置
  useEffect(() => {
    if (scrollY > 0) {
      window.scrollTo(0, scrollY)
    }
    return () => {
      // 離開頁面時記錄當前 scroll
      setScrollY(window.scrollY)
    }
  }, [scrollY, setScrollY])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-16 pt-4 md:pt-6 md:px-6">
      <HomeToolbar />
      <EventList />
      <BackToTopButton />
    </div>
  )
}

export default HomePage
