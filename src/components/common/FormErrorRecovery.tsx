'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, Save, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useFormDataPreservation } from '@/lib/dataErrorRecovery'
import DataErrorRecovery, { DataValidationError } from '@/lib/dataErrorRecovery'

interface FormErrorRecoveryProps {
  formId: string
  onRestore?: (data: any) => void
  onClearBackup?: () => void
  className?: string
}

// 폼 데이터 백업 복구 컴포넌트
export function FormDataBackupNotification({ 
  formId, 
  onRestore, 
  onClearBackup,
  className = '' 
}: FormErrorRecoveryProps) {
  const { hasBackup, restoreData, clearBackup } = useFormDataPreservation(formId)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    setShowNotification(hasBackup)
  }, [hasBackup])

  if (!showNotification) return null

  const handleRestore = () => {
    const data = restoreData()
    if (data && onRestore) {
      onRestore(data)
    }
    setShowNotification(false)
  }

  const handleClearBackup = () => {
    clearBackup()
    if (onClearBackup) {
      onClearBackup()
    }
    setShowNotification(false)
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <Save className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-800">
            저장된 폼 데이터가 있습니다
          </h4>
          <p className="text-sm text-blue-700 mt-1">
            이전에 작성하던 내용을 복구하시겠습니까?
          </p>
          
          <div className="flex space-x-3 mt-3">
            <button
              onClick={handleRestore}
              className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              <RefreshCw className="w-3 h-3" />
              <span>복구</span>
            </button>
            
            <button
              onClick={handleClearBackup}
              className="inline-flex items-center space-x-1 px-3 py-1 border border-blue-300 text-blue-700 text-sm rounded hover:bg-blue-100"
            >
              <Trash2 className="w-3 h-3" />
              <span>삭제</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 폼 검증 에러 표시 컴포넌트
interface FormValidationErrorsProps {
  errors: DataValidationError[]
  onFieldFocus?: (fieldName: string) => void
  className?: string
}

export function FormValidationErrors({ 
  errors, 
  onFieldFocus,
  className = '' 
}: FormValidationErrorsProps) {
  if (errors.length === 0) return null

  const groupedErrors = errors.reduce((acc, error) => {
    if (!acc[error.field]) {
      acc[error.field] = []
    }
    acc[error.field].push(error)
    return acc
  }, {} as Record<string, DataValidationError[]>)

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            입력 정보를 확인해주세요
          </h4>
          
          <div className="space-y-2">
            {Object.entries(groupedErrors).map(([field, fieldErrors]) => (
              <div key={field} className="text-sm">
                <button
                  onClick={() => onFieldFocus?.(field)}
                  className="font-medium text-red-700 hover:text-red-900 hover:underline text-left"
                >
                  {getFieldDisplayName(field)}
                </button>
                <ul className="ml-4 mt-1 space-y-1">
                  {fieldErrors.map((error, index) => (
                    <li key={index} className="text-red-600">
                      • {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 필드명을 사용자 친화적으로 변환
function getFieldDisplayName(fieldName: string): string {
  const fieldNames: Record<string, string> = {
    'name': '이름',
    'email': '이메일',
    'password': '비밀번호',
    'phone': '전화번호',
    'address': '주소',
    'birthDate': '생년월일',
    'gender': '성별',
    'licenseNumber': '면허번호',
    'hospitalCode': '병원 코드',
    'inviteCode': '초대 코드',
    'title': '제목',
    'content': '내용',
    'description': '설명'
  }
  
  return fieldNames[fieldName] || fieldName
}

// 폼 제출 에러 처리 컴포넌트
interface FormSubmissionErrorProps {
  error: any
  onRetry?: () => void
  onSaveDraft?: () => void
  isRetrying?: boolean
  className?: string
}

export function FormSubmissionError({ 
  error, 
  onRetry, 
  onSaveDraft,
  isRetrying = false,
  className = '' 
}: FormSubmissionErrorProps) {
  if (!error) return null

  const getErrorMessage = (error: any): string => {
    if (error.message) return error.message
    if (error.details?.message) return error.details.message
    if (typeof error === 'string') return error
    return '알 수 없는 오류가 발생했습니다.'
  }

  const getErrorType = (error: any): 'network' | 'validation' | 'server' | 'unknown' => {
    if (error.name === 'NetworkError' || error.message?.includes('Network')) {
      return 'network'
    }
    if (error.status >= 400 && error.status < 500) {
      return 'validation'
    }
    if (error.status >= 500) {
      return 'server'
    }
    return 'unknown'
  }

  const errorType = getErrorType(error)
  const errorMessage = getErrorMessage(error)

  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case 'validation':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'server':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />
    }
  }

  const getErrorTitle = () => {
    switch (errorType) {
      case 'network':
        return '네트워크 연결 오류'
      case 'validation':
        return '입력 정보 오류'
      case 'server':
        return '서버 오류'
      default:
        return '제출 실패'
    }
  }

  const getSuggestion = () => {
    switch (errorType) {
      case 'network':
        return '네트워크 연결을 확인하고 다시 시도해주세요.'
      case 'validation':
        return '입력 정보를 확인하고 다시 시도해주세요.'
      case 'server':
        return '잠시 후 다시 시도해주세요.'
      default:
        return '문제가 지속되면 관리자에게 문의해주세요.'
    }
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-start space-x-3">
        {getErrorIcon()}
        
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800">
            {getErrorTitle()}
          </h4>
          <p className="text-sm text-red-700 mt-1">
            {errorMessage}
          </p>
          <p className="text-sm text-red-600 mt-1">
            {getSuggestion()}
          </p>
          
          <div className="flex space-x-3 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? '재시도 중...' : '다시 시도'}</span>
              </button>
            )}
            
            {onSaveDraft && (
              <button
                onClick={onSaveDraft}
                className="inline-flex items-center space-x-1 px-3 py-1 border border-red-300 text-red-700 text-sm rounded hover:bg-red-100"
              >
                <Save className="w-3 h-3" />
                <span>임시 저장</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 데이터 로딩 실패 복구 컴포넌트
interface DataLoadingErrorProps {
  error: any
  onRetry?: () => void
  onUseCachedData?: () => void
  onUseFallbackData?: () => void
  isRetrying?: boolean
  hasCachedData?: boolean
  hasFallbackData?: boolean
  className?: string
}

export function DataLoadingError({ 
  error, 
  onRetry, 
  onUseCachedData,
  onUseFallbackData,
  isRetrying = false,
  hasCachedData = false,
  hasFallbackData = false,
  className = '' 
}: DataLoadingErrorProps) {
  if (!error) return null

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1">
          <h4 className="text-sm font-medium text-yellow-800">
            데이터를 불러올 수 없습니다
          </h4>
          <p className="text-sm text-yellow-700 mt-1">
            {error.message || '데이터 로딩 중 오류가 발생했습니다.'}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? '재시도 중...' : '다시 시도'}</span>
              </button>
            )}
            
            {hasCachedData && onUseCachedData && (
              <button
                onClick={onUseCachedData}
                className="inline-flex items-center space-x-1 px-3 py-1 border border-yellow-300 text-yellow-700 text-sm rounded hover:bg-yellow-100"
              >
                <Save className="w-3 h-3" />
                <span>이전 데이터 사용</span>
              </button>
            )}
            
            {hasFallbackData && onUseFallbackData && (
              <button
                onClick={onUseFallbackData}
                className="inline-flex items-center space-x-1 px-3 py-1 border border-yellow-300 text-yellow-700 text-sm rounded hover:bg-yellow-100"
              >
                <CheckCircle className="w-3 h-3" />
                <span>기본 데이터 사용</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 통합 에러 복구 컴포넌트
interface ErrorRecoveryPanelProps {
  error: any
  errorType: 'form' | 'data' | 'network'
  recoveryOptions: {
    retry?: () => void
    useCachedData?: () => void
    useFallbackData?: () => void
    saveDraft?: () => void
    clearError?: () => void
  }
  isRetrying?: boolean
  className?: string
}

export function ErrorRecoveryPanel({ 
  error, 
  errorType, 
  recoveryOptions,
  isRetrying = false,
  className = '' 
}: ErrorRecoveryPanelProps) {
  if (!error) return null

  const getErrorConfig = () => {
    switch (errorType) {
      case 'form':
        return {
          title: '폼 제출 실패',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-800'
        }
      case 'data':
        return {
          title: '데이터 로딩 실패',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800'
        }
      case 'network':
        return {
          title: '네트워크 오류',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-600',
          textColor: 'text-orange-800'
        }
      default:
        return {
          title: '오류 발생',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          textColor: 'text-gray-800'
        }
    }
  }

  const config = getErrorConfig()

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className={`w-5 h-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
        
        <div className="flex-1">
          <h4 className={`text-sm font-medium ${config.textColor}`}>
            {config.title}
          </h4>
          <p className={`text-sm ${config.textColor} opacity-90 mt-1`}>
            {error.message || '처리 중 오류가 발생했습니다.'}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {recoveryOptions.retry && (
              <button
                onClick={recoveryOptions.retry}
                disabled={isRetrying}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? '재시도 중...' : '다시 시도'}</span>
              </button>
            )}
            
            {recoveryOptions.useCachedData && (
              <button
                onClick={recoveryOptions.useCachedData}
                className="inline-flex items-center space-x-1 px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100"
              >
                <Save className="w-3 h-3" />
                <span>이전 데이터</span>
              </button>
            )}
            
            {recoveryOptions.useFallbackData && (
              <button
                onClick={recoveryOptions.useFallbackData}
                className="inline-flex items-center space-x-1 px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100"
              >
                <CheckCircle className="w-3 h-3" />
                <span>기본 데이터</span>
              </button>
            )}
            
            {recoveryOptions.saveDraft && (
              <button
                onClick={recoveryOptions.saveDraft}
                className="inline-flex items-center space-x-1 px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100"
              >
                <Save className="w-3 h-3" />
                <span>임시 저장</span>
              </button>
            )}
            
            {recoveryOptions.clearError && (
              <button
                onClick={recoveryOptions.clearError}
                className="inline-flex items-center space-x-1 px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100"
              >
                <XCircle className="w-3 h-3" />
                <span>닫기</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}