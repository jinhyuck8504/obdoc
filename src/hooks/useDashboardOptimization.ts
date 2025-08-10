import React, { useMemo, useCallback, useRef, useEffect } from 'react'
import { dashboardDataService } from '@/lib/dashboardDataService'

/**
 * 대시보드 성능 최적화를 위한 커스텀 훅
 */
export function useDashboardOptimization() {
  const lastUpdateRef = useRef<Date>(new Date())
  const cacheRef = useRef<Map<string, any>>(new Map())

  // 메모이제이션된 데이터 가져오기
  const memoizedData = useMemo(() => {
    const data = dashboardDataService.getData()
    
    // 데이터가 변경되었을 때만 캐시 업데이트
    if (data.lastUpdated.getTime() !== lastUpdateRef.current.getTime()) {
      lastUpdateRef.current = data.lastUpdated
      cacheRef.current.clear() // 캐시 초기화
    }
    
    return data
  }, [dashboardDataService.getData().lastUpdated])

  // 캐시된 계산 결과 반환
  const getCachedValue = useCallback(<T>(key: string, calculator: () => T): T => {
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)
    }
    
    const value = calculator()
    cacheRef.current.set(key, value)
    return value
  }, [])

  // 오늘 예약 수 (캐시됨)
  const todayAppointmentsCount = useMemo(() => 
    getCachedValue('todayAppointmentsCount', () => 
      dashboardDataService.getTodayAppointments().length
    ), [memoizedData, getCachedValue]
  )

  // 활성 환자 수 (캐시됨)
  const activePatientsCount = useMemo(() =>
    getCachedValue('activePatientsCount', () =>
      memoizedData.patients.filter(p => p.status === 'active').length
    ), [memoizedData, getCachedValue]
  )

  // 완료된 작업 수 (캐시됨)
  const completedTasksCount = useMemo(() =>
    getCachedValue('completedTasksCount', () =>
      memoizedData.tasks.filter(t => t.status === 'completed').length
    ), [memoizedData, getCachedValue]
  )

  // 대기 중인 작업 수 (캐시됨)
  const pendingTasksCount = useMemo(() =>
    getCachedValue('pendingTasksCount', () =>
      memoizedData.tasks.filter(t => t.status === 'pending').length
    ), [memoizedData, getCachedValue]
  )

  // 최근 활동 (캐시됨)
  const recentActivity = useMemo(() =>
    getCachedValue('recentActivity', () =>
      dashboardDataService.getRecentActivity()
    ), [memoizedData, getCachedValue]
  )

  // 디바운스된 검색 함수
  const debouncedSearch = useCallback(
    debounce((query: string, callback: (results: any[]) => void) => {
      const results = dashboardDataService.searchPatients(query)
      callback(results)
    }, 300),
    []
  )

  // 성능 통계
  const performanceStats = useMemo(() => ({
    totalPatients: memoizedData.patients.length,
    totalAppointments: memoizedData.appointments.length,
    totalTasks: memoizedData.tasks.length,
    activePatientsCount,
    todayAppointmentsCount,
    completedTasksCount,
    pendingTasksCount,
    lastUpdated: memoizedData.lastUpdated,
    cacheSize: cacheRef.current.size
  }), [
    memoizedData,
    activePatientsCount,
    todayAppointmentsCount,
    completedTasksCount,
    pendingTasksCount
  ])

  return {
    data: memoizedData,
    stats: performanceStats,
    recentActivity,
    debouncedSearch,
    getCachedValue
  }
}

/**
 * 위젯별 성능 최적화 훅
 */
export function useWidgetOptimization(widgetId: string) {
  const renderCountRef = useRef(0)
  const lastRenderTimeRef = useRef<Date>(new Date())

  useEffect(() => {
    renderCountRef.current += 1
    lastRenderTimeRef.current = new Date()
  })

  const shouldUpdate = useCallback((prevProps: any, nextProps: any) => {
    // 얕은 비교로 불필요한 리렌더링 방지
    return !shallowEqual(prevProps, nextProps)
  }, [])

  return {
    widgetId,
    renderCount: renderCountRef.current,
    lastRenderTime: lastRenderTimeRef.current,
    shouldUpdate
  }
}

/**
 * 메모이제이션된 위젯 컴포넌트 생성
 */
export function createMemoizedWidget<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  displayName?: string
) {
  const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
    // 커스텀 비교 로직
    return shallowEqual(prevProps, nextProps)
  })

  if (displayName) {
    MemoizedComponent.displayName = displayName
  }

  return MemoizedComponent
}

// 유틸리티 함수들
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) {
    return true
  }

  if (obj1 == null || obj2 == null) {
    return obj1 === obj2
  }

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2
  }

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) {
    return false
  }

  for (let key of keys1) {
    if (!keys2.includes(key) || obj1[key] !== obj2[key]) {
      return false
    }
  }

  return true
}

export default useDashboardOptimization