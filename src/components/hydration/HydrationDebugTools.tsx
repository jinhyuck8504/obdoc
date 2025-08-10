'use client'

import React, { useState, useEffect } from 'react'
import { ClientOnly } from '@/components/hydration'
import { hydrationErrorLogger } from '@/lib/hydration/errorLogger'
import { recoveryManager, hydrationUtils } from '@/lib/hydration/recoveryUtils'
import { HTMLValidationDevTools } from '@/lib/hydration/htmlValidator'
import { 
  Bug, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Settings,
  Download,
  Trash2,
  Activity
} from 'lucide-react'

interface HydrationDebugToolsProps {
  enabled?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

/**
 * Hydration 디버깅을 위한 통합 개발 도구
 */
export default function HydrationDebugTools({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-left'
}: HydrationDebugToolsProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'errors' | 'recovery' | 'validation' | 'settings'>('errors')
  const [errorLogs, setErrorLogs] = useState<any[]>([])
  const [hydrationStatus, setHydrationStatus] = useState({
    isHydrating: false,
    hasErrors: false,
    errorCount: 0
  })
  const [autoMonitoring, setAutoMonitoring] = useState(false)

  useEffect(() => {
    if (!enabled) return

    // 저장된 오류 로그 로드
    const logs = hydrationErrorLogger.getStoredLogs()
    setErrorLogs(logs)
    setHydrationStatus(prev => ({
      ...prev,
      hasErrors: logs.length > 0,
      errorCount: logs.length
    }))

    // Hydration 상태 감지
    const checkHydrationStatus = () => {
      setHydrationStatus(prev => ({
        ...prev,
        isHydrating: hydrationUtils.isHydrating()
      }))
    }

    const interval = setInterval(checkHydrationStatus, 1000)
    return () => clearInterval(interval)
  }, [enabled])

  const handleClearLogs = () => {
    hydrationErrorLogger.clearStoredLogs()
    setErrorLogs([])
    setHydrationStatus(prev => ({
      ...prev,
      hasErrors: false,
      errorCount: 0
    }))
  }

  const handleDownloadLogs = () => {
    const logs = hydrationErrorLogger.getStoredLogs()
    const dataStr = JSON.stringify(logs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hydration-errors-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleRunRecovery = async (strategyName?: string) => {
    const success = await recoveryManager.executeRecovery(strategyName)
    if (success) {
      console.log(`Recovery strategy '${strategyName}' executed successfully`)
    }
  }

  const handleValidateHTML = () => {
    HTMLValidationDevTools.validateCurrentPage()
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      default:
        return 'bottom-4 left-4'
    }
  }

  const getStatusColor = () => {
    if (hydrationStatus.hasErrors) return 'bg-red-500 hover:bg-red-600'
    if (hydrationStatus.isHydrating) return 'bg-yellow-500 hover:bg-yellow-600'
    return 'bg-green-500 hover:bg-green-600'
  }

  if (!enabled) return null

  return (
    <ClientOnly>
      <div className={`fixed ${getPositionClasses()} z-[9999]`}>
        {/* 토글 버튼 */}
        <button
          onClick={() => setIsVisible(!isVisible)}
          className={`
            w-12 h-12 rounded-full shadow-lg transition-all duration-200
            flex items-center justify-center text-white font-bold
            ${getStatusColor()}
          `}
          title="Hydration 디버깅 도구"
        >
          {hydrationStatus.hasErrors ? (
            <AlertTriangle className="w-6 h-6" />
          ) : hydrationStatus.isHydrating ? (
            <Activity className="w-6 h-6 animate-pulse" />
          ) : (
            <Bug className="w-6 h-6" />
          )}
          {hydrationStatus.errorCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {hydrationStatus.errorCount > 9 ? '9+' : hydrationStatus.errorCount}
            </span>
          )}
        </button>

        {/* 디버깅 도구 패널 */}
        {isVisible && (
          <div className="absolute bottom-14 left-0 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bug className="w-5 h-5 mr-2" />
                Hydration Debug
              </h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <EyeOff className="w-5 h-5" />
              </button>
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex border-b border-gray-200">
              {[
                { key: 'errors', label: '오류', icon: AlertTriangle },
                { key: 'recovery', label: '복구', icon: RefreshCw },
                { key: 'validation', label: '검증', icon: CheckCircle },
                { key: 'settings', label: '설정', icon: Settings }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`
                    flex-1 px-3 py-2 text-sm font-medium flex items-center justify-center
                    ${activeTab === key 
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {label}
                </button>
              ))}
            </div>

            {/* 탭 콘텐츠 */}
            <div className="p-4 max-h-64 overflow-y-auto">
              {activeTab === 'errors' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      오류 로그 ({errorLogs.length}개)
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleDownloadLogs}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        disabled={errorLogs.length === 0}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleClearLogs}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={errorLogs.length === 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {errorLogs.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      Hydration 오류가 없습니다
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {errorLogs.slice(-5).map((log, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded p-2">
                          <div className="text-sm font-medium text-red-800">
                            {log.component}
                          </div>
                          <div className="text-xs text-red-600 mt-1">
                            {log.error}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'recovery' && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    복구 전략
                  </div>
                  {recoveryManager.getAvailableStrategies().map((strategy) => (
                    <button
                      key={strategy.name}
                      onClick={() => handleRunRecovery(strategy.name)}
                      className="w-full text-left p-2 border border-gray-200 rounded hover:bg-gray-50"
                    >
                      <div className="font-medium text-sm">{strategy.name}</div>
                      <div className="text-xs text-gray-600">{strategy.description}</div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'validation' && (
                <div className="space-y-3">
                  <button
                    onClick={handleValidateHTML}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                  >
                    HTML 구조 검증 실행
                  </button>
                  <div className="text-xs text-gray-500">
                    콘솔에서 결과를 확인하세요
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={autoMonitoring}
                      onChange={(e) => {
                        setAutoMonitoring(e.target.checked)
                        if (e.target.checked) {
                          HTMLValidationDevTools.enableAutoValidation()
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">자동 모니터링</span>
                  </label>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    개발 환경에서만 표시됩니다. 콘솔에서 더 자세한 정보를 확인할 수 있습니다.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ClientOnly>
  )
}