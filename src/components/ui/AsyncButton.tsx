'use client'
import React, { useState, useCallback } from 'react'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { withTimeout, GlobalErrorHandler } from '@/lib/apiUtils'

export interface AsyncButtonProps {
  onClick: () => Promise<void> | void
  children: React.ReactNode
  disabled?: boolean
  timeout?: number
  className?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  showErrorInline?: boolean
  retryOnError?: boolean
  preventDoubleClick?: boolean
}

export default function AsyncButton({
  onClick,
  children,
  disabled = false,
  timeout = 10000,
  className = '',
  variant = 'primary',
  size = 'md',
  showErrorInline = true,
  retryOnError = true,
  preventDoubleClick = true
}: AsyncButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = useCallback(async () => {
    // 중복 클릭 방지
    if (preventDoubleClick && (loading || disabled)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = onClick()
      
      // Promise인지 확인
      if (result instanceof Promise) {
        await withTimeout(result, timeout)
      }
    } catch (err) {
      const errorMessage = GlobalErrorHandler.handleApiError(err)
      setError(errorMessage)
      console.error('AsyncButton error:', err)
    } finally {
      setLoading(false)
    }
  }, [onClick, loading, disabled, timeout, preventDoubleClick])

  const handleRetry = useCallback(() => {
    setError(null)
    handleClick()
  }, [handleClick])

  // 기본 스타일 클래스
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  // 변형별 스타일
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 disabled:bg-blue-400',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 disabled:bg-gray-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-red-400',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300 focus:ring-gray-500 disabled:bg-gray-50 disabled:text-gray-400'
  }

  // 크기별 스타일
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  // 로딩 상태 스타일
  const loadingClasses = loading ? 'opacity-75 cursor-not-allowed' : ''

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${loadingClasses} ${className}`

  return (
    <div className="inline-block">
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={buttonClasses}
        type="button"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            처리 중...
          </>
        ) : (
          children
        )}
      </button>
      
      {/* 인라인 오류 표시 */}
      {showErrorInline && error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              {retryOnError && (
                <button
                  onClick={handleRetry}
                  className="mt-2 inline-flex items-center text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  다시 시도
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 간단한 로딩 버튼 (오류 표시 없음)
 */
export function LoadingButton({
  loading,
  children,
  loadingText = '처리 중...',
  ...props
}: {
  loading: boolean
  children: React.ReactNode
  loadingText?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`${props.className || ''} ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}

/**
 * 확인 다이얼로그가 있는 비동기 버튼
 */
export function ConfirmAsyncButton({
  confirmMessage = '이 작업을 실행하시겠습니까?',
  confirmTitle = '확인',
  ...props
}: AsyncButtonProps & {
  confirmMessage?: string
  confirmTitle?: string
}) {
  const handleConfirmedClick = useCallback(async () => {
    if (window.confirm(confirmMessage)) {
      await props.onClick()
    }
  }, [props.onClick, confirmMessage])

  return (
    <AsyncButton
      {...props}
      onClick={handleConfirmedClick}
    />
  )
}