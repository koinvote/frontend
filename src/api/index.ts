// api/index.ts
import http, { type RequestConf } from "./http.ts";

import type {
  CreateEventReq,
  GetEventListReq,
  GetListRepliesReq,
} from "./request.ts";

import type {
  SystemConfigRes,
  EventDataRes,
  GetEventListRes,
  EventDetailDataRes,
  GetSignaturePlainTextRes,
  VerifySignatureRes,
  DepositStatusRes,
  GetReplyPlainTextRes,
  GetListRepliesRes,
  GetHotHashtagsRes,
} from "./response.ts";

export function get<R = unknown, D = unknown>(path: string) {
  return (data?: D, config: RequestConf = {}) =>
    http.get<R>(path, { ...config, params: data });
}

export function post<R = unknown, D = unknown>(path: string) {
  return (data?: D, config: RequestConf = {}) =>
    http.post<R>(path, data, config);
}

export function del<R = unknown, D = unknown>(path: TemplateStringsArray) {
  return (data?: D, config: RequestConf = {}) =>
    http.delete<R>(path[0], { ...config, params: data });
}

export function patch<R = unknown, D = unknown>(path: TemplateStringsArray) {
  return (data?: D, config: RequestConf = {}) =>
    http.patch<R>(path[0], data, config);
}

export interface ApiResponse<T> {
  code: string;
  success: boolean;
  message: string | null;
  data: T;
}

export const API = {
  getSystemConfig: get<ApiResponse<SystemConfigRes>, void>(
    "/system/parameters"
  ),

  createEvent: post<ApiResponse<EventDataRes>, CreateEventReq>("/events"),

  getEventList: get<ApiResponse<GetEventListRes>, GetEventListReq>("/events"),

  getEventDetail: (eventId: string) =>
    get<ApiResponse<EventDetailDataRes>, void>(`/events/${eventId}`),

  getHotHashtags: get<ApiResponse<GetHotHashtagsRes>, { limit: number }>(
    "hot-hashtags"
  ),

  getSignaturePlainText: (eventId: string) =>
    get<ApiResponse<GetSignaturePlainTextRes>, void>(
      `/events/${eventId}/signature-plaintext`
    ),

  verifySignature: (eventId: string) =>
    post<ApiResponse<VerifySignatureRes>, { signature: string }>(
      `/events/${eventId}/verify-signature`
    ),

  getDepositStatus: (eventId: string) =>
    get<ApiResponse<DepositStatusRes>, void>(
      `/events/${eventId}/deposit-status`
    ),

  getReplyPlainText: (eventId: string) =>
    get<ApiResponse<GetReplyPlainTextRes>, void>(
      `/events/${eventId}/reply-plaintext`
    ),
  // /api/v1/events/{event-id}/replies
  getListReplies: (eventId: string) =>
    get<ApiResponse<GetListRepliesRes>, GetListRepliesReq>(
      `/events/${eventId}/replies`
    ),

  // 之後 Admin FREE_HOURS 會用到，可以先留 TODO：
  // getSystemConfig: get<ApiResponse<{ free_hours: number }>>`/admin/system-config`,
  // updateFreeHours: patch<ApiResponse<{ free_hours: number }>, { free_hours: number }>`/admin/system-config`,
};
