// 성능 모니터링 및 최적화 유틸리티
import React from 'react'

// 성능 메트릭 타입
export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  interactionTime: number
  memoryUsage?: number
  networkRequests: number
  cacheHitRate: number
}

// 성능 측정 클래스
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private observers: PerformanceObserver[] = []

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // 페이지 로드 시간 측정
  measurePageLoad(pageName: string): void {
    if (typeof window === 'undefined') return

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.fetchStart
      const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      
      this.metrics.set(pageName, {
        loadTime,
        renderTime,
        interactionTime: 0,
        networkRequests: performance.getEntriesByType('resource').length,
        cacheHitRate: this.calculateCacheHitRate()
      })
    }
  }

  // 컴포넌트 렌더링 시간 측정
  measureComponentRender(componentName: string, startTime: number): void {
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    const existing = this.metrics.get(componentName) || {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0,
      networkRequests: 0,
      cacheHitRate: 0
    }
    
    this.metrics.set(componentName, {
      ...existing,
      renderTime
    })
  }

  // 사용자 상호작용 시간 측정
  measureInteraction(actionName: string, startTime: number): void {
    const endTime = performance.now()
    const interactionTime = endTime - startTime
    
    const existing = this.metrics.get(actionName) || {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0,
      networkRequests: 0,
      cacheHitRate: 0
    }
    
    this.metrics.set(actionName, {
      ...existing,
      interactionTime
    })
  }

  // 메모리 사용량 측정
  measureMemoryUsage(): number {
    if (typeof window === 'undefined' || !(performance as any).memory) return 0
    
    const memory = (performance as any).memory
    return memory.usedJSHeapSize / 1024 / 1024 // MB 단위
  }

  // 캐시 히트율 계산
  private calculateCacheHitRate(): number {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    if (resources.length === 0) return 0
    
    const cachedResources = resources.filter(resource => 
      resource.transferSize === 0 || resource.transferSize < resource.encodedBodySize
    )
    
    return (cachedResources.length / resources.length) * 100
  }

  // 성능 메트릭 가져오기
  getMetrics(name?: string): PerformanceMetrics | Map<string, PerformanceMetrics> {
    if (name) {
      return this.metrics.get(name) || {
        loadTime: 0,
        renderTime: 0,
        interactionTime: 0,
        networkRequests: 0,
        cacheHitRate: 0
      }
    }
    return this.metrics
  }

  // 성능 리포트 생성
  generateReport(): string {
    const report = Array.from(this.metrics.entries()).map(([name, metrics]) => {
      return `${name}:
  - 로드 시간: ${metrics.loadTime.toFixed(2)}ms
  - 렌더링 시간: ${metrics.renderTime.toFixed(2)}ms
  - 상호작용 시간: ${metrics.interactionTime.toFixed(2)}ms
  - 네트워크 요청: ${metrics.networkRequests}개
  - 캐시 히트율: ${metrics.cacheHitRate.toFixed(1)}%
  - 메모리 사용량: ${metrics.memoryUsage?.toFixed(1) || 'N/A'}MB`
    }).join('\n\n')
    
    return report
  }

  // 성능 경고 확인
  checkPerformanceWarnings(): string[] {
    const warnings: string[] = []
    
    this.metrics.forEach((metrics, name) => {
      if (metrics.loadTime > 2000) {
        warnings.push(`${name}: 로드 시간이 2초를 초과했습니다 (${metrics.loadTime.toFixed(0)}ms)`)
      }
      
      if (metrics.renderTime > 100) {
        warnings.push(`${name}: 렌더링 시간이 100ms를 초과했습니다 (${metrics.renderTime.toFixed(0)}ms)`)
      }
      
      if (metrics.interactionTime > 50) {
        warnings.push(`${name}: 상호작용 응답 시간이 50ms를 초과했습니다 (${metrics.interactionTime.toFixed(0)}ms)`)
      }
      
      if (metrics.cacheHitRate < 50) {
        warnings.push(`${name}: 캐시 히트율이 낮습니다 (${metrics.cacheHitRate.toFixed(1)}%)`)
      }
      
      if (metrics.memoryUsage && metrics.memoryUsage > 100) {
        warnings.push(`${name}: 메모리 사용량이 높습니다 (${metrics.memoryUsage.toFixed(1)}MB)`)
      }
    })
    
    return warnings
  }

  // 성능 옵저버 설정
  setupObservers(): void {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint 측정
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        console.log('LCP:', lastEntry.startTime)
      })
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (e) {
        console.warn('LCP observer not supported')
      }

      // First Input Delay 측정
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          console.log('FID:', entry.processingStart - entry.startTime)
        })
      })
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (e) {
        console.warn('FID observer not supported')
      }

      // Cumulative Layout Shift 측정
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        console.log('CLS:', clsValue)
      })
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (e) {
        console.warn('CLS observer not supported')
      }
    }
  }

  // 옵저버 정리
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// 성능 측정 데코레이터
export function measurePerformance(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now()
      const monitor = PerformanceMonitor.getInstance()
      
      try {
        const result = await originalMethod.apply(this, args)
        monitor.measureInteraction(name, startTime)
        return result
      } catch (error) {
        monitor.measureInteraction(`${name}_error`, startTime)
        throw error
      }
    }
    
    return descriptor
  }
}

// 컴포넌트 성능 측정 훅
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance()
  
  React.useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      monitor.measureComponentRender(componentName, startTime)
    }
  }, [componentName, monitor])
  
  const measureAction = (actionName: string, action: () => void | Promise<void>) => {
    const startTime = performance.now()
    const result = action()
    
    if (result instanceof Promise) {
      return result.finally(() => {
        monitor.measureInteraction(actionName, startTime)
      })
    } else {
      monitor.measureInteraction(actionName, startTime)
      return result
    }
  }
  
  return { measureAction }
}

// 이미지 최적화 유틸리티
export class ImageOptimizer {
  private static cache = new Map<string, string>()
  
  // 이미지 지연 로딩
  static setupLazyLoading(): void {
    if (typeof window === 'undefined') return
    
    const images = document.querySelectorAll('img[data-src]')
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = img.dataset.src || ''
            img.classList.remove('lazy')
            imageObserver.unobserve(img)
          }
        })
      })
      
      images.forEach(img => imageObserver.observe(img))
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        const imgElement = img as HTMLImageElement
        imgElement.src = imgElement.dataset.src || ''
      })
    }
  }
  
  // 이미지 압축 및 최적화
  static async optimizeImage(file: File, maxWidth = 800, quality = 0.8): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob(resolve as BlobCallback, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }
  
  // 이미지 캐싱
  static cacheImage(url: string, data: string): void {
    this.cache.set(url, data)
  }
  
  static getCachedImage(url: string): string | undefined {
    return this.cache.get(url)
  }
}

// 데이터베이스 쿼리 최적화 유틸리티
export class QueryOptimizer {
  private static queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  // 쿼리 결과 캐싱
  static cacheQuery(key: string, data: any, ttlMinutes = 5): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
  }
  
  // 캐시된 쿼리 결과 가져오기
  static getCachedQuery(key: string): any | null {
    const cached = this.queryCache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.queryCache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  // 배치 쿼리 최적화
  static batchQueries<T>(queries: (() => Promise<T>)[], batchSize = 5): Promise<T[]> {
    const batches: (() => Promise<T>)[][] = []
    
    for (let i = 0; i < queries.length; i += batchSize) {
      batches.push(queries.slice(i, i + batchSize))
    }
    
    return batches.reduce(async (acc, batch) => {
      const results = await acc
      const batchResults = await Promise.all(batch.map(query => query()))
      return [...results, ...batchResults]
    }, Promise.resolve([] as T[]))
  }
  
  // 캐시 정리
  static clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, cached] of this.queryCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.queryCache.delete(key)
      }
    }
  }
}

// 전역 성능 모니터 인스턴스
export const performanceMonitor = PerformanceMonitor.getInstance()

// 브라우저에서 성능 모니터링 시작
if (typeof window !== 'undefined') {
  performanceMonitor.setupObservers()
  
  // 페이지 언로드 시 정리
  window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup()
  })
  
  // 주기적으로 만료된 캐시 정리
  setInterval(() => {
    QueryOptimizer.clearExpiredCache()
  }, 5 * 60 * 1000) // 5분마다
}