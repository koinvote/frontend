import axios, { type AxiosRequestConfig } from 'axios'

export type RequestConf = AxiosRequestConfig

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 這邊可以加上全局錯誤處理／toast
    return Promise.reject(error)
  },
)

export default http
