import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
const THEME_KEY = 'PREFERRED_THEME'

const applyTheme = (t: Theme) => {
  const el = document.documentElement
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')

  if (t === 'dark') {
    el.classList.add('dark')
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#000000')
  } else {
    el.classList.remove('dark')
    // 浅色模式下设为白色（或您的浅色背景色 #ffffff / #f3f3f5）
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#ffffff')
  }
}

const getSystemPref = (): Theme =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    // 默认优先使用深色模式，除非有保存的设置
    const initial = saved ?? 'dark'

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
