/**
 * 세션 관리 훅
 */
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface UseSessionOptions {
  onSessionExpiry?: () => void
  checkInterval?: number
}

export function useSession(options: UseSessionOptions = {}) {
  const { user, logout } = useAuth()
  const { onSessionExpiry, checkInterval = 60000 } = options // 1분마다 체크

  useEffect(() => {
    if (!user) return

    const checkSession = () => {
      // 세션 만료 체크 로직
      // 실제로는 토큰 만료 시간을 확인해야 함
      const now = Date.now()
      const sessionExpiry = localStorage.getItem('sessionExpiry')
      
      if (sessionExpiry && now > parseInt(sessionExpiry)) {
        onSessionExpiry?.()
        logout()
      }
    }

    const interval = setInterval(checkSession, checkInterval)
    
    return () => clearInterval(interval)
  }, [user, onSessionExpiry, checkInterval, logout])

  return {
    user,
    isAuthenticated: !!user
  }
}