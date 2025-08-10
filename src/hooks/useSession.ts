'use client'
import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface UseSessionOptions {
  redirectOnExpiry?: boolean
  redirectPath?: string
  onSessionExpiry?: () => void
  checkInterval?: number // 세션 체크 간격 (밀리초)
}

export function useSession(options: UseSessionOptions = {}) {
  const {
    redirectOnExpiry = true,
    redirectPath = '/login',
    onSessionExpiry,
    checkInterval = 60000 // 1분마다 체크
  } = options

  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  // 세션 만료 처리
  const handleSessionExpiry = useCallback(async () => {
    if (onSessionExpiry) {
      onSessionExpiry()
    }
    
    // 로그아웃 처리
    await signOut()
    
    // 리다이렉트
    if (redirectOnExpiry) {
      router.push(redirectPath)
    }
  }, [onSessionExpiry, signOut, redirectOnExpiry, redirectPath, router])

  // 세션 유효성 검사
  const checkSession = useCallback(async () => {
    if (!user || loading) return

    try {
      // 실제 구현에서는 서버에 세션 유효성을 확인하는 API 호출
      // 여기서는 간단히 토큰 만료 시간을 체크
      const tokenExpiry = localStorage.getItem('token_expiry')
      if (tokenExpiry) {
        const expiryTime = new Date(tokenExpiry).getTime()
        const currentTime = new Date().getTime()
        
        if (currentTime >= expiryTime) {
          await handleSessionExpiry()
          return false
        }
      }
      
      return true
    } catch (error) {
      console.error('세션 체크 실패:', error)
      await handleSessionExpiry()
      return false
    }
  }, [user, loading, handleSessionExpiry])

  // 세션 연장
  const extendSession = useCallback(async () => {
    if (!user) return false

    try {
      // 실제 구현에서는 서버에 세션 연장 요청
      // 여기서는 간단히 토큰 만료 시간을 연장
      const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 연장
      localStorage.setItem('token_expiry', newExpiry.toISOString())
      return true
    } catch (error) {
      console.error('세션 연장 실패:', error)
      return false
    }
  }, [user])

  // 자동 로그아웃 (비활성 상태 감지)
  const setupAutoLogout = useCallback(() => {
    let inactivityTimer: NodeJS.Timeout
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30분

    const resetTimer = () => {
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        handleSessionExpiry()
      }, INACTIVITY_TIMEOUT)
    }

    // 사용자 활동 감지 이벤트
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true)
    })

    // 초기 타이머 설정
    resetTimer()

    // 정리 함수
    return () => {
      clearTimeout(inactivityTimer)
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true)
      })
    }
  }, [handleSessionExpiry])

  // 세션 체크 간격 설정
  useEffect(() => {
    if (!user || loading) return

    const interval = setInterval(checkSession, checkInterval)
    return () => clearInterval(interval)
  }, [user, loading, checkSession, checkInterval])

  // 자동 로그아웃 설정
  useEffect(() => {
    if (!user || loading) return

    const cleanup = setupAutoLogout()
    return cleanup
  }, [user, loading, setupAutoLogout])

  // 페이지 가시성 변경 시 세션 체크
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [checkSession])

  return {
    user,
    loading,
    checkSession,
    extendSession,
    handleSessionExpiry
  }
}