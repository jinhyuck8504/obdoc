/**
 * 성능 최적화된 대시보드 래퍼
 */
import React, { Suspense, lazy } from 'react'
import { useLazyLoading, logMemoryUsage } from '@/lib/performanceUtils'

// 위젯들을 지연 로딩
const TodayTasks = lazy(() => import('./widgets/TodayTasks'))
const Calendar = lazy(() => import('./widgets/Calendar'))

interface LazyWidgetProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  threshold?: number
}

function LazyWidget({ children, fallback = <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>, threshold = 0.1 }: LazyWidgetProps) {
  const { ref, isVisible } = useLazyLoading(threshold)

  return (
    <div ref={ref}>
      {isVisible ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  )
}

interface OptimizedDashboardProps {
  enableLazyLoading?: boolean
  enableMemoryLogging?: boolean
}

export default function OptimizedDashboard({ 
  enableLazyLoading = true,
  enableMemoryLogging = false 
}: OptimizedDashboardProps) {
  React.useEffect(() => {
    if (enableMemoryLogging && process.env.NODE_ENV === 'development') {
      logMemoryUsage('Dashboard Mount')
      
      const interval = setInterval(() => {
        logMemoryUsage('Dashboard Runtime')
      }, 30000) // 30초마다 메모리 사용량 로깅

      return () => clearInterval(interval)
    }
  }, [enableMemoryLogging])

  const WidgetWrapper = enableLazyLoading ? LazyWidget : Suspense
  const fallback = <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 왼쪽 컬럼 */}
      <div className="space-y-6">
        <WidgetWrapper fallback={fallback}>
          <TodayTasks />
        </WidgetWrapper>
      </div>

      {/* 오른쪽 컬럼 */}
      <div className="space-y-4">
        <WidgetWrapper fallback={fallback}>
          <Calendar />
        </WidgetWrapper>
      </div>
    </div>
  )
}

// 성능 최적화된 대시보드 메트릭 표시 컴포넌트
export function DashboardMetrics() {
  const [metrics, setMetrics] = React.useState<any[]>([])

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        import('@/lib/performanceUtils').then(({ performanceMonitor }) => {
          setMetrics(performanceMonitor.getMetrics())
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [])

  if (process.env.NODE_ENV !== 'development' || metrics.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs max-w-sm">
      <h4 className="font-bold mb-2">Performance Metrics</h4>
      {metrics.slice(-5).map((metric, index) => (
        <div key={index} className="flex justify-between">
          <span>{metric.name}:</span>
          <span>{metric.duration?.toFixed(2)}ms</span>
        </div>
      ))}
    </div>
  )
}