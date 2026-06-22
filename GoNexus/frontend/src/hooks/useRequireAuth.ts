import { useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"

export function useRequireAuth() {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()
  const navigate = useNavigate()

  return useCallback(() => {
    const auth = useAuthStore.getState()
    if (token && auth.isAuthenticated()) return true

    if (auth.token) auth.logout()

    const returnTo = `${location.pathname}${location.search}${location.hash}`
    navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`)
    return false
  }, [location.hash, location.pathname, location.search, navigate, token])
}
