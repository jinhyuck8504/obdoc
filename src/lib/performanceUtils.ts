/**
 * 성능 모니터링 유틸리티
 */

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private enabled: boolean = process.env.NODE_ENV === 'development'

  /**
   * 성능 측정 시작
   */
  start(name: string): void {
    if (!this.enabled) return

    this.metrics.set(name, {
      name,
      startTime: performance.now()
    })
  }

  /**
   * 성능 측정 종료
   */
  end(name: string): number | null {
    if (!this.enabled) return null

    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    metric.endTime = endTime
    metric.duration = duration

    console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`)
    return duration
  }

  /**
   * 모든 메트릭 조회
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined)
  }

  /**
   * 메트릭 초기화
   */
  clear(): void {
    this.metrics.clear()
  }

  /**
   * 성능 측정 래퍼 함수
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name)
    try {
      const result = await fn()
      this.end(name)
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }

  /**
   * 동기 함수 성능 측정
   */
  measureSync<T>(name: string, fn: () => T): T {
    this.start(name)
    try {
      const result = fn()
      this.end(name)
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor()

/**
 * React 컴포넌트 렌더링 성능 측정 훅
 */
import { useEffect, useRef } from 'react'

export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0)
  const startTime = useRef<number>(0)

  useEffect(() => {
    renderCount.current += 1
    startTime.current = performance.now()
  })

  useEffect(() => {
    const endTime = performance.now()
    const duration = endTime - startTime.current
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎨 ${componentName} render #${renderCount.current}: ${duration.toFixed(2)}ms`)
    }
  })
}

/**
 * 메모리 사용량 모니터링
 */
export function logMemoryUsage(label: string = 'Memory Usage') {
  if (typeof window === 'undefined' || !('performance' in window)) return

  const memory = (performance as any).memory
  if (!memory) return

  console.log(`💾 ${label}:`, {
    used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
    total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
    limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`
  })
}

/**
 * 디바운스 함수
 */
export function debounce<T extends (...args: any[]) => any>(
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

/**
 * 스로틀 함수
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 지연 로딩을 위한 Intersection Observer 훅
 */
import { useState, useCallback } from 'react'

export function useLazyLoading(threshold: number = 0.1) {
  const [isVisible, setIsVisible] = useState(false)
  const [node, setNode] = useState<Element | null>(null)

  const ref = useCallback((node: Element | null) => {
    if (node) {
      setNode(node)
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        },
        { threshold }
      )

      observer.observe(node)
      
      return () => observer.disconnect()
    }
  }, [threshold])

  return { ref, isVisible }
}