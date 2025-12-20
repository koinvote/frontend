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
