const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const apiBaseUrl = rawApiBaseUrl.replace(/\/$/, '')

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${apiBaseUrl}${normalizedPath}`
}
