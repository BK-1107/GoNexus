import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { apiBaseUrl } from './base'

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：注入 JWT Token
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：处理 401 登出
client.interceptors.response.use(
  (response) => {
    if (response.data?.status_code === 2006) {
      useAuthStore.getState().logout()
      const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`
      window.location.assign(`/auth?returnTo=${encodeURIComponent(returnTo)}`)
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`
      window.location.assign(`/auth?returnTo=${encodeURIComponent(returnTo)}`)
    }
    return Promise.reject(error)
  }
)

export default client
