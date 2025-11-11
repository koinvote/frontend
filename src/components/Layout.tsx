import { useEffect, useRef, useState } from 'react'
import { Link, Outlet } from 'react-router'
import Menu from './Menu'
import { Button } from './base/Button'
import { cn } from '@/utils/style'

export default function Layout() {
  const [open, setOpen] = useState(false)            // mobile drawer
  const [collapsed, setCollapsed] = useState(false)  // desktop sidebar
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
  className={cn(
    'hidden md:sticky md:top-16 md:block md:shrink-0 md:h-[calc(100dvh-4rem)]',
    'md:bg-black md:backdrop-blur',
    'transition-[width] duration-200 ease-out',
    collapsed ? 'md:w-[76px]' : 'md:w-[280px]'
  )}
>
  <div className={cn('h-full overflow-y-auto py-4', collapsed ? 'px-0' : 'px-2')}>
    <Menu collapsed={collapsed} onItemClick={() => setOpen(false)} />
  </div>
</aside>

<div className="relative hidden md:block md:sticky md:top-16 md:h-[calc(100dvh-4rem)] w-px bg-white/10">
  <button
    type="button"
    onClick={() => setCollapsed(v => !v)}
    aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
    className={cn(
      'absolute left-1/2 -translate-x-1/2',
      'mt-3',
      'inline-flex h-8 w-8 items-center justify-center rounded-2xl',
      'border border-white/30 bg-black shadow hover:bg-white/10 transition-colors'
    )}
  >
    {collapsed ? (
      // →
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M10 7l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ) : (
      // ←
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M14 7l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )}
  </button>
</div>



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
          className={`absolute inset-y-0 left-0 w-[85%] max-w-[320px] transform bg-neutral-900 p-3 shadow-2xl transition-transform ${open ? 'translate-x-0' : '-translate-x-full'
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
