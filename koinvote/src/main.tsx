import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App.tsx'
import { Suspense } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Loading } from '@/components/Loading.tsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
    <Suspense fallback={<Loading />}>
    <QueryClientProvider client={queryClient}>
        <App />
    </QueryClientProvider>
    </Suspense>
)
