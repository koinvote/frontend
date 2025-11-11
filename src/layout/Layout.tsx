import { useEffect, useRef, useState } from 'react'
import { Link, Outlet } from 'react-router'

import Menu from '../components/Menu'
import { Button } from '../components/base/Button'
import { cn } from '@/utils/style'

import Logo from '@/assets/logo/logo.svg?react'
import LanguagesEarth from '@/assets/icons/languages-earth.svg?react'
import RightArrow from '@/assets/icons/rightArrow.svg?react'
import LeftArrow from '@/assets/icons/leftArrow.svg?react'
import ModeLight from '@/assets/icons/mode-light.svg?react'
import ModeDark from '@/assets/icons/mode-dark.svg?react'

import { useTranslation } from 'react-i18next'
import { useTheme } from '@/hooks/useTheme'
import { useLanguagesStore } from '@/stores/languagesStore'

export default function Layout() {
  const [open, setOpen] = useState(false)            // mobile drawer
  const [collapsed, setCollapsed] = useState(false)  // desktop sidebar
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const { t } = useTranslation()
  const { theme, toggle } = useTheme()
  const { current, setLanguage } = useLanguagesStore()
  const toggleLang = () => setLanguage(current === 'en' ? 'zh' : 'en')


  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen bg-(--color-bg) text-(--color-primary)">
      {/* Top bar */}
      <header className="px-2 sticky top-0 z-40 w-full border-b
       border-border bg-[--color-bg] text-(--color-primary) backdrop-blur">
        <div className="flex h-14 w-full items-center md:h-16 md:px-4">
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
            <Link to="/" className="mx-auto md:mx-0 flex items-center gap-2">
              <span><Logo /></span>
              <span className="text-lg font-semibold tracking-wide md:text-xl">
                {t('layout.title')}
              </span>
            </Link>
          </div>

          <div className="ml-2 flex items-center gap-2">
            <Button size="md" onClick={toggleLang} className="w-auto px-3">
              <LanguagesEarth className="mr-2" />
              <span className="tx-12">{current === 'en' ? 'EN' : '中文'}</span>
            </Button>
            <Button size="md" onClick={toggle} className="w-auto px-3">
              {theme === 'dark' ? (
                <ModeLight />
              ) : (
                <ModeDark />
              )}
              <span className="tx-12">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </Button>
            <Button
              size="md"
              block={false}
              className="w-auto md:w-[140px] lg:tx-16"
            >
              {t('layout.createEvent')}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        <aside className={cn(
          'hidden md:sticky md:top-16 md:block md:shrink-0 md:h-[calc(100dvh-4rem)]',
          'md:backdrop-blur',
          'transition-[width] duration-200 ease-out',
          // 新增：邊框/背景使用 token
          'border-r border-border bg-surface',
          collapsed ? 'md:w-[70px]' : 'md:w-[280px]'
        )}>
          <div className={cn('h-full overflow-y-auto py-2', collapsed ? 'px-0' : 'px-2')}>
            <Menu collapsed={collapsed} onItemClick={() => setOpen(false)} />
          </div>
        </aside>

        <div className="relative hidden md:block md:sticky md:top-16 md:h-[calc(100dvh-4rem)]
            w-px bg-border">
          <button
            type="button"
            onClick={() => setCollapsed(v => !v)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className={cn(
              'absolute left-1/2 -translate-x-1/2 mt-3',
              'inline-flex h-8 w-8 items-center justify-center rounded-2xl',
              'border border-border bg-surface',
              'shadow hover:bg-surface/80 transition-colors cursor-pointer'
            )}
          >
            {collapsed ? (
              <RightArrow />
            ) : (
              <LeftArrow />
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
