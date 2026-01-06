// api/index.ts
import http, { adminHttp, type RequestConf } from "./http.ts";

import type {
  CreateEventReq,
  GetEventListReq,
  GetListRepliesReq,
  AdminLoginReq,
  UpdateSystemParametersReq,
  VerifySignatureReq,
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
  AdminLoginRes,
  AdminSystemParametersRes,
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

// Admin API helper functions (using adminHttp with token)
export function adminGet<R = unknown, D = unknown>(path: string) {
  return (data?: D, config: RequestConf = {}) =>
    adminHttp.get<R>(path, { ...config, params: data });
}

export function adminPost<R = unknown, D = unknown>(path: string) {
  return (data?: D, config: RequestConf = {}) =>
    adminHttp.post<R>(path, data, config);
}

export function adminPut<R = unknown, D = unknown>(path: string) {
  return (data?: D, config: RequestConf = {}) =>
    adminHttp.put<R>(path, data, config);
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
    post<ApiResponse<VerifySignatureRes>, VerifySignatureReq>(
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
  // GET /api/v1/replies?event_id={event_id}
  getListReplies: () =>
    get<ApiResponse<GetListRepliesRes>, GetListRepliesReq>("/replies"),
};

// Admin API (requires Bearer token authentication)
// Note: Admin login endpoint does NOT require token, so it uses regular http
export const AdminAPI = {
  // Admin login (no token required - uses regular http)
  login: post<ApiResponse<AdminLoginRes>, AdminLoginReq>("/admin/login"),
  // Admin system parameters (requires token - uses adminHttp)
  getSystemParameters: adminGet<ApiResponse<AdminSystemParametersRes>, void>(
    "/admin/system-parameters"
  ),
  updateSystemParameters: adminPut<
    ApiResponse<void>,
    UpdateSystemParametersReq
  >("/admin/system-parameters"),
};
