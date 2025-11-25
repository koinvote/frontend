import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
const THEME_KEY = 'PREFERRED_THEME'

const applyTheme = (t: Theme) => {
  const el = document.documentElement

  if (t === 'dark') {
    el.classList.add('dark')
  } else {
    el.classList.remove('dark')
  }
}

const getSystemPref = (): Theme =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    const initial = saved ?? getSystemPref()

    setTheme(initial)
    applyTheme(initial)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'

    setTheme(next)
    applyTheme(next)
    localStorage.setItem(THEME_KEY, next)
  }

  return { theme, toggle }
}
