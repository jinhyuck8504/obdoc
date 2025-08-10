'use client'
import { useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface SessionConfig {
  autoLogoutTime?: number // 자동 로그아웃 시간 (밀리초)
  warningTime?: number    // 경고 표시 시간 (밀리초)
  checkInterval?: number  // 체크 간격 (밀리초)
}

const DEFAULT_CONFIG: Required<SessionConfig> = {
  autoLogoutTime: 30 * 60 * 1000, // 30분
  warningTime: 5 * 60 * 1000,     // 5분 전 경고
  checkInterval: 60 * 1000        // 1분마다 체크
}

export function useSessionManager(config: SessionConfig = {}) {
  const { user, signOut } = useAuth()
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const warningShownRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 마지막 활동 시간 업데이트
  const updateLastActivity = useCallback(() => {
    if (user) {
      localStorage.setItem('lastActivity', Date.now().toString())
      warningShownRef.current = false // 경고 상태 리셋
    }
  }, [user])

  // 세션 만료 체크
  const checkSession = useCallback(() => {
    if (!user) return

    const lastActivity = localStorage.getItem('lastActivity')
    if (!lastActivity) {
      updateLastActivity()
      return
    }

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity)
    const timeUntilLogout = finalConfig.autoLogoutTime - timeSinceLastActivity

    // 경고 시간에 도달했을 때
    if (timeUntilLogout <= finalConfig.warningTime && !warningShownRef.current) {
      warningShownRef.current = true
      const minutes = Math.ceil(timeUntilLogout / (60 * 1000))
      
      if (confirm(`세션이 ${minutes}분 후에 만료됩니다. 계속 사용하시겠습니까?`)) {
        updateLastActivity()
      }
    }

    // 자동 로그아웃 시간에 도달했을 때
    if (timeSinceLastActivity >= finalConfig.autoLogoutTime) {
      console.log('Session expired due to inactivity')
      alert('비활성 상태로 인해 자동 로그아웃됩니다.')
      signOut()
    }
  }, [user, finalConfig, signOut, updateLastActivity])

  // 사용자 활동 감지
  useEffect(() => {
    if (!user) return

    const events = [
      'mousedown', 
      'mousemove', 
      'keypress', 
      'scroll', 
      'touchstart',
      'click'
    ]

    const handleActivity = () => {
      updateLastActivity()
    }

    // 이벤트 리스너 등록
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // 초기 활동 시간 설정
    updateLastActivity()

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [user, updateLastActivity])

  // 주기적 세션 체크
  useEffect(() => {
    if (!user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(checkSession, finalConfig.checkInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [user, checkSession, finalConfig.checkInterval])

  // 페이지 언로드 시 마지막 활동 시간 저장
  useEffect(() => {
    if (!user) return

    const handleBeforeUnload = () => {
      updateLastActivity()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [user, updateLastActivity])

  // 탭 포커스 변경 감지
  useEffect(() => {
    if (!user) return

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 탭이 다시 활성화되었을 때 세션 체크
        checkSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, checkSession])

  return {
    updateLastActivity,
    checkSession
  }
}