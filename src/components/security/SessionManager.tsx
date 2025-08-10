'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { SessionSecurity, AuditLogger, SECURITY_CONFIG } from '@/lib/security'
import { useAuth } from '@/contexts/AuthContext'
import { useFeedback } from '@/hooks/useFeedback'
import { Clock, Shield, AlertTriangle, LogOut, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { HydrationBoundary } from '@/components/hydration'

interface SessionInfo {
  isActive: boolean
  timeRemaining: number
  lastActivity: number
  warningThreshold: number
  autoLogoutThreshold: number
}

export default function SessionManager() {
  const { user, signOut } = useAuth()
  const { showWarning: showWarningFeedback, showInfo } = useFeedback()
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    isActive: false,
    timeRemaining: 0,
    lastActivity: Date.now(),
    warningThreshold: 5 * 60 * 1000, // 5분
    autoLogoutThreshold: 1 * 60 * 1000 // 1분
  })
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [isExtending, setIsExtending] = useState(false)

  // 세션 상태 업데이트
  const updateSessionInfo = useCallback(() => {
    if (!user) {
      setSessionInfo(prev => ({ ...prev, isActive: false }))
      return
    }

    const now = Date.now()
    const sessionStart = parseInt(localStorage.getItem('session_start') || now.toString())
    const lastActivity = parseInt(localStorage.getItem('last_activity') || now.toString())
    const timeElapsed = now - sessionStart
    const timeRemaining = Math.max(0, SECURITY_CONFIG.SESSION_TIMEOUT - timeElapsed)

    setSessionInfo({
      isActive: timeRemaining > 0,
      timeRemaining,
      lastActivity,
      warningThreshold: 5 * 60 * 1000,
      autoLogoutThreshold: 1 * 60 * 1000
    })

    // 세션 만료 경고
    if (timeRemaining <= 5 * 60 * 1000 && timeRemaining > 1 * 60 * 1000 && !showWarningModal) {
      setShowWarningModal(true)
      showWarningFeedback({
        title: '세션 만료 경고',
        message: `${Math.ceil(timeRemaining / 60000)}분 후 자동 로그아웃됩니다.`,
        action: {
          label: '세션 연장',
          onClick: extendSession
        }
      })
    }

    // 자동 로그아웃
    if (timeRemaining <= 1 * 60 * 1000 && timeRemaining > 0) {
      handleAutoLogout()
    }
  }, [user, showWarningFeedback])

  // 세션 연장
  const extendSession = useCallback(async () => {
    if (!user) return

    setIsExtending(true)
    try {
      const now = Date.now()
      localStorage.setItem('session_start', now.toString())
      localStorage.setItem('last_activity', now.toString())
      
      // 새 세션 토큰 생성
      const newToken = SessionSecurity.createSession(user.id, user.role)
      
      // 감사 로그 기록
      AuditLogger.log(
        user.id,
        'session_extended',
        'authentication',
        { timestamp: now },
        'medium'
      )

      setShowWarningModal(false)
      showInfo({
        title: '세션 연장됨',
        message: '세션이 30분 연장되었습니다.'
      })

      updateSessionInfo()
    } catch (error) {
      console.error('Session extension failed:', error)
    } finally {
      setIsExtending(false)
    }
  }, [user, showInfo, updateSessionInfo])

  // 자동 로그아웃
  const handleAutoLogout = useCallback(async () => {
    if (!user) return

    // 감사 로그 기록
    AuditLogger.log(
      user.id,
      'auto_logout',
      'authentication',
      { reason: 'session_timeout' },
      'medium'
    )

    // 세션 정리
    SessionSecurity.destroySession()
    
    // 로그아웃 처리
    await signOut()

    showInfo({
      title: '자동 로그아웃',
      message: '보안을 위해 자동으로 로그아웃되었습니다.'
    })
  }, [user, signOut, showInfo])

  // 수동 로그아웃
  const handleManualLogout = useCallback(async () => {
    if (!user) return

    // 감사 로그 기록
    AuditLogger.log(
      user.id,
      'manual_logout',
      'authentication',
      {},
      'low'
    )

    // 세션 정리
    SessionSecurity.destroySession()
    
    // 로그아웃 처리
    await signOut()
  }, [user, signOut])

  // 활동 감지
  const handleUserActivity = useCallback(() => {
    if (!user) return

    const now = Date.now()
    localStorage.setItem('last_activity', now.toString())
    updateSessionInfo()
  }, [user, updateSessionInfo])

  // 이벤트 리스너 설정
  useEffect(() => {
    if (!user) return

    // 초기 세션 정보 설정
    const now = Date.now()
    if (!localStorage.getItem('session_start')) {
      localStorage.setItem('session_start', now.toString())
    }
    if (!localStorage.getItem('last_activity')) {
      localStorage.setItem('last_activity', now.toString())
    }

    // 주기적 업데이트
    const interval = setInterval(updateSessionInfo, 1000)

    // 사용자 활동 감지
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    // 페이지 가시성 변경 감지
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleUserActivity()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, updateSessionInfo, handleUserActivity])

  // 시간 포맷팅
  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 세션 상태 색상
  const getStatusColor = (): string => {
    if (sessionInfo.timeRemaining <= sessionInfo.autoLogoutThreshold) {
      return 'text-red-600'
    } else if (sessionInfo.timeRemaining <= sessionInfo.warningThreshold) {
      return 'text-yellow-600'
    }
    return 'text-green-600'
  }

  if (!user) return null

  return (
    <HydrationBoundary
      fallback={
        <div className="flex items-center space-x-2 text-sm">
          <Shield className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">--:--</span>
        </div>
      }
    >
      {/* 세션 상태 표시 (헤더용) */}
      <div className="flex items-center space-x-2 text-sm">
        <Shield className={`w-4 h-4 ${getStatusColor()}`} />
        <span className={getStatusColor()}>
          {formatTime(sessionInfo.timeRemaining)}
        </span>
      </div>

      {/* 세션 만료 경고 모달 */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                세션 만료 경고
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              보안을 위해 {formatTime(sessionInfo.timeRemaining)} 후 자동으로 로그아웃됩니다.
              계속 사용하시려면 세션을 연장해주세요.
            </p>
            
            <div className="flex space-x-3">
              <Button
                onClick={extendSession}
                disabled={isExtending}
                className="flex-1"
              >
                {isExtending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    연장 중...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    세션 연장
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleManualLogout}
                variant="outline"
                className="flex-1"
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      )}
    </HydrationBoundary>
  )
}

// 세션 정보 대시보드 컴포넌트
export function SessionDashboard() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<any[]>([])
  const [currentSession, setCurrentSession] = useState<any>(null)

  useEffect(() => {
    if (!user) return

    // 현재 세션 정보 가져오기
    const sessionStart = localStorage.getItem('session_start')
    const lastActivity = localStorage.getItem('last_activity')
    
    if (sessionStart && lastActivity) {
      setCurrentSession({
        id: 'current',
        startTime: new Date(parseInt(sessionStart)),
        lastActivity: new Date(parseInt(lastActivity)),
        ipAddress: 'Current Device',
        userAgent: navigator.userAgent,
        isActive: true
      })
    }

    // 이전 세션들 (실제로는 서버에서 가져와야 함)
    setSessions([
      {
        id: 'session-1',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        ipAddress: '192.168.1.100',
        userAgent: 'Chrome/91.0.4472.124',
        isActive: false
      }
    ])
  }, [user])

  if (!user) return null

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2" />
        세션 관리
      </h3>

      {/* 현재 세션 */}
      {currentSession && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-2">현재 세션</h4>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">
                  시작: {currentSession.startTime.toLocaleString('ko-KR')}
                </div>
                <div className="text-sm text-gray-600">
                  마지막 활동: {currentSession.lastActivity.toLocaleString('ko-KR')}
                </div>
                <div className="text-sm text-gray-600">
                  기기: {currentSession.ipAddress}
                </div>
              </div>
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                활성
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이전 세션들 */}
      {sessions.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-2">이전 세션</h4>
          <div className="space-y-2">
            {sessions.map(session => (
              <div key={session.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">
                      {session.startTime.toLocaleString('ko-KR')} - {session.endTime.toLocaleString('ko-KR')}
                    </div>
                    <div className="text-sm text-gray-600">
                      기기: {session.ipAddress}
                    </div>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    종료됨
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}