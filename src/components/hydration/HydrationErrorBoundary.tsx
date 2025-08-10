'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface HydrationErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onHydrationError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface HydrationErrorBoundaryState {
  hasError: boolean
  error: Error | null
  isHydrationError: boolean
}

/**
 * HydrationErrorBoundary는 Hydration 오류를 감지하고 복구하는 Error Boundary입니다.
 * Hydration 관련 오류를 특별히 처리하고, 적절한 fallback UI를 제공합니다.
 */
class HydrationErrorBoundary extends Component<
  HydrationErrorBoundaryProps,
  HydrationErrorBoundaryState
> {
  constructor(props: HydrationErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      isHydrationError: false
    }
  }

  static getDerivedStateFromError(error: Error): HydrationErrorBoundaryState {
    // Hydration 오류인지 확인
    const isHydrationError = 
      error.message.includes('Hydration') ||
      error.message.includes('hydration') ||
      error.message.includes('server HTML') ||
      error.message.includes('client-side')

    return {
      hasError: true,
      error,
      isHydrationError
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 개발 환경에서 상세한 오류 정보 로깅
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Hydration Error Boundary')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }

    // 프로덕션 환경에서 오류 로깅
    if (process.env.NODE_ENV === 'production') {
      // 여기에 실제 로깅 서비스 연동 (예: Sentry, LogRocket 등)
      console.error('Hydration Error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }

    // 콜백 함수 호출
    if (this.props.onHydrationError) {
      this.props.onHydrationError(error, errorInfo)
    }
  }

  retry = () => {
    this.setState({
      hasError: false,
      error: null,
      isHydrationError: false
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // 커스텀 fallback 컴포넌트가 있으면 사용
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.retry} />
      }

      // 기본 fallback UI
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center mb-2">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {this.state.isHydrationError ? 'Hydration 오류' : '렌더링 오류'}
              </h3>
            </div>
          </div>
          <div className="text-sm text-red-700 mb-3">
            {this.state.isHydrationError 
              ? '페이지 로딩 중 문제가 발생했습니다. 새로고침을 시도해보세요.'
              : '컴포넌트 렌더링 중 오류가 발생했습니다.'
            }
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-3">
              <summary className="text-sm text-red-600 cursor-pointer">
                개발자 정보 (개발 환경에서만 표시)
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={this.retry}
            className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            다시 시도
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default HydrationErrorBoundary