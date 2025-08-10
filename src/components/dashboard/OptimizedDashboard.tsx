'use client'

import React, { Suspense, lazy } from 'react'
import { WidgetErrorBoundary } from './ErrorBoundary'
import { WidgetSkeleton, CalendarSkeleton, TasksSkeleton, SearchSkeleton } from './LoadingStates'
import { useDashboardOptimization } from '@/hooks/useDashboardOptimization'

// 지연 로딩으로 위젯 컴포넌트들 import
const TodayTasks = lazy(() => import('./widgets/TodayTasks'))
const Calendar = lazy(() => import('./widgets/Calendar'))
const QuickSearch = lazy(() => import('./widgets/QuickSearch'))
const RecentActivity = lazy(() => import('./widgets/RecentActivity'))

interface OptimizedDashboardProps {
  userRole: 'doctor' | 'customer' | 'admin'
}

/**
 * 성능 최적화된 대시보드 컴포넌트
 */
export default function OptimizedDashboard({ userRole }: OptimizedDashboardProps) {
  const { data, stats, recentActivity } = useDashboardOptimization()

  // 역할별 위젯 구성
  const widgetConfig = React.useMemo(() => {
    const baseWidgets = [
      {
        id: 'tasks',
        component: TodayTasks,
        skeleton: TasksSkeleton,
        priority: 1,
        name: '오늘 할 일'
      },
      {
        id: 'calendar',
        component: Calendar,
        skeleton: CalendarSkeleton,
        priority: 2,
        name: '일정'
      }
    ]

    if (userRole === 'doctor') {
      return [
        ...baseWidgets,
        {
          id: 'search',
          component: QuickSearch,
          skeleton: SearchSkeleton,
          priority: 3,
          name: '빠른 검색'
        },
        {
          id: 'activity',
          component: RecentActivity,
          skeleton: () => <WidgetSkeleton title="최근 활동" rows={5} />,
          priority: 4,
          name: '최근 활동'
        }
      ]
    }

    if (userRole === 'customer') {
      return [
        ...baseWidgets,
        {
          id: 'activity',
          component: RecentActivity,
          skeleton: () => <WidgetSkeleton title="최근 활동" rows={3} />,
          priority: 3,
          name: '최근 활동'
        }
      ]
    }

    return baseWidgets
  }, [userRole])

  // 위젯 렌더링 함수 (메모이제이션)
  const renderWidget = React.useCallback((widget: typeof widgetConfig[0]) => {
    const { id, component: WidgetComponent, skeleton: SkeletonComponent, name } = widget

    return (
      <WidgetErrorBoundary key={id} widgetName={name}>
        <Suspense fallback={<SkeletonComponent />}>
          <WidgetComponent />
        </Suspense>
      </WidgetErrorBoundary>
    )
  }, [])

  // 성능 모니터링 (개발 환경에서만)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Dashboard Performance Stats:', {
        ...stats,
        widgetCount: widgetConfig.length,
        userRole
      })
    }
  }, [stats, widgetConfig.length, userRole])

  return (
    <div className="space-y-6">
      {/* 성능 통계 (개발 환경에서만 표시) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">성능 통계</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-yellow-700">
            <div>환자: {stats.totalPatients}</div>
            <div>예약: {stats.totalAppointments}</div>
            <div>작업: {stats.totalTasks}</div>
            <div>캐시: {stats.cacheSize}개</div>
          </div>
        </div>
      )}

      {/* 위젯 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {widgetConfig
          .sort((a, b) => a.priority - b.priority)
          .map(renderWidget)}
      </div>

      {/* 데이터 새로고침 정보 */}
      <div className="text-center text-xs text-gray-500">
        마지막 업데이트: {stats.lastUpdated.toLocaleTimeString('ko-KR')}
      </div>
    </div>
  )
}

// 메모이제이션된 컴포넌트로 내보내기
export const MemoizedOptimizedDashboard = React.memo(OptimizedDashboard)