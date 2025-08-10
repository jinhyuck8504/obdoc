'use client'
import React, { useState, useEffect } from 'react'
import { performanceMonitor } from '@/lib/performance'
import { cacheManager, useCache } from '@/lib/cache'
import { usePagination, useInfiniteScroll } from '@/components/common/Pagination'
import { LazyImage, ViewportLazy, createLazyComponent } from '@/components/common/LazyWrapper'
import OptimizedCustomerList from '@/components/optimized/OptimizedCustomerList'
import PerformanceDashboard from '@/components/admin/PerformanceDashboard'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Customer } from '@/types/customer'
import { 
  Activity, 
  Database, 
  Image as ImageIcon, 
  List, 
  Zap,
  Clock,
  Users,
  BarChart3
} from 'lucide-react'

// 지연 로딩 컴포넌트 예시
const LazyChart = createLazyComponent(
  () => import('@/components/admin/widgets/RevenueChart'),
  <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
    <BarChart3 className="w-8 h-8 text-gray-400" />
  </div>
)

// 테스트용 더미 데이터 생성
const generateDummyPatients = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `customer-${i}`,
    name: `고객 ${i + 1}`,
    email: `customer${i + 1}@example.com`,
    phone: `010-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    birthDate: new Date(1950 + Math.floor(Math.random() * 50), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    gender: Math.random() > 0.5 ? 'male' : 'female' as 'male' | 'female',
    height: 150 + Math.floor(Math.random() * 30),
    initialWeight: 70 + Math.floor(Math.random() * 30),
    currentWeight: 60 + Math.floor(Math.random() * 40),
    targetWeight: 55 + Math.floor(Math.random() * 30),
    address: `서울시 강남구 테스트로 ${i + 1}`,
    medicalHistory: `진료 기록 ${i + 1}`,
    status: Math.random() > 0.7 ? 'inactive' : 'active' as 'active' | 'inactive' | 'completed',
    startDate: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
    doctorId: `doctor-${Math.floor(Math.random() * 5) + 1}`,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
    updatedAt: new Date().toISOString(),
    lastVisit: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString() : undefined
  }))
}

export default function TestPerformancePage() {
  const [activeTest, setActiveTest] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [dummyPatients] = useState(() => generateDummyPatients(1000))

  // 성능 모니터링 시작
  useEffect(() => {
    performanceMonitor.measurePageLoad('performance_test_page')
  }, [])

  // 캐시 테스트
  const { data: cachedData, loading: cacheLoading } = useCache(
    'test-cache-data',
    async () => {
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1초 지연
      return { message: '캐시된 데이터', timestamp: new Date().toISOString() }
    },
    { ttl: 10000, cacheType: 'memory' }
  )

  // 무한 스크롤 테스트
  const { data: infiniteData, loading: infiniteLoading, loadMore } = useInfiniteScroll(
    async (page) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const start = (page - 1) * 20
      return dummyPatients.slice(start, start + 20)
    },
    [],
    20
  )

  // 성능 테스트 함수들
  const runPerformanceTest = async (testName: string, testFn: () => Promise<any>) => {
    setActiveTest(testName)
    const startTime = performance.now()
    
    try {
      const result = await testFn()
      const endTime = performance.now()
      const duration = endTime - startTime
      
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: true,
          duration: duration.toFixed(2),
          result,
          timestamp: new Date().toISOString()
        }
      }))
      
      performanceMonitor.measureInteraction(testName, startTime)
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          duration: duration.toFixed(2),
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }))
    } finally {
      setActiveTest(null)
    }
  }

  // 테스트 케이스들
  const tests = [
    {
      id: 'cache-performance',
      name: '캐시 성능 테스트',
      description: '메모리 캐시의 읽기/쓰기 성능을 측정합니다.',
      icon: Database,
      run: async () => {
        const iterations = 1000
        const testData = { test: 'data', number: Math.random() }
        
        // 쓰기 성능 테스트
        const writeStart = performance.now()
        for (let i = 0; i < iterations; i++) {
          cacheManager.memory.set(`test-key-${i}`, { ...testData, index: i })
        }
        const writeTime = performance.now() - writeStart
        
        // 읽기 성능 테스트
        const readStart = performance.now()
        for (let i = 0; i < iterations; i++) {
          cacheManager.memory.get(`test-key-${i}`)
        }
        const readTime = performance.now() - readStart
        
        return {
          writeTime: writeTime.toFixed(2),
          readTime: readTime.toFixed(2),
          iterations,
          writeOpsPerMs: (iterations / writeTime).toFixed(2),
          readOpsPerMs: (iterations / readTime).toFixed(2)
        }
      }
    },
    {
      id: 'render-performance',
      name: '렌더링 성능 테스트',
      description: '대량 컴포넌트 렌더링 성능을 측정합니다.',
      icon: Activity,
      run: async () => {
        const componentCount = 100
        const renderStart = performance.now()
        
        // DOM 조작 시뮬레이션
        const container = document.createElement('div')
        for (let i = 0; i < componentCount; i++) {
          const element = document.createElement('div')
          element.textContent = `Component ${i}`
          element.className = 'test-component'
          container.appendChild(element)
        }
        
        const renderTime = performance.now() - renderStart
        
        return {
          componentCount,
          renderTime: renderTime.toFixed(2),
          componentsPerMs: (componentCount / renderTime).toFixed(2)
        }
      }
    },
    {
      id: 'image-loading',
      name: '이미지 로딩 테스트',
      description: '이미지 지연 로딩 성능을 측정합니다.',
      icon: ImageIcon,
      run: async () => {
        const imageCount = 10
        const loadPromises: Promise<any>[] = []
        
        for (let i = 0; i < imageCount; i++) {
          const promise = new Promise((resolve, reject) => {
            const img = new Image()
            const startTime = performance.now()
            
            img.onload = () => {
              resolve({
                index: i,
                loadTime: performance.now() - startTime,
                size: { width: img.width, height: img.height }
              })
            }
            
            img.onerror = () => reject(new Error(`Image ${i} failed to load`))
            img.src = `https://picsum.photos/200/200?random=${i}&t=${Date.now()}`
          })
          
          loadPromises.push(promise)
        }
        
        const results = await Promise.all(loadPromises)
        const totalTime = results.reduce((sum: number, result: any) => sum + result.loadTime, 0)
        const avgTime = totalTime / results.length
        
        return {
          imageCount,
          totalTime: totalTime.toFixed(2),
          averageTime: avgTime.toFixed(2),
          results
        }
      }
    },
    {
      id: 'list-virtualization',
      name: '리스트 가상화 테스트',
      description: '대용량 리스트의 가상화 성능을 측정합니다.',
      icon: List,
      run: async () => {
        const itemCount = 10000
        const visibleCount = 20
        const itemHeight = 50
        
        const startTime = performance.now()
        
        // 가상화 계산 시뮬레이션
        const scrollTop = Math.random() * (itemCount * itemHeight)
        const visibleStart = Math.floor(scrollTop / itemHeight)
        const visibleEnd = Math.min(visibleStart + visibleCount, itemCount)
        const visibleItems: Array<{index: number; data: string; offset: number}> = []
        
        for (let i = visibleStart; i < visibleEnd; i++) {
          visibleItems.push({
            index: i,
            data: `Item ${i}`,
            offset: i * itemHeight
          })
        }
        
        const calculationTime = performance.now() - startTime
        
        return {
          totalItems: itemCount,
          visibleItems: visibleItems.length,
          calculationTime: calculationTime.toFixed(2),
          efficiency: ((visibleItems.length / itemCount) * 100).toFixed(2)
        }
      }
    },
    {
      id: 'memory-usage',
      name: '메모리 사용량 테스트',
      description: '현재 메모리 사용량을 측정합니다.',
      icon: Zap,
      run: async () => {
        const memoryInfo = (performance as any).memory
        const memoryUsage = performanceMonitor.measureMemoryUsage()
        
        // 가비지 컬렉션 강제 실행 (가능한 경우)
        if (window.gc) {
          window.gc()
        }
        
        return {
          jsHeapSizeLimit: memoryInfo ? (memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2) : 'N/A',
          totalJSHeapSize: memoryInfo ? (memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A',
          usedJSHeapSize: memoryInfo ? (memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A',
          calculatedUsage: memoryUsage.toFixed(2),
          unit: 'MB'
        }
      }
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          성능 테스트 및 모니터링
        </h1>

        {/* 성능 테스트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {tests.map(test => {
            const Icon = test.icon
            const result = testResults[test.id]
            const isRunning = activeTest === test.id

            return (
              <Card key={test.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {test.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {test.description}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => runPerformanceTest(test.id, test.run)}
                    disabled={isRunning}
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {isRunning ? (
                      <>
                        <Clock className="w-4 h-4 mr-1 animate-spin" />
                        실행 중...
                      </>
                    ) : (
                      '테스트 실행'
                    )}
                  </Button>
                </div>

                {result && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.success ? '성공' : '실패'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {result.duration}ms
                      </span>
                    </div>
                    
                    {result.success ? (
                      <div className="text-xs text-gray-600">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(result.result, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-xs text-red-600">
                        {result.error}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {/* 실제 컴포넌트 성능 테스트 */}
        <div className="space-y-8">
          {/* 캐시 테스트 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              캐시 시스템 테스트
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {cacheLoading ? (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  캐시 데이터 로딩 중...
                </div>
              ) : (
                <div>
                  <strong>캐시된 데이터:</strong>
                  <pre className="mt-2 text-sm">
                    {JSON.stringify(cachedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Card>

          {/* 지연 로딩 테스트 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              지연 로딩 테스트
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }, (_, i) => (
                <ViewportLazy key={i}>
                  <LazyImage
                    src={`https://picsum.photos/200/150?random=${i}`}
                    alt={`테스트 이미지 ${i + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </ViewportLazy>
              ))}
            </div>
          </Card>

          {/* 최적화된 환자 목록 테스트 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              최적화된 환자 목록 (1,000개 항목)
            </h3>
            <OptimizedCustomerList
              customers={dummyPatients}
              onCustomerSelect={(customer) => console.log('Selected:', customer)}
              virtualizeThreshold={50}
            />
          </Card>

          {/* 지연 로딩 차트 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              지연 로딩 차트 컴포넌트
            </h3>
            <LazyChart data={[]} />
          </Card>

          {/* 성능 대시보드 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              실시간 성능 모니터링
            </h3>
            <PerformanceDashboard />
          </Card>
        </div>
      </div>
    </div>
  )
}