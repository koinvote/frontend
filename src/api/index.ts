// api/index.ts
import http, { adminHttp, type RequestConf } from "./http.ts";

import type {
  CreateEventReq,
  GetEventListReq,
  GetListRepliesReq,
  AdminLoginReq,
  UpdateSystemParametersReq,
  VerifySignatureReq,
  SubmitReplyReq,
  GenerateReplyPlaintextReq,
  SubscribeReq,
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
  PayoutReportRes,
} from "./response.ts";

export function get<R = unknown, D = unknown>(path: string) {
  return (data?: D, config: RequestConf = {}) =>
    http.get<R>(path, { ...config, params: data }) as Promise<R>;
}

export function post<R = unknown, D = unknown>(path: string) {
  return (data?: D, config: RequestConf = {}) =>
    http.post<R>(path, data, config) as Promise<R>;
}

export function del<R = unknown, D = unknown>(path: TemplateStringsArray) {
  return (data?: D, config: RequestConf = {}) =>
    http.delete<R>(path[0], { ...config, params: data }) as Promise<R>;
}

export function patch<R = unknown, D = unknown>(path: TemplateStringsArray) {
  return (data?: D, config: RequestConf = {}) =>
    http.patch<R>(path[0], data, config) as Promise<R>;
}

// Admin API helper functions (using adminHttp with token)
export function adminGet<R = unknown, D = unknown>(path: string) {
  return (data?: D, config: RequestConf = {}) =>
    adminHttp.get<R>(path, { ...config, params: data }) as Promise<R>;
}

export function adminPost<R = unknown, D = unknown>(path: string) {
  return (data?: D, config: RequestConf = {}) =>
    adminHttp.post<R>(path, data, config) as Promise<R>;
}

export function adminPut<R = unknown, D = unknown>(path: string) {
  return (data?: D, config: RequestConf = {}) =>
    adminHttp.put<R>(path, data, config) as Promise<R>;
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

  generateReplyPlaintext: () =>
    post<ApiResponse<GetReplyPlainTextRes>, GenerateReplyPlaintextReq>(
      "/replies/generate-plaintext"
    ),
  // GET /api/v1/replies?event_id={event_id}
  getListReplies: () =>
    get<ApiResponse<GetListRepliesRes>, GetListRepliesReq>("/replies"),

  submitReply: () => post<ApiResponse<void>, SubmitReplyReq>("/replies"),

  // Payout Report API
  getPayoutReport: (eventId: string) =>
    get<ApiResponse<PayoutReportRes>, void>(
      `/events/${eventId}/payout-report`
    ),

  // Verification CSV API - Returns CSV file as blob
  getVerificationCsv: (eventId: string, planId: number) =>
    get<Blob, { plan_id: number }>(
      `/events/${eventId}/verification-csv`
    )({ plan_id: planId }, { responseType: 'blob' }),

  // Subscribe API
  subscribe: post<ApiResponse<void>, SubscribeReq>("/subscribe"),
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
