import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App.tsx'
import { Suspense } from 'react'
import './i18n.ts'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Loading } from '@/components/base/Loading.tsx'
import { useLanguagesStore } from './stores/languagesStore.ts'
import i18n from "i18next";


i18n.on("initialized", () => {
    useLanguagesStore.getState().initLanguage();
  });

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
    <Suspense fallback={<Loading />}>
    <QueryClientProvider client={queryClient}>
        <App />
    </QueryClientProvider>
    </Suspense>
)
