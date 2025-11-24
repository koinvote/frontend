import { useEffect, useState } from 'react'

export function BackToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY
      const vh = window.innerHeight
      setVisible(y > vh * 2)
    }
    window.addEventListener('scroll', handler)
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      }
      className="fixed bottom-6 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg active:scale-95 md:right-8"
    >
      ↑
    </button>
  )
}
