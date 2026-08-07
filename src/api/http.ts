import axios, { type AxiosRequestConfig } from "axios";

import { notifySessionExpired } from "@/api/adminSession";
import i18n from "@/i18n";

export type RequestConf = AxiosRequestConfig;

const errorKeyToI18nKey = (key: string): string =>
  "backend." +
  key.toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export function getApiMessage(error: unknown): string | undefined {
  if (error && typeof error === "object" && "apiMessage" in error) {
    return (error as { apiMessage: string }).apiMessage;
  }
  return undefined;
}

/**
 * @param lng Pin the message to one language instead of the site language.
 *   The admin login screen passes "en": it is reachable by anyone who types
 *   the URL, so it should not switch to Chinese just because the browser once
 *   picked that on the public site.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getApiErrorMessage(error: any, lng?: string): string {
  const translate = lng ? i18n.getFixedT(lng) : i18n.t.bind(i18n);

  // Axios response error
  if (error?.response) {
    const errorKey = error.response.data?.error_key;
    if (errorKey) {
      const i18nKey = errorKeyToI18nKey(errorKey);
      if (i18n.exists(i18nKey, lng ? { lng } : undefined)) {
        return translate(i18nKey);
      }
    }
    return (
      error.response.data?.message ||
      error.response.data?.msg ||
      error.response.data?.error ||
      `Request failed (${error.response.status})`
    );
  }

  // Network / timeout
  if (error?.request) {
    return "Network error. Please check your connection.";
  }

  // JS error
  if (error?.message) {
    return error.message;
  }

  return "Unexpected error occurred.";
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer: (params) => {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
        }
      } else if (value !== undefined && value !== null) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
    return parts.join("&");
  },
});

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Attach standardized error message to error object for easy access in components
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).apiMessage = getApiErrorMessage(error);
    return Promise.reject(error);
  },
);
export default http;

// Admin HTTP client with token authentication
const ADMIN_TOKEN_KEY = "koinvote:admin_token";

/**
 * Get admin token from localStorage
 */
export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

/**
 * Set admin token to localStorage
 */
export function setAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

/**
 * Remove admin token from localStorage
 */
export function removeAdminToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

// Create a separate HTTP instance for admin API calls
const adminHttp = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Add Bearer token to all admin requests
adminHttp.interceptors.request.use(
  (config) => {
    const token = getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: Handle token expiration and errors
adminHttp.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Attach standardized error message to error object for easy access in components
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).apiMessage = getApiErrorMessage(error);

    // Check for token expiration or invalid token
    const status = error?.response?.status;
    const message = error?.response?.data?.message || "";

    if (
      status === 401 ||
      message.toLowerCase().includes("token expired") ||
      message.toLowerCase().includes("invalid token") ||
      message.toLowerCase().includes("token invalid")
    ) {
      // 防止 401 時再跳「取得XX失敗」等業務 toast
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).isHandled = true;

      // No toast here. An expired session is not an error the admin can act on
      // from this screen, and a red banner in front of the login form reads as
      // a broken site. The login page states it calmly instead — see
      // notifySessionExpired, which lets AdminLayout redirect through the
      // router rather than reloading the whole page behind a timer.
      removeAdminToken();
      notifySessionExpired();
    }

    return Promise.reject(error);
  },
);

export { adminHttp };
