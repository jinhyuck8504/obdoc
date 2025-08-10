'use client'
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react'

// 기본 오류 폴백 컴포넌트
function DefaultErrorFallback({ 
  error, 
  errorInfo, 
  retry, 
  canRetry 
}: {
  error: Error
  errorInfo: any
  retry: () => void
  canRetry: boolean
}) {
  const [showDetails, setShowDetails] = React.useState(false)
  const [reportSent, setReportSent] = React.useState(false)

  const handleReportError = () => {
    // 실제 환경에서는 오류 리포팅 서비스로 전송
    console.log('Error Report:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    })
    setReportSent(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">
              페이지 오류가 발생했습니다
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              예상치 못한 오류가 발생했습니다. 불편을 드려 죄송합니다.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {/* 액션 버튼들 */}
            <div className="flex flex-col space-y-3">
              {canRetry && (
                <button
                  onClick={retry}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 시도
                </button>
              )}
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                홈으로 이동
              </button>
              
              <button
                onClick={handleReportError}
                disabled={reportSent}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Bug className="w-4 h-4 mr-2" />
                {reportSent ? '신고 완료' : '오류 신고'}
              </button>
            </div>

            {/* 오류 상세 정보 */}
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <span className="flex items-center">
                  {showDetails ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      오류 상세 정보 숨기기
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      오류 상세 정보 보기
                    </>
                  )}
                </span>
              </button>
              
              {showDetails && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md border">
                  <div className="text-xs text-gray-600 space-y-2">
                    <div>
                      <strong>오류 메시지:</strong>
                      <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                        {error.message}
                      </pre>
                    </div>
                    
                    {error.stack && (
                      <div>
                        <strong>스택 트레이스:</strong>
                        <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto max-h-32 overflow-y-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    
                    <div>
                      <strong>발생 시간:</strong>
                      <span className="ml-2">{new Date().toLocaleString('ko-KR')}</span>
                    </div>
                    
                    <div>
                      <strong>페이지 URL:</strong>
                      <span className="ml-2 break-all">{window.location.href}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 오류 바운더리 Props 타입
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{
    error: Error
    errorInfo: any
    retry: () => void
    canRetry: boolean
  }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  maxRetries?: number
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

// 오류 바운더리 State 타입
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: {
    componentStack: string
  }
  errorId?: string
  retryCount: number
  maxRetries: number
}

// 오류 바운더리 클래스 컴포넌트
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      retryCount: 0,
      maxRetries: props.maxRetries || 3
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo: {
        componentStack: errorInfo.componentStack || ''
      }
    })

    // 오류 정보를 부모 컴포넌트에 전달
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 콘솔에 오류 로그
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props
    const { hasError } = this.state

    if (hasError && prevProps.resetOnPropsChange !== resetOnPropsChange) {
      if (resetOnPropsChange) {
        this.resetErrorBoundary()
      }
    }

    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => prevProps.resetKeys![index] !== key
      )
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary()
      }
    }
  }

  resetErrorBoundary = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      retryCount: 0
    })
  }

  handleRetry = () => {
    const { retryCount, maxRetries } = this.state
    
    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: undefined,
        retryCount: retryCount + 1
      })
    }
  }

  render() {
    const { hasError, error, errorInfo, retryCount, maxRetries } = this.state
    const { children, fallback: Fallback } = this.props

    if (hasError && error) {
      const canRetry = retryCount < maxRetries

      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorInfo={errorInfo}
            retry={this.handleRetry}
            canRetry={canRetry}
          />
        )
      }

      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          retry={this.handleRetry}
          canRetry={canRetry}
        />
      )
    }

    return children
  }
}

// 함수형 컴포넌트용 오류 바운더리 래퍼
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// 오류 바운더리 훅
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return {
    captureError,
    resetError
  }
}