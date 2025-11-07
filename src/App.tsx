import { Suspense } from 'react'

import { RouterProvider } from 'react-router'
import { router } from './router'
import { PageLoading } from '@/components'


function App() {
  
  return (
    <>
      <Suspense fallback={<PageLoading />}>
        <RouterProvider router={router} />
      </Suspense>
    </>
  )
}

export default App
