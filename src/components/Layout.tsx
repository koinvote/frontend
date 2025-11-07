import { useEffect, useRef, useState } from 'react'
import { Link, Outlet } from 'react-router'
import Menu from './Menu'
import { Button } from './base/Button'

export default function Layout() {
  const [open, setOpen] = useState(false)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="px-4 sticky top-0 z-40 w-full border-b border-white/10 bg-gray-950 backdrop-blur">
        <div className="flex h-14 w-full items-center md:h-16 md:px-12">
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex items-center justify-center rounded-md md:hidden"
            onClick={() => setOpen(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex flex-1 items-center md:justify-start">
            <Link to="/" className="mx-auto md:mx-0">
              <span className="text-lg font-semibold tracking-wide md:text-xl">KoinVote</span>
            </Link>
          </div>

          <div className="ml-2">
            <Button
              variant="white"
              size="md"
              block={false}
              className="w-auto md:w-[140px] lg:tx-16"
            >
              Create Event
            </Button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        <aside
          className="
            hidden
            md:block
            md:shrink-0
            md:border-r md:border-white/10
            md:bg-black
            md:backdrop-blur
            md:sticky md:top-16
            md:h-[calc(100dvh-4rem)]
            lg:top-16
            md:w-[230px]
          "
          // style={{ width: '230px' }} // 固定寬，避免 1/4 在超寬螢幕過大；需要 1/4 可改 md:w-1/4
        >
          <div className="h-full overflow-y-auto px-4 py-4">
            <Menu onItemClick={() => setOpen(false)} />
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          <div className="px-4 py-4 md:px-6 md:py-6 lg:px-12">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <button
          className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
          aria-label="Close menu backdrop"
        />

        {/* Panel */}
        <div
          className={`absolute inset-y-0 left-0 w-[85%] max-w-[320px] transform bg-neutral-900 p-3 shadow-2xl transition-transform ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-base font-semibold">Menu</span>
            <button
              ref={closeBtnRef}
              onClick={() => setOpen(false)}
              className="rounded-md p-2"
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="max-h-[calc(100dvh-72px)] overflow-y-auto">
            <Menu onItemClick={() => setOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  )
}
