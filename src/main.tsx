import { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './global.css'
import './globalAntd.css'
import './i18n.ts'

import { Loading } from '@/components/base/Loading.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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

// Google Analytics — only inject when VITE_GA_ID is set (production)
const gaId = import.meta.env.VITE_GA_ID;

if (gaId) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  
  // 必須使用 function 關鍵字並直接傳遞 arguments 物件
  window.gtag = function() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments); 
  };
  
  window.gtag('js', new Date());
  window.gtag('config', gaId);
}

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
