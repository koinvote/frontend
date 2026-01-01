import axios, { type AxiosRequestConfig } from "axios";

export type RequestConf = AxiosRequestConfig;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getApiErrorMessage(error: any): string {
  // Axios response error
  if (error?.response) {
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
});

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Attach standardized error message to error object for easy access in components
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).apiMessage = getApiErrorMessage(error);
    return Promise.reject(error);
  }
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
  }
);

// Response interceptor: Same as regular http
adminHttp.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Attach standardized error message to error object for easy access in components
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).apiMessage = getApiErrorMessage(error);
    return Promise.reject(error);
  }
);

export { adminHttp };
