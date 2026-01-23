import { createRoot } from 'react-dom/client'
import './global.css'
import './globalAntd.css'
import App from './App.tsx'
import { Suspense } from 'react'
import './i18n.ts'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Loading } from '@/components/base/Loading.tsx'
import { useLanguagesStore } from './stores/languagesStore.ts'
import i18n from "i18next";

// Start MSW in development mode if VITE_USE_MOCK is enabled
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK !== 'true') {
    return
  }

  const { worker } = await import('./mocks/browser')

  // Start the worker and log when ready
  return worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
  }).then(() => {
    console.log('[MSW] Mocking enabled - using fake data')
  })
}

i18n.on("initialized", () => {
    useLanguagesStore.getState().initLanguage();
  });

const queryClient = new QueryClient()

// Wait for MSW to be ready before rendering
enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
      <Suspense fallback={<Loading />}>
      <QueryClientProvider client={queryClient}>
          <App />
      </QueryClientProvider>
      </Suspense>
  )
})
