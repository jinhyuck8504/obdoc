'use client'

import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useNetworkErrorHandler } from '@/lib/networkErrorHandler'

interface NetworkStatusIndicatorProps {
  showDetails?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
}

export default function NetworkStatusIndicator({ 
  showDetails = false, 
  position = 'top-right',
  className = ''
}: NetworkStatusIndicatorProps) {
  const { isOnline, networkQuality } = useNetworkErrorHandler()
  const [showNotification, setShowNotification] = useState(false)
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null)

  useEffect(() => {
    if (!isOnline) {
      setLastOfflineTime(new Date())
      setShowNotification(true)
    } else if (lastOfflineTime) {
      setShowNotification(true)
      // 온라인 복구 알림을 3초 후 자동 숨김
      const timer = setTimeout(() => setShowNotification(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, lastOfflineTime])

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />
    }

    if (networkQuality) {
      switch (networkQuality.quality) {
        case 'excellent':
          return <Wifi className="w-4 h-4 text-green-500" />
        case 'good':
          return <Wifi className="w-4 h-4 text-blue-500" />
        case 'fair':
          return <Wifi className="w-4 h-4 text-yellow-500" />
        case 'poor':
          return <AlertTriangle className="w-4 h-4 text-red-500" />
        default:
          return <Wifi className="w-4 h-4 text-gray-500" />
      }
    }

    return <Wifi className="w-4 h-4 text-gray-500" />
  }

  const getStatusText = () => {
    if (!isOnline) return '오프라인'
    
    if (networkQuality) {
      switch (networkQuality.quality) {
        case 'excellent': return '연결 상태 우수'
        case 'good': return '연결 상태 양호'
        case 'fair': return '연결 상태 보통'
        case 'poor': return '연결 상태 불량'
        default: return '연결 확인 중'
      }
    }
    
    return '연결 확인 중'
  }

  const getLatencyText = () => {
    if (!networkQuality || networkQuality.latency < 0) return ''
    return `${Math.round(networkQuality.latency)}ms`
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  return (
    <>
      {/* 상태 표시기 */}
      <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
        <div className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg transition-all duration-300
          ${isOnline 
            ? 'bg-white border border-gray-200' 
            : 'bg-red-50 border border-red-200'
          }
        `}>
          {getStatusIcon()}
          
          {showDetails && (
            <div className="text-xs">
              <div className="font-medium text-gray-900">{getStatusText()}</div>
              {networkQuality && networkQuality.latency >= 0 && (
                <div className="text-gray-500">{getLatencyText()}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 연결 상태 변경 알림 */}
      {showNotification && (
        <NetworkStatusNotification
          isOnline={isOnline}
          onClose={() => setShowNotification(false)}
        />
      )}
    </>
  )
}

// 네트워크 상태 변경 알림 컴포넌트
interface NetworkStatusNotificationProps {
  isOnline: boolean
  onClose: () => void
}

function NetworkStatusNotification({ isOnline, onClose }: NetworkStatusNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000) // 5초 후 자동 닫기
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`
        flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg max-w-sm
        ${isOnline 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
        }
      `}>
        {isOnline ? (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        ) : (
          <WifiOff className="w-5 h-5 text-red-500 flex-shrink-0" />
        )}
        
        <div className="flex-1">
          <div className={`font-medium text-sm ${
            isOnline ? 'text-green-800' : 'text-red-800'
          }`}>
            {isOnline ? '인터넷 연결 복구됨' : '인터넷 연결 끊어짐'}
          </div>
          <div className={`text-xs ${
            isOnline ? 'text-green-600' : 'text-red-600'
          }`}>
            {isOnline 
              ? '모든 기능을 정상적으로 사용할 수 있습니다.' 
              : '일부 기능이 제한될 수 있습니다.'
            }
          </div>
        </div>
        
        <button
          onClick={onClose}
          className={`text-xs px-2 py-1 rounded ${
            isOnline 
              ? 'text-green-700 hover:bg-green-100' 
              : 'text-red-700 hover:bg-red-100'
          }`}
        >
          닫기
        </button>
      </div>
    </div>
  )
}

// 오프라인 상태 전체 화면 오버레이
export function OfflineOverlay() {
  const { isOnline } = useNetworkErrorHandler()
  const [showOverlay, setShowOverlay] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      // 오프라인 상태가 5초 이상 지속되면 오버레이 표시
      const timer = setTimeout(() => setShowOverlay(true), 5000)
      return () => clearTimeout(timer)
    } else {
      setShowOverlay(false)
    }
  }, [isOnline])

  if (!showOverlay || isOnline) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
        <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          인터넷 연결 없음
        </h2>
        
        <p className="text-gray-600 mb-6">
          네트워크 연결을 확인하고 다시 시도해주세요.
          일부 기능은 오프라인에서도 사용할 수 있습니다.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
          
          <button
            onClick={() => setShowOverlay(false)}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            오프라인으로 계속
          </button>
        </div>
      </div>
    </div>
  )
}

// 네트워크 상태에 따른 기능 제한 안내
export function NetworkLimitedFeatureWarning({ feature }: { feature: string }) {
  const { isOnline, networkQuality } = useNetworkErrorHandler()
  
  if (isOnline && networkQuality?.quality !== 'poor') return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
      <div className="flex items-start space-x-2">
        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <div className="font-medium text-yellow-800">
            {!isOnline ? '오프라인 상태' : '네트워크 상태 불량'}
          </div>
          <div className="text-yellow-700">
            {feature} 기능이 제한될 수 있습니다. 
            {!isOnline 
              ? ' 인터넷 연결을 확인해주세요.' 
              : ' 네트워크 상태가 개선되면 정상 작동합니다.'
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// 재시도 버튼 컴포넌트
export function RetryButton({ 
  onRetry, 
  isRetrying = false, 
  className = '' 
}: { 
  onRetry: () => void
  isRetrying?: boolean
  className?: string 
}) {
  return (
    <button
      onClick={onRetry}
      disabled={isRetrying}
      className={`
        inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 
        rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 
        disabled:opacity-50 disabled:cursor-not-allowed ${className}
      `}
    >
      {isRetrying ? (
        <>
          <Clock className="w-4 h-4 animate-spin" />
          <span>재시도 중...</span>
        </>
      ) : (
        <>
          <AlertTriangle className="w-4 h-4" />
          <span>다시 시도</span>
        </>
      )}
    </button>
  )
}