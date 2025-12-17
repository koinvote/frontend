// api/index.ts
import http, { type RequestConf } from './http.ts'

import type {
  CreateEventReq,
  GetEventListReq
} from './request.ts'

import type {
  SystemConfigRes,
  EventDataRes,
  GetEventListRes,
  EventDetailDataRes
} from './response.ts'

export function get<R = any, D = any>(path: TemplateStringsArray) {
  return (data?: D, config: RequestConf = {}) =>
    http.get<R>(path[0], { ...config, params: data })
}

export function post<R = any, D = any>(path: TemplateStringsArray) {
  return (data?: D, config: RequestConf = {}) =>
    http.post<R>(path[0], data, config)
}

export function del<R = any, D = any>(path: TemplateStringsArray) {
  return (data?: D, config: RequestConf = {}) =>
    http.delete<R>(path[0], { ...config, params: data })
}

export function patch<R = any, D = any>(path: TemplateStringsArray) {
  return (data?: D, config: RequestConf = {}) =>
    http.patch<R>(path[0], data, config)
}

export interface ApiResponse<T> {
  code: string
  success: boolean
  message: string | null
  data: T
}

export const API = {
  getSystemConfig: get<ApiResponse<SystemConfigRes>, void>`/system/parameters`,
  createEvent: post<ApiResponse<EventDataRes>, CreateEventReq>`/events`,
  getEventList: get<ApiResponse<GetEventListRes>, GetEventListReq>`/events`,
  getEventDetail: get<ApiResponse<EventDetailDataRes>, { event_id: string }>`/events/{event-id}`,

  // 之後 Admin FREE_HOURS 會用到，可以先留 TODO：
  // getSystemConfig: get<ApiResponse<{ free_hours: number }>>`/admin/system-config`,
  // updateFreeHours: patch<ApiResponse<{ free_hours: number }>, { free_hours: number }>`/admin/system-config`,
}