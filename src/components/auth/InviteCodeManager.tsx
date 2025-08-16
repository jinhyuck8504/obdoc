'use client'

import React, { useState, useEffect } from 'react'
import { InviteCode, InviteCodeGenerationRequest } from '@/types/hospital'
import { generateInviteCodeForDoctor, getInviteCodesByDoctor, deactivateInviteCode } from '@/lib/inviteCodeService'

// 컴포넌트에서 사용하는 확장된 InviteCode 타입
interface ExtendedInviteCode extends Omit<InviteCode, 'currentUses' | 'usageHistory'> {
  usedCount: number
  lastUsedAt?: Date
  description: string
}

// LoadingSpinner 컴포넌트
const LoadingSpinner = ({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) => {
  const sizeClasses = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-6 h-6' }
  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg className="w-full h-full text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  )
}

// QR 코드 생성 컴포넌트 (개선된 구현)
const QRCodeDisplay = ({ value, size = 200 }: { value: string; size?: number }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const generateQR = async () => {
      setIsLoading(true)
      setError('')
      
      try {
        // 가입 링크 생성
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const signupUrl = `${baseUrl}/signup?code=${encodeURIComponent(value)}`
        
        // QR 코드 생성 (QR Server API 사용)
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(signupUrl)}&format=png&margin=10`
        
        // 이미지 로드 확인
        const img = new Image()
        img.onload = () => {
          setQrCodeUrl(qrUrl)
          setIsLoading(false)
        }
        img.onerror = () => {
          setError('QR 코드 생성에 실패했습니다.')
          setIsLoading(false)
        }
        img.src = qrUrl
        
      } catch (error) {
        console.error('QR 코드 생성 실패:', error)
        setError('QR 코드 생성 중 오류가 발생했습니다.')
        setIsLoading(false)
      }
    }

    if (value) {
      generateQR()
    }
  }, [value, size])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center mb-2">
          <LoadingSpinner size="md" />
        </div>
        <p className="text-sm text-gray-500">QR 코드 생성 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center mb-2">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-red-600 text-center">{error}</p>
        <button
          onClick={() => {
            setError('')
            setIsLoading(true)
            // 재시도 로직은 useEffect에서 처리됨
          }}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
        <img 
          src={qrCodeUrl} 
          alt="QR Code" 
          className="mx-auto rounded"
          style={{ width: size, height: size }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-3">QR 코드를 스캔하여 가입하세요</p>
      <p className="text-xs text-gray-400 mt-1">코드: {value}</p>
    </div>
  )
}

interface InviteCodeManagerProps {
  doctorId: string
  hospitalCode: string
  hospitalName: string
  className?: string
}

export default function InviteCodeManager({
  doctorId,
  hospitalCode,
  hospitalName,
  className = ''
}: InviteCodeManagerProps) {
  // 상태 관리
  const [inviteCodes, setInviteCodes] = useState<ExtendedInviteCode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCode, setSelectedCode] = useState<ExtendedInviteCode | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showUsageHistory, setShowUsageHistory] = useState(false)
  const [usageHistory, setUsageHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [shareMethod, setShareMethod] = useState<'qr' | 'link' | 'email'>('qr')
  const [shareEmail, setShareEmail] = useState('')
  const [isSending, setIsSending] = useState(false)

  // 새 코드 생성 폼 데이터
  const [newCodeData, setNewCodeData] = useState({
    description: '',
    maxUses: 10,
    expiresInHours: 720, // 30일 = 720시간
    isActive: true
  })

  // 컴포넌트 마운트 시 기존 코드 목록 로드
  useEffect(() => {
    loadInviteCodes()
    loadNotifications()
    
    // 실시간 알림을 위한 폴링 (실제로는 WebSocket 사용 권장)
    const interval = setInterval(() => {
      loadNotifications()
    }, 30000) // 30초마다 확인

    return () => clearInterval(interval)
  }, [doctorId])

  // 알림 목록 로드
  const loadNotifications = async () => {
    try {
      const response = await fetch(`/api/doctors/${doctorId}/notifications`)
      const notifications = await response.json()
      setNotifications(notifications.filter((n: any) => n.type === 'invite_code_used'))
    } catch (error) {
      console.error('알림 로드 실패:', error)
    }
  }

  // 알림 읽음 처리
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error)
    }
  }

  // 가입 코드 목록 로드
  const loadInviteCodes = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const codes = await getInviteCodesByDoctor(doctorId)
      setInviteCodes(codes)
    } catch (error) {
      console.error('가입 코드 목록 로드 실패:', error)
      setError('가입 코드 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 새 가입 코드 생성
  const handleCreateCode = async () => {
    if (!newCodeData.description.trim()) {
      setError('코드 설명을 입력해주세요.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const request: InviteCodeGenerationRequest = {
        hospitalCode,
        expiresIn: newCodeData.expiresInHours,
        maxUses: newCodeData.maxUses,
        description: newCodeData.description
      }

      const result = await generateInviteCodeForDoctor(request, doctorId)

      if (result.success && result.inviteCode) {
        // 새 코드를 목록에 추가
        setInviteCodes(prev => [result.inviteCode!, ...prev])
        
        // 폼 초기화
        setNewCodeData({
          description: '',
          maxUses: 10,
          expiresInHours: 720,
          isActive: true
        })
        setShowCreateForm(false)
        
        // 성공 메시지 (선택적)
        console.log('가입 코드가 성공적으로 생성되었습니다:', result.inviteCode.code)
      } else {
        setError(result.error || '가입 코드 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('가입 코드 생성 중 오류:', error)
      setError('가입 코드 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  // 가입 코드 비활성화
  const handleDeactivateCode = async (codeId: string) => {
    if (!confirm('이 가입 코드를 비활성화하시겠습니까?')) {
      return
    }

    try {
      const result = await deactivateInviteCode(codeId, doctorId)
      
      if (result.success) {
        // 목록에서 상태 업데이트
        setInviteCodes(prev => 
          prev.map(code => 
            code.id === codeId 
              ? { ...code, isActive: false }
              : code
          )
        )
      } else {
        setError(result.error || '코드 비활성화에 실패했습니다.')
      }
    } catch (error) {
      console.error('코드 비활성화 중 오류:', error)
      setError('코드 비활성화 중 오류가 발생했습니다.')
    }
  }

  // 사용 내역 조회
  const loadUsageHistory = async (codeId: string) => {
    setIsLoadingHistory(true)
    try {
      // 실제로는 API 호출
      const response = await fetch(`/api/invite-codes/${codeId}/usage-history`)
      const history = await response.json()
      setUsageHistory(history)
      setShowUsageHistory(true)
    } catch (error) {
      console.error('사용 내역 조회 실패:', error)
      setError('사용 내역을 불러오는데 실패했습니다.')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // 코드 복사
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      // 복사 성공 피드백 (간단한 구현)
      const button = document.activeElement as HTMLButtonElement
      if (button) {
        const originalText = button.textContent
        button.textContent = '복사됨!'
        setTimeout(() => {
          button.textContent = originalText
        }, 2000)
      }
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
    }
  }

  // 이메일로 코드 공유
  const handleEmailShare = async () => {
    if (!shareEmail || !selectedCode) return

    setIsSending(true)
    try {
      const response = await fetch('/api/invite-codes/share-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeId: selectedCode.id,
          email: shareEmail,
          hospitalName,
          doctorId
        })
      })

      if (response.ok) {
        setShareEmail('')
        setShowQRModal(false)
        // 성공 알림
        alert('이메일이 성공적으로 전송되었습니다.')
      } else {
        throw new Error('이메일 전송 실패')
      }
    } catch (error) {
      console.error('이메일 전송 실패:', error)
      setError('이메일 전송에 실패했습니다.')
    } finally {
      setIsSending(false)
    }
  }

  // 링크 생성 및 복사
  const handleLinkShare = async () => {
    if (!selectedCode) return

    const shareUrl = `${window.location.origin}/signup?code=${selectedCode.code}&hospital=${encodeURIComponent(hospitalName)}`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('가입 링크가 클립보드에 복사되었습니다.')
    } catch (error) {
      console.error('링크 복사 실패:', error)
      setError('링크 복사에 실패했습니다.')
    }
  }

  // 코드 상태 표시 함수
  const getCodeStatus = (code: ExtendedInviteCode) => {
    if (!code.isActive) {
      return { text: '비활성', color: 'text-gray-500 bg-gray-100' }
    }
    
    if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
      return { text: '만료됨', color: 'text-red-600 bg-red-100' }
    }
    
    if (code.maxUses && code.usedCount >= code.maxUses) {
      return { text: '사용완료', color: 'text-orange-600 bg-orange-100' }
    }
    
    return { text: '활성', color: 'text-green-600 bg-green-100' }
  }

  // 폼 필드 변경 핸들러
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setNewCodeData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">고객 가입 코드 관리</h2>
          <p className="text-gray-600 mt-1">
            {hospitalName}의 고객 가입 코드를 생성하고 관리하세요.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* 알림 버튼 */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="알림"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v3.5" />
              </svg>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>

            {/* 알림 드롭다운 */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">최근 알림</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      새로운 알림이 없습니다.
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0">
                            <svg className="w-4 h-4 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleString('ko-KR')}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 5 && (
                  <div className="p-3 border-t border-gray-200 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      모든 알림 보기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            disabled={isLoading || isGenerating}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>새 코드 생성</span>
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-red-900">오류 발생</h4>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 새 코드 생성 폼 */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">새 가입 코드 생성</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* 코드 설명 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                코드 설명 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={newCodeData.description}
                onChange={handleFormChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 신규 고객용 가입 코드"
                disabled={isGenerating}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 최대 사용 횟수 */}
              <div>
                <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700 mb-1">
                  최대 사용 횟수
                </label>
                <input
                  id="maxUses"
                  name="maxUses"
                  type="number"
                  min="1"
                  max="1000"
                  value={newCodeData.maxUses}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isGenerating}
                />
              </div>

              {/* 만료 기간 */}
              <div>
                <label htmlFor="expiresInHours" className="block text-sm font-medium text-gray-700 mb-1">
                  만료 기간 (시간)
                </label>
                <select
                  id="expiresInHours"
                  name="expiresInHours"
                  value={newCodeData.expiresInHours}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isGenerating}
                >
                  <option value={24}>1일 (24시간)</option>
                  <option value={72}>3일 (72시간)</option>
                  <option value={168}>1주일 (168시간)</option>
                  <option value={720}>1개월 (720시간)</option>
                  <option value={2160}>3개월 (2160시간)</option>
                  <option value={4320}>6개월 (4320시간)</option>
                </select>
              </div>
            </div>

            {/* 생성 버튼 */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isGenerating}
              >
                취소
              </button>
              <button
                onClick={handleCreateCode}
                disabled={isGenerating || !newCodeData.description.trim()}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${isGenerating || !newCodeData.description.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }
                `}
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>생성 중...</span>
                  </div>
                ) : (
                  '코드 생성'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 가입 코드 목록 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">생성된 가입 코드</h3>
            <button
              onClick={loadInviteCodes}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>새로고침</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="md" />
            <p className="text-gray-500 mt-2">가입 코드를 불러오는 중...</p>
          </div>
        ) : inviteCodes.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">생성된 가입 코드가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">새 코드를 생성해보세요.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {inviteCodes.map((code) => {
              const status = getCodeStatus(code)
              return (
                <div key={code.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="font-mono text-lg font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded">
                          {code.code}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-2">{code.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">사용 현황:</span>
                          <p>{code.usedCount} / {code.maxUses || '무제한'}회</p>
                        </div>
                        <div>
                          <span className="font-medium">생성일:</span>
                          <p>{new Date(code.createdAt).toLocaleDateString('ko-KR')}</p>
                        </div>
                        <div>
                          <span className="font-medium">만료일:</span>
                          <p>
                            {code.expiresAt 
                              ? new Date(code.expiresAt).toLocaleDateString('ko-KR')
                              : '무제한'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">마지막 사용:</span>
                          <p>
                            {code.lastUsedAt 
                              ? new Date(code.lastUsedAt).toLocaleDateString('ko-KR')
                              : '사용 안함'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {/* 사용 내역 버튼 */}
                      <button
                        onClick={() => loadUsageHistory(code.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="사용 내역 보기"
                        disabled={code.usedCount === 0}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </button>

                      {/* 복사 버튼 */}
                      <button
                        onClick={() => handleCopyCode(code.code)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="코드 복사"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>

                      {/* 공유 버튼 */}
                      <button
                        onClick={() => {
                          setSelectedCode(code)
                          setShareMethod('qr')
                          setShowQRModal(true)
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="코드 공유"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      </button>

                      {/* 비활성화 버튼 */}
                      {code.isActive && (
                        <button
                          onClick={() => handleDeactivateCode(code.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="코드 비활성화"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 코드 공유 모달 */}
      {showQRModal && selectedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">코드 공유</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 공유 방법 선택 */}
            <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setShareMethod('qr')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  shareMethod === 'qr'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                QR 코드
              </button>
              <button
                onClick={() => setShareMethod('link')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  shareMethod === 'link'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                링크
              </button>
              <button
                onClick={() => setShareMethod('email')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  shareMethod === 'email'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                이메일
              </button>
            </div>

            <div className="space-y-4">
              {shareMethod === 'qr' && (
                <div className="text-center">
                  <QRCodeDisplay value={selectedCode.code} size={200} />
                  <div className="bg-gray-50 p-3 rounded mt-4">
                    <p className="font-mono text-sm text-gray-700">{selectedCode.code}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedCode.description}</p>
                  </div>
                  <button
                    onClick={() => handleCopyCode(selectedCode.code)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4"
                  >
                    코드 복사
                  </button>
                </div>
              )}

              {shareMethod === 'link' && (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600 mb-2">가입 링크:</p>
                    <p className="font-mono text-xs text-gray-800 break-all">
                      {`${window.location.origin}/signup?code=${selectedCode.code}&hospital=${encodeURIComponent(hospitalName)}`}
                    </p>
                  </div>
                  <button
                    onClick={handleLinkShare}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    링크 복사
                  </button>
                </div>
              )}

              {shareMethod === 'email' && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="shareEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      받는 사람 이메일
                    </label>
                    <input
                      id="shareEmail"
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="customer@example.com"
                      disabled={isSending}
                    />
                  </div>
                  <button
                    onClick={handleEmailShare}
                    disabled={!shareEmail || isSending}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      !shareEmail || isSending
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isSending ? (
                      <div className="flex items-center justify-center space-x-2">
                        <LoadingSpinner size="sm" />
                        <span>전송 중...</span>
                      </div>
                    ) : (
                      '이메일 전송'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 사용 내역 모달 */}
      {showUsageHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">코드 사용 내역</h3>
              <button
                onClick={() => setShowUsageHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="text-center py-8">
                <LoadingSpinner size="md" />
                <p className="text-gray-500 mt-2">사용 내역을 불러오는 중...</p>
              </div>
            ) : usageHistory.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">사용 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {usageHistory.map((usage, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {usage.customerName || '익명 고객'}
                          </span>
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            가입 완료
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">사용 시간:</span>
                            <p>{new Date(usage.usedAt).toLocaleString('ko-KR')}</p>
                          </div>
                          <div>
                            <span className="font-medium">IP 주소:</span>
                            <p>{usage.ipAddress}</p>
                          </div>
                          <div>
                            <span className="font-medium">이메일:</span>
                            <p>{usage.customerEmail || '미제공'}</p>
                          </div>
                          <div>
                            <span className="font-medium">브라우저:</span>
                            <p className="truncate" title={usage.userAgent}>
                              {usage.userAgent?.split(' ')[0] || '알 수 없음'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}