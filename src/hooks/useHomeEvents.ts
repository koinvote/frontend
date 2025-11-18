
import { useEffect, useCallback } from 'react'
import { mockFetchEvents } from '@/pages/home/mockData'
import { useHomeStore } from '@/stores/homeStore'

export function useHomeEvents() {
  const {
    status,
    debouncedSearch,
    sortField,
    sortOrder,
    activeHashtag,
    events,
    hasMore,
    offset,
    limit,
    isLoading,
    isError,
    setEvents,
    appendEvents,
    setLoading,
    setError,
  } = useHomeStore()

  const loadFirstPage = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await mockFetchEvents({
        status,
        search: debouncedSearch,
        sortField,
        sortOrder,
        hashtag: activeHashtag,
        offset: 0,
        limit,
      })
      setEvents(res.items, res.total, res.hasMore, res.offset + res.items.length)
    } catch (e) {
      console.error('Failed to load events', e)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [
    status,
    debouncedSearch,
    sortField,
    sortOrder,
    activeHashtag,
    limit,
    setEvents,
    setLoading,
    setError,
  ])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    setLoading(true)
    setError(false)
    try {
      const res = await mockFetchEvents({
        status,
        search: debouncedSearch,
        sortField,
        sortOrder,
        hashtag: activeHashtag,
        offset,
        limit,
      })
      appendEvents(res.items, res.hasMore, res.offset + res.items.length)
    } catch (e) {
      console.error('Failed to load more events', e)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [
    status,
    debouncedSearch,
    sortField,
    sortOrder,
    activeHashtag,
    offset,
    limit,
    isLoading,
    hasMore,
    appendEvents,
    setLoading,
    setError,
  ])

  // filters 改變時重新載入第一頁
  useEffect(() => {
    loadFirstPage()
  }, [loadFirstPage])

  return {
    events,
    isLoading,
    isError,
    hasMore,
    loadMore,
    reload: loadFirstPage,
  }
}
