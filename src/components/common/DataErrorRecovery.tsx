'use client'

import React, { useState } from 'react'
import { AlertTriangle, RefreshCw, Download, Upload, Clock, CheckCircle } from 'lucide-react'
import { useDataRecovery } from '@/hooks/useDataRecovery'

interface DataErrorRecoveryProps {
  dataKey: string
  schema?: any
  children: (data: any, actions: DataRecoveryActions) => React.ReactNode
  fallback?: React.ReactNode
  showRecoveryUI?: boolean
}

interface DataRecoveryActions {
  reload: () => Promise<any>
  recover: () => Promise<any>
  backup: () => Promise<boolean>
  validate: (data: any) => Promise<boolean>
}

export default function DataErrorRecovery({
  dataKey,
  schema,
  children,
  fallback,
  showRecoveryUI = true
}: DataErrorRecoveryProps) {
  const {
    data,
    isLoading,
    isRecovering,
    error,
    hasBackup,
    lastBackupTime,
    corruptionDetected,
    loadData,
    recoverData,
    createBackup,
    validateData,
    clearError,
    clearCorruption
  } = useDataRecovery({
    key: dataKey,
    schema,
    autoRecover: false, // 수동 복구로 설정
    onRecoverySuccess: (recoveredData) => {
      console.log('데이터 복구 성공:', recoveredData)
    },
    onRecoveryFailure: (error) => {
      console.error('데이터 복구 실패:', error)
    }
  })

  const [showDetails, setShowDetails] = useState(false)

  const actions: DataRecoveryActions = {
    reload: loadData,
    recover: recoverData,
    backup: createBackup,
    validate: validateData
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-gray-600">데이터를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              데이터 로드 실패
            </h3>
            <p className="text-red-700 mb-4">
              {error.message || '데이터를 불러올 수 없습니다.'}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadData}
                disabled={isRecovering}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
                다시 시도
              </button>

              {hasBackup && (
                <button
                  onClick={recoverData}
                  disabled={isRecovering}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  백업에서 복구
                </button>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                세부 정보
              </button>
            </div>

            {showDetails && (
              <div className="mt-4 p-4 bg-red-100 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">에러 세부 정보</h4>
                <pre className="text-sm text-red-700 whitespace-pre-wrap">
                  {error.stack || error.message}
                </pre>
                {hasBackup && lastBackupTime && (
                  <p className="text-sm text-red-600 mt-2">
                    마지막 백업: {lastBackupTime.toLocaleString('ko-KR')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {fallback && (
          <div className="mt-6 pt-6 border-t border-red-200">
            <h4 className="text-sm font-medium text-red-800 mb-3">대체 콘텐츠</h4>
            {fallback}
          </div>
        )}
      </div>
    )
  }

  // 데이터 손상 감지 시
  if (corruptionDetected && showRecoveryUI) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-yellow-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              데이터 손상 감지
            </h3>
            <p className="text-yellow-700 mb-4">
              데이터가 손상되었을 가능성이 있습니다. 백업에서 복구하거나 데이터를 다시 로드해주세요.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={recoverData}
                disabled={isRecovering}
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                <Download className={`w-4 h-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
                백업에서 복구
              </button>

              <button
                onClick={loadData}
                disabled={isRecovering}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 로드
              </button>

              <button
                onClick={clearCorruption}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                무시하고 계속
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 정상 상태 - 데이터와 함께 children 렌더링
  return (
    <div className="relative">
      {children(data, actions)}
      
      {/* 복구 중 오버레이 */}
      {isRecovering && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-lg">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-gray-700">데이터 복구 중...</span>
          </div>
        </div>
      )}

      {/* 백업 상태 표시 (개발 모드에서만) */}
      {process.env.NODE_ENV === 'development' && showRecoveryUI && (
        <DataRecoveryStatus
          hasBackup={hasBackup}
          lastBackupTime={lastBackupTime}
          onCreateBackup={createBackup}
          onRecover={recoverData}
          isRecovering={isRecovering}
        />
      )}
    </div>
  )
}

// 백업 상태 표시 컴포넌트
function DataRecoveryStatus({
  hasBackup,
  lastBackupTime,
  onCreateBackup,
  onRecover,
  isRecovering
}: {
  hasBackup: boolean
  lastBackupTime: Date | null
  onCreateBackup: () => Promise<boolean>
  onRecover: () => Promise<any>
  isRecovering: boolean
}) {
  const [showStatus, setShowStatus] = useState(false)

  return (
    <div className="absolute top-2 right-2">
      <button
        onClick={() => setShowStatus(!showStatus)}
        className={`p-2 rounded-full text-xs ${
          hasBackup 
            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={hasBackup ? '백업 있음' : '백업 없음'}
      >
        {hasBackup ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <AlertTriangle className="w-4 h-4" />
        )}
      </button>

      {showStatus && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">데이터 복구 상태</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">백업 상태:</span>
              <span className={`text-sm font-medium ${
                hasBackup ? 'text-green-600' : 'text-red-600'
              }`}>
                {hasBackup ? '있음' : '없음'}
              </span>
            </div>

            {lastBackupTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">마지막 백업:</span>
                <span className="text-sm text-gray-900">
                  {lastBackupTime.toLocaleString('ko-KR')}
                </span>
              </div>
            )}

            <div className="flex space-x-2 pt-2 border-t border-gray-200">
              <button
                onClick={onCreateBackup}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Upload className="w-3 h-3 mr-1" />
                백업
              </button>

              {hasBackup && (
                <button
                  onClick={onRecover}
                  disabled={isRecovering}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  <Download className={`w-3 h-3 mr-1 ${isRecovering ? 'animate-spin' : ''}`} />
                  복구
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 간단한 데이터 복구 버튼 컴포넌트
export function DataRecoveryButton({
  dataKey,
  onSuccess,
  onError,
  className = ''
}: {
  dataKey: string
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  className?: string
}) {
  const [isRecovering, setIsRecovering] = useState(false)

  const handleRecover = async () => {
    setIsRecovering(true)
    
    try {
      const { recoverData } = useDataRecovery({ key: dataKey })
      const recoveredData = await recoverData()
      
      if (recoveredData) {
        onSuccess?.(recoveredData)
      } else {
        throw new Error('복구할 데이터를 찾을 수 없습니다.')
      }
    } catch (error) {
      onError?.(error as Error)
    } finally {
      setIsRecovering(false)
    }
  }

  return (
    <button
      onClick={handleRecover}
      disabled={isRecovering}
      className={`inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 ${className}`}
    >
      <Download className={`w-4 h-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
      {isRecovering ? '복구 중...' : '데이터 복구'}
    </button>
  )
}