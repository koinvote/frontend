// api/index.ts
import http, { adminHttp, type RequestConf } from "./http.ts";

import type {
  AdminLoginReq,
  CreateEventReq,
  GenerateReplyPlaintextReq,
  GetEventListReq,
  GetListRepliesReq,
  SubmitReplyReq,
  SubscribeReq,
  UpdateSystemParametersReq,
  VerifySignatureReq,
} from "./request.ts";

import type {
  AdminLoginRes,
  AdminSystemParametersRes,
  DepositStatusRes,
  EventDataRes,
  EventDetailDataRes,
  GetCompletedTopRepliesRes,
  GetEventListRes,
  GetHotHashtagsRes,
  GetListRepliesRes,
  GetReceiptVerifyPubKeysRes,
  GetReplyPlainTextRes,
  GetSignaturePlainTextRes,
  PayoutReportRes,
  SystemConfigRes,
  VerifySignatureRes,
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
export interface ReplyReceiptData {
  version: string;
  receipt_id: string;
  event_id: string;
  addr: string;
  plaintext: string;
  user_sig: string;
  timestamp: string;
  kid: string;
  server_sig: {
    alg: string;
    sig: string;
    payload: string;
  };
}

export const API = {
  getSystemConfig: get<ApiResponse<SystemConfigRes>, void>(
    "/system/parameters",
  ),

  createEvent: post<ApiResponse<EventDataRes>, CreateEventReq>("/events"),

  getEventList: get<ApiResponse<GetEventListRes>, GetEventListReq>("/events"),

  getEventDetail: (eventId: string) =>
    get<ApiResponse<EventDetailDataRes>, void>(`/events/${eventId}`),

  getHotHashtags: get<
    ApiResponse<GetHotHashtagsRes>,
    { limit: number; tab: string }
  >("hot-hashtags"),

  getSignaturePlainText: (eventId: string) =>
    get<ApiResponse<GetSignaturePlainTextRes>, void>(
      `/events/${eventId}/signature-plaintext`,
    ),

  verifySignature: (eventId: string) =>
    post<ApiResponse<VerifySignatureRes>, VerifySignatureReq>(
      `/events/${eventId}/verify-signature`,
    ),

  getDepositStatus: (eventId: string) =>
    get<ApiResponse<DepositStatusRes>, void>(
      `/events/${eventId}/deposit-status`,
    ),

  generateReplyPlaintext: () =>
    post<ApiResponse<GetReplyPlainTextRes>, GenerateReplyPlaintextReq>(
      "/replies/generate-plaintext",
    ),
  // GET /api/v1/replies?event_id={event_id}
  getListReplies: () =>
    get<ApiResponse<GetListRepliesRes>, GetListRepliesReq>("/replies"),

  submitReply: () =>
    post<ApiResponse<{ id: number }>, SubmitReplyReq>("/replies"),

  // Get reply receipt - returns JSON file as blob
  getReplyReceipt: (replyId: number) =>
    get<Blob, void>(`/replies/${replyId}/receipt`)(undefined, {
      responseType: "blob",
    }),

  // Payout Report API
  getPayoutReport: (eventId: string) =>
    get<ApiResponse<PayoutReportRes>, void>(`/events/${eventId}/payout-report`),

  // Get top replies for completed events (with balance type filter)
  getCompletedTopReplies: (eventId: string) =>
    get<
      ApiResponse<GetCompletedTopRepliesRes>,
      { balance_type?: "snapshot" | "current" }
    >(`/events/${eventId}/completed/top-replies`),

  // Verification CSV API - Returns CSV file as blob
  getVerificationCsv: (eventId: string, planId: number) =>
    get<Blob, { plan_id: number }>(`/events/${eventId}/verification-csv`)(
      { plan_id: planId },
      { responseType: "blob" },
    ),

  // Subscribe API
  subscribe: post<ApiResponse<void>, SubscribeReq>("/subscribe"),

  // Pre-generate OG image (fire-and-forget, different base path)
  preGenerateOgImage: (eventId: string) => {
    // Fire-and-forget: we don't await or handle errors
    fetch(`/render-meta/api/og-image/${eventId}`).catch(() => {
      // Silently ignore errors - this is just a pre-warm cache call
    });
  },

  // get receipt verification public keys
  getReceiptVerifyPubKeys: get<ApiResponse<GetReceiptVerifyPubKeysRes[]>, void>(
    "/receipt/pub-keys",
  ),
};

// Admin API (requires Bearer token authentication)
// Note: Admin login endpoint does NOT require token, so it uses regular http
export const AdminAPI = {
  // Admin login (no token required - uses regular http)
  login: post<ApiResponse<AdminLoginRes>, AdminLoginReq>("/admin/login"),
  // Admin system parameters (requires token - uses adminHttp)
  getSystemParameters: adminGet<ApiResponse<AdminSystemParametersRes>, void>(
    "/admin/system-parameters",
  ),
  updateSystemParameters: adminPut<
    ApiResponse<void>,
    UpdateSystemParametersReq
  >("/admin/system-parameters"),
};
