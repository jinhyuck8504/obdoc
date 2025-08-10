'use client'
import React, { useState } from 'react'
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  X, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  RefreshCw,
  MessageCircle,
  HelpCircle
} from 'lucide-react'
import { AppError } from '@/lib/error/errorHandler'

// 인라인 오류 메시지 컴포넌트
interface InlineErrorProps {
  message: string
  suggestions?: string[]
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function InlineError({ 
  message, 
  suggestions, 
  onRetry, 
  onDismiss, 
  className = '' 
}: InlineErrorProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800 font-medium">{message}</p>
          
          {/* 제안사항 토글 */}
          {suggestions && suggestions.length > 0 && (
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="mt-2 flex items-center text-xs text-red-600 hover:text-red-800 transition-colors"
            >
              <HelpCircle className="w-3 h-3 mr-1" />
              해결 방법 {showSuggestions ? '숨기기' : '보기'}
              {showSuggestions ? (
                <ChevronUp className="w-3 h-3 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </button>
          )}

          {/* 제안사항 목록 */}
          {showSuggestions && suggestions && (
            <div className="mt-2 p-2 bg-red-100 rounded text-xs">
              <ul className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start text-red-700">
                    <span className="mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="mt-3 flex items-center space-x-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>다시 시도</span>
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs text-red-600 hover:text-red-800 transition-colors"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 성공 메시지 컴포넌트
interface SuccessMessageProps {
  message: string
  description?: string
  onDismiss?: () => void
  autoHide?: boolean
  duration?: number
  className?: string
}

export function SuccessMessage({ 
  message, 
  description, 
  onDismiss, 
  autoHide = true, 
  duration = 5000,
  className = '' 
}: SuccessMessageProps) {
  const [visible, setVisible] = useState(true)

  React.useEffect(() => {
    if (autoHide && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [autoHide, duration, onDismiss])

  if (!visible) return null

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-start">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <p className="text-sm text-green-800 font-medium">{message}</p>
          {description && (
            <p className="mt-1 text-xs text-green-700">{description}</p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={() => {
              setVisible(false)
              onDismiss()
            }}
            className="ml-2 text-green-600 hover:text-green-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// 경고 메시지 컴포넌트
interface WarningMessageProps {
  message: string
  description?: string
  actions?: Array<{
    label: string
    action: () => void
    style?: 'primary' | 'secondary'
  }>
  onDismiss?: () => void
  className?: string
}

export function WarningMessage({ 
  message, 
  description, 
  actions, 
  onDismiss, 
  className = '' 
}: WarningMessageProps) {
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-800 font-medium">{message}</p>
          {description && (
            <p className="mt-1 text-xs text-yellow-700">{description}</p>
          )}
          
          {/* 액션 버튼들 */}
          {actions && actions.length > 0 && (
            <div className="mt-3 flex items-center space-x-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`
                    px-3 py-1 text-xs font-medium rounded transition-colors
                    ${action.style === 'primary' 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                      : 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 text-yellow-600 hover:text-yellow-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// 정보 메시지 컴포넌트
interface InfoMessageProps {
  message: string
  description?: string
  link?: {
    text: string
    href: string
    external?: boolean
  }
  onDismiss?: () => void
  className?: string
}

export function InfoMessage({ 
  message, 
  description, 
  link, 
  onDismiss, 
  className = '' 
}: InfoMessageProps) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-start">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <p className="text-sm text-blue-800 font-medium">{message}</p>
          {description && (
            <p className="mt-1 text-xs text-blue-700">{description}</p>
          )}
          
          {/* 링크 */}
          {link && (
            <a
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              {link.text}
              {link.external && <ExternalLink className="w-3 h-3 ml-1" />}
            </a>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// 오류 상세 정보 컴포넌트
interface ErrorDetailsProps {
  error: AppError
  onRetry?: () => void
  onReport?: () => void
  onDismiss?: () => void
  showTechnicalDetails?: boolean
}

export function ErrorDetails({ 
  error, 
  onRetry, 
  onReport, 
  onDismiss,
  showTechnicalDetails = false 
}: ErrorDetailsProps) {
  const [showDetails, setShowDetails] = useState(showTechnicalDetails)

  const getSeverityColor = () => {
    switch (error.severity) {
      case 'critical':
        return 'text-red-800 bg-red-100'
      case 'high':
        return 'text-red-700 bg-red-50'
      case 'medium':
        return 'text-yellow-700 bg-yellow-50'
      case 'low':
        return 'text-blue-700 bg-blue-50'
      default:
        return 'text-gray-700 bg-gray-50'
    }
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          {/* 오류 메시지 */}
          <h3 className="text-sm font-medium text-red-800">
            {error.userMessage}
          </h3>
          
          {/* 심각도 표시 */}
          <div className="mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor()}`}>
              {error.severity === 'critical' && '심각'}
              {error.severity === 'high' && '높음'}
              {error.severity === 'medium' && '보통'}
              {error.severity === 'low' && '낮음'}
            </span>
          </div>

          {/* 제안사항 */}
          {error.suggestions && error.suggestions.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-red-800 mb-2">해결 방법:</h4>
              <ul className="space-y-1">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start text-xs text-red-700">
                    <span className="mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 기술적 세부사항 토글 */}
          {(error.details || error.stack) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-3 flex items-center text-xs text-red-600 hover:text-red-800 transition-colors"
            >
              기술적 세부사항 {showDetails ? '숨기기' : '보기'}
              {showDetails ? (
                <ChevronUp className="w-3 h-3 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </button>
          )}

          {/* 기술적 세부사항 */}
          {showDetails && (
            <div className="mt-3 p-3 bg-red-100 rounded text-xs">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">오류 ID:</span> {error.id}
                </div>
                <div>
                  <span className="font-medium">타입:</span> {error.type}
                </div>
                <div>
                  <span className="font-medium">시간:</span> {error.timestamp.toLocaleString('ko-KR')}
                </div>
                {error.details && (
                  <div>
                    <span className="font-medium">세부사항:</span>
                    <pre className="mt-1 text-xs bg-red-200 p-2 rounded overflow-x-auto">
                      {JSON.stringify(error.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="mt-4 flex items-center space-x-2">
            {onRetry && error.retryable && (
              <button
                onClick={onRetry}
                className="flex items-center space-x-1 px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>다시 시도</span>
              </button>
            )}
            
            {onReport && (
              <button
                onClick={onReport}
                className="flex items-center space-x-1 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                <span>신고하기</span>
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs text-red-600 hover:text-red-800 transition-colors"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 빈 상태 컴포넌트 (개선된 버전)
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mb-4 flex justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}