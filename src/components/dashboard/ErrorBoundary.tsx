'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // 외부 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    })
  }

  handleGoHome = () => {
    // Next.js의 router를 사용하기 위해 window.location 대신 이벤트 방식 사용
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/dashboard/doctor')
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                문제가 발생했습니다
              </h2>
              <p className="text-gray-600 mb-4">
                위젯을 로드하는 중 오류가 발생했습니다. 
                잠시 후 다시 시도해주세요.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-gray-100 p-4 rounded-lg mb-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    개발자 정보
                  </summary>
                  <pre className="text-xs text-red-600 whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                대시보드 홈
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 위젯별 에러 바운더리
export function WidgetErrorBoundary({ 
  children, 
  widgetName 
}: { 
  children: ReactNode
  widgetName: string 
}) {
  return (
    <DashboardErrorBoundary
      fallback={
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {widgetName} 로드 실패
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              위젯을 불러올 수 없습니다
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      }
    >
      {children}
    </DashboardErrorBoundary>
  )
}

export default DashboardErrorBoundary