'use client'

import React, { useState, useEffect } from 'react'
import { 
  generateDashboardData, 
  HydrationDashboardData 
} from '@/lib/hydration/productionMonitoring'
import { 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Activity,
  RefreshCw,
  Download
} from 'lucide-react'

interface HydrationMonitoringDashboardProps {
  refreshInterval?: number
}

/**
 * Hydration 모니터링 대시보드 컴포넌트
 * 프로덕션 환경에서 Hydration 오류 현황을 시각화합니다.
 */
export default function HydrationMonitoringDashboard({
  refreshInterval = 30000 // 30초
}: HydrationMonitoringDashboardProps) {
  const [dashboardData, setDashboardData] = useState<HydrationDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadDashboardData = () => {
    setIsLoading(true)
    try {
      const data = generateDashboardData()
      setDashboardData(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    
    const interval = setInterval(loadDashboardData, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  const handleExportData = () => {
    if (!dashboardData) return

    const dataStr = JSON.stringify(dashboardData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hydration-monitoring-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading && !dashboardData) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center text-gray-500">
          모니터링 데이터를 로드할 수 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Hydration 모니터링 대시보드
          </h2>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              마지막 업데이트: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="flex items-center px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-md text-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          <button
            onClick={handleExportData}
            className="flex items-center px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </button>
        </div>
      </div>

      {/* 주요 메트릭 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-600">총 오류</p>
              <p className="text-2xl font-bold text-red-900">
                {dashboardData.totalErrors.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-600">오류율 (시간당)</p>
              <p className="text-2xl font-bold text-yellow-900">
                {dashboardData.errorRate}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-600">평균 Hydration 시간</p>
              <p className="text-2xl font-bold text-blue-900">
                {dashboardData.avgHydrationTime.toFixed(1)}ms
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-600">모니터링 상태</p>
              <p className="text-2xl font-bold text-green-900">활성</p>
            </div>
          </div>
        </div>
      </div>

      {/* 차트 및 상세 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 상위 오류 컴포넌트 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            상위 오류 컴포넌트
          </h3>
          <div className="space-y-2">
            {dashboardData.topErrorComponents.slice(0, 5).map((item, index) => (
              <div key={item.component} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.component}</span>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ 
                        width: `${(item.count / dashboardData.topErrorComponents[0]?.count || 1) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 오류 타입 분포 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            오류 타입 분포
          </h3>
          <div className="space-y-2">
            {dashboardData.errorTypes.slice(0, 5).map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 capitalize">
                  {item.type.replace('-', ' ')}
                </span>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${(item.count / dashboardData.errorTypes[0]?.count || 1) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 오류 목록 */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          최근 오류 ({dashboardData.recentErrors.length}개)
        </h3>
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {dashboardData.recentErrors.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                최근 오류가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {dashboardData.recentErrors.map((error) => (
                  <div key={error.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {error.component}
                          </span>
                          <span className="text-xs text-gray-500">
                            {error.timestamp.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {error.error}
                        </p>
                        {error.hydrationTime && (
                          <p className="text-xs text-gray-500 mt-1">
                            Hydration 시간: {error.hydrationTime.toFixed(1)}ms
                          </p>
                        )}
                      </div>
                      {error.recoveryAttempted && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          error.recoverySuccessful 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {error.recoverySuccessful ? '복구 성공' : '복구 실패'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}