import { create } from 'zustand'
import { API } from '@/api'
import type { SystemConfigRes } from '@/api/response'

interface SystemParametersState {
  // data
  params: SystemConfigRes | null
  lastUpdatedAt: number | null

  // status
  isLoading: boolean
  isError: boolean
  errorMessage: string | null

  // auto refresh
  isAutoRefreshing: boolean
  refreshIntervalMs: number | null

  // actions
  fetch: () => Promise<void>
  refresh: () => Promise<void>
  startAutoRefresh: (intervalMs?: number) => void
  stopAutoRefresh: () => void

  // allow server-push or external update to overwrite
  setFromServerPush: (params: SystemConfigRes) => void

  // private
  _intervalId?: number | null
}

export const DEFAULT_REFRESH_INTERVAL_MS = 60_000

export const useSystemParametersStore = create<SystemParametersState>((set, get) => ({
  params: null,
  lastUpdatedAt: null,

  isLoading: false,
  isError: false,
  errorMessage: null,

  isAutoRefreshing: false,
  refreshIntervalMs: null,
  _intervalId: null,

  fetch: async () => {
    set({ isLoading: true, isError: false, errorMessage: null })
    try {
      // Note: our axios instance returns response.data via interceptor at runtime,
      // but types may still reflect AxiosResponse. Handle both shapes safely.
      const res = (await API.getSystemConfig()) as any
      const envelope = res?.success !== undefined ? res : res?.data

      if (envelope?.success) {
        set({
          params: envelope.data as SystemConfigRes,
          lastUpdatedAt: Date.now(),
          isError: false,
          errorMessage: null,
        })
      } else {
        set({
          isError: true,
          errorMessage: envelope?.message ?? 'Failed to fetch system parameters',
        })
      }
    } catch (err: any) {
      set({
        isError: true,
        errorMessage: err?.message ?? 'Network error while fetching system parameters',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  refresh: async () => {
    await get().fetch()
  },

  startAutoRefresh: (intervalMs = DEFAULT_REFRESH_INTERVAL_MS) => {
    const { _intervalId } = get()
    if (_intervalId) {
      clearInterval(_intervalId)
    }
    const id = window.setInterval(() => {
      // fire and forget to keep interval cadence
      void get().fetch()
    }, intervalMs)
    set({
      _intervalId: id,
      isAutoRefreshing: true,
      refreshIntervalMs: intervalMs,
    })
  },

  stopAutoRefresh: () => {
    const { _intervalId } = get()
    if (_intervalId) {
      clearInterval(_intervalId)
    }
    set({
      _intervalId: null,
      isAutoRefreshing: false,
      refreshIntervalMs: null,
    })
  },

  setFromServerPush: (params) =>
    set({
      params,
      lastUpdatedAt: Date.now(),
      isError: false,
      errorMessage: null,
    }),
}))