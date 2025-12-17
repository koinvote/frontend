import { Suspense, useEffect } from 'react'

import { RouterProvider } from 'react-router'
import { router } from './router'
import { PageLoading } from '@/components'
import { useSystemParametersStore, DEFAULT_REFRESH_INTERVAL_MS } from '@/stores/systemParametersStore'

function App() {

  useEffect(() => {
    useSystemParametersStore.getState().fetch()
    useSystemParametersStore.getState().startAutoRefresh(DEFAULT_REFRESH_INTERVAL_MS)// auto refresh every 10 seconds
    return () => useSystemParametersStore.getState().stopAutoRefresh()
  }, [])
  
  return (
    <>
      <Suspense fallback={<PageLoading />}>
        <RouterProvider router={router} />
      </Suspense>
    </>
  )
}

export default App
