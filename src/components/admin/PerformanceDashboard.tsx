'use client'
import React, { useState, useEffect } from 'react'
import { performanceMonitor, PerformanceMetrics } from '@/lib/performance'
import { cacheManager } from '@/lib/cache'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/Button'
import { 
  Activity, 
  Clock, 
  Zap, 
  Database, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react'

interface PerformanceData {
  metrics: Map<string, PerformanceMetrics>
  cacheStats: any
  warnings: string[]
  memoryUsage: number
  timestamp: string
}

export default function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  // 성능 데이터 수집
  const collectPerformanceData = React.useCallback(() => {
    const metrics = performanceMonitor.getMetrics() as Map<string, PerformanceMetrics>
    const cacheStats = cacheManager.memory.stats()
    const warnings = performanceMonitor.checkPerformanceWarnings()
    const memoryUsage = performanceMonitor.measureMemoryUsage()

    setPerformanceData({
      metrics,
      cacheStats,
      warnings,
      memoryUsage,
      timestamp: new Date().toISOString()
    })
  }, [])

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(collectPerformanceData, 5000) // 5초마다
    return () => clearInterval(interval)
  }, [autoRefresh, collectPerformanceData])

  // 초기 데이터 로드
  useEffect(() => {
    collectPerformanceData()
  }, [collectPerformanceData])

  // 성능 리포트 다운로드
  const downloadReport = () => {
    if (!performanceData) return

    const report = performanceMonitor.generateReport()
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 캐시 정리
  const clearCaches = () => {
    cacheManager.memory.clear()
    cacheManager.local.clear()
    cacheManager.session.clear()
    collectPerformanceData()
  }

  if (!performanceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">성능 데이터 로딩 중...</span>
      </div>
    )
  }

  const { metrics, cacheStats, warnings, memoryUsage, timestamp } = performanceData

  // 메트릭 배열로 변환
  const metricsArray = Array.from(metrics.entries())

  // 전체 성능 점수 계산
  const calculatePerformanceScore = () => {
    let score = 100
    let totalMetrics = 0

    metricsArray.forEach(([_, metric]) => {
      totalMetrics++
      if (metric.loadTime > 2000) score -= 20
      else if (metric.loadTime > 1000) score -= 10
      
      if (metric.renderTime > 100) score -= 15
      else if (metric.renderTime > 50) score -= 5
      
      if (metric.interactionTime > 50) score -= 10
      else if (metric.interactionTime > 25) score -= 5
      
      if (metric.cacheHitRate < 50) score -= 10
      else if (metric.cacheHitRate < 70) score -= 5
    })

    return Math.max(0, Math.min(100, score))
  }

  const performanceScore = calculatePerformanceScore()

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">성능 모니터링</h1>
          <p className="text-sm text-gray-600">
            마지막 업데이트: {new Date(timestamp).toLocaleString('ko-KR')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 text-green-700' : ''}
          >
            {autoRefresh ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
            자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={collectPerformanceData}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            새로고침
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={downloadReport}
          >
            <Download className="w-4 h-4 mr-1" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 성능 점수 및 경고 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">성능 점수</h3>
              <div className="flex items-center mt-2">
                <span className={`text-3xl font-bold ${
                  performanceScore >= 80 ? 'text-green-600' :
                  performanceScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {performanceScore}
                </span>
                <span className="text-gray-500 ml-1">/100</span>
              </div>
            </div>
            <div className={`p-3 rounded-full ${
              performanceScore >= 80 ? 'bg-green-100' :
              performanceScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              {performanceScore >= 80 ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : performanceScore >= 60 ? (
                <TrendingUp className="w-8 h-8 text-yellow-600" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">메모리 사용량</h3>
              <div className="flex items-center mt-2">
                <span className={`text-2xl font-bold ${
                  memoryUsage < 50 ? 'text-green-600' :
                  memoryUsage < 100 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {memoryUsage.toFixed(1)}
                </span>
                <span className="text-gray-500 ml-1">MB</span>
              </div>
            </div>
            <Database className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">캐시 히트율</h3>
              <div className="flex items-center mt-2">
                <span className={`text-2xl font-bold ${
                  cacheStats.hitRate > 70 ? 'text-green-600' :
                  cacheStats.hitRate > 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {cacheStats.hitRate.toFixed(1)}
                </span>
                <span className="text-gray-500 ml-1">%</span>
              </div>
            </div>
            <Zap className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* 경고 알림 */}
      {warnings.length > 0 && (
        <Card className="p-4 border-l-4 border-red-500 bg-red-50">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">성능 경고</h3>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* 상세 메트릭 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 페이지 성능 메트릭 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            페이지 성능 메트릭
          </h3>
          
          <div className="space-y-4">
            {metricsArray.length === 0 ? (
              <p className="text-gray-500 text-center py-4">측정된 메트릭이 없습니다.</p>
            ) : (
              metricsArray.map(([name, metric]) => (
                <div 
                  key={name}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedMetric === name ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMetric(selectedMetric === name ? null : name)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{name}</h4>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className={`px-2 py-1 rounded ${
                        metric.loadTime < 1000 ? 'bg-green-100 text-green-800' :
                        metric.loadTime < 2000 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {metric.loadTime.toFixed(0)}ms
                      </span>
                    </div>
                  </div>
                  
                  {selectedMetric === name && (
                    <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">로드 시간:</span>
                        <span className="ml-2 font-medium">{metric.loadTime.toFixed(2)}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-600">렌더링:</span>
                        <span className="ml-2 font-medium">{metric.renderTime.toFixed(2)}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-600">상호작용:</span>
                        <span className="ml-2 font-medium">{metric.interactionTime.toFixed(2)}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-600">네트워크 요청:</span>
                        <span className="ml-2 font-medium">{metric.networkRequests}개</span>
                      </div>
                      <div>
                        <span className="text-gray-600">캐시 히트율:</span>
                        <span className="ml-2 font-medium">{metric.cacheHitRate.toFixed(1)}%</span>
                      </div>
                      {metric.memoryUsage && (
                        <div>
                          <span className="text-gray-600">메모리:</span>
                          <span className="ml-2 font-medium">{metric.memoryUsage.toFixed(1)}MB</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* 캐시 통계 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              캐시 통계
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCaches}
              className="text-red-600 hover:text-red-700"
            >
              캐시 정리
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">총 엔트리</div>
                <div className="text-xl font-semibold text-gray-900">
                  {cacheStats.totalEntries}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">유효 엔트리</div>
                <div className="text-xl font-semibold text-green-600">
                  {cacheStats.validEntries}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">만료 엔트리</div>
                <div className="text-xl font-semibold text-red-600">
                  {cacheStats.expiredEntries}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">메모리 사용량</div>
                <div className="text-xl font-semibold text-blue-600">
                  {(cacheStats.memoryUsage / 1024).toFixed(1)}KB
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">히트율</div>
              <div className="flex items-center mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${cacheStats.hitRate}%` }}
                  />
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {cacheStats.hitRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 성능 개선 제안 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          성능 개선 제안
        </h3>
        
        <div className="space-y-3">
          {performanceScore < 80 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800">성능 최적화 필요</h4>
              <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                <li>• 이미지 최적화 및 지연 로딩 적용</li>
                <li>• 불필요한 JavaScript 번들 크기 줄이기</li>
                <li>• 캐싱 전략 개선</li>
              </ul>
            </div>
          )}
          
          {cacheStats.hitRate < 70 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800">캐시 효율성 개선</h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• 자주 사용되는 데이터의 캐시 TTL 증가</li>
                <li>• 캐시 키 전략 최적화</li>
                <li>• 프리로딩 전략 적용</li>
              </ul>
            </div>
          )}
          
          {memoryUsage > 100 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800">메모리 사용량 최적화</h4>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                <li>• 메모리 누수 확인 및 수정</li>
                <li>• 대용량 객체 정리</li>
                <li>• 가상화 또는 페이지네이션 적용</li>
              </ul>
            </div>
          )}
          
          {warnings.length === 0 && performanceScore >= 80 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800">성능 상태 양호</h4>
              <p className="mt-1 text-sm text-green-700">
                현재 애플리케이션의 성능이 양호한 상태입니다. 지속적인 모니터링을 통해 성능을 유지하세요.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}