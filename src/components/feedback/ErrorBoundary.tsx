'use client'
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { ErrorType, errorHandler } from '@/lib/error/errorHandler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string | null
  retryCount: number
}

export default class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: null,
      retryCount: 0
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 오류 처리기에 전달
    const appError = errorHandler.handle(error, ErrorType.UNKNOWN, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    })

    this.setState({ errorId: appError.id })

    // 부모 컴포넌트에 오류 알림
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReportBug = () => {
    // 버그 신고 기능 (실제로는 외부 서비스나 이메일로 전송)
    const errorDetails = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      errorId: this.state.errorId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }

    console.log('Bug report:', errorDetails)
    
    // 실제 구현에서는 이메일이나 버그 트래킹 시스템으로 전송
    alert('버그 신고가 접수되었습니다. 빠른 시일 내에 수정하겠습니다.')
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 오류 UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                앗! 문제가 발생했습니다
              </h1>
              <p className="text-gray-600 text-sm mb-4">
                예상치 못한 오류가 발생했습니다. 불편을 드려 죄송합니다.
              </p>
            </div>

            {/* 오류 ID 표시 (개발 환경) */}
            {process.env.NODE_ENV === 'development' && this.state.errorId && (
              <div className="mb-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
                <p className="font-mono">오류 ID: {this.state.errorId}</p>
                {this.state.error && (
                  <p className="mt-1 font-mono break-all">
                    {this.state.error.message}
                  </p>
                )}
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="space-y-3">
              {/* 재시도 버튼 */}
              {this.state.retryCount < this.maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>다시 시도 ({this.maxRetries - this.state.retryCount}회 남음)</span>
                </button>
              )}

              {/* 홈으로 가기 */}
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>홈으로 가기</span>
              </button>

              {/* 버그 신고 */}
              <button
                onClick={this.handleReportBug}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
              >
                <Bug className="w-4 h-4" />
                <span>버그 신고</span>
              </button>
            </div>

            {/* 도움말 텍스트 */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                문제가 계속 발생하면 고객센터(1588-0000)로 연락주세요.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 함수형 컴포넌트용 오류 경계 래퍼
interface ErrorBoundaryWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryWrapperProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// 특정 영역만을 위한 작은 오류 경계
export function LocalErrorBoundary({ 
  children, 
  message = "이 영역에서 오류가 발생했습니다",
  showRetry = true 
}: { 
  children: ReactNode
  message?: string
  showRetry?: boolean 
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">{message}</span>
          </div>
          {showRetry && (
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              페이지 새로고침
            </button>
          )}
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}