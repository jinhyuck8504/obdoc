/**
 * 모니터링 서비스
 */

export interface MonitoringEvent {
  id: string
  type: 'error' | 'warning' | 'info' | 'performance'
  message: string
  data?: any
  timestamp: Date
  source?: string
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
}

class MonitoringService {
  private events: MonitoringEvent[] = []
  private metrics: PerformanceMetric[] = []
  private listeners: ((event: MonitoringEvent) => void)[] = []

  /**
   * 이벤트 로깅
   */
  logEvent(event: Omit<MonitoringEvent, 'id' | 'timestamp'>): void {
    const newEvent: MonitoringEvent = {
      ...event,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }

    this.events.push(newEvent)
    this.notifyListeners(newEvent)

    // 콘솔에도 출력 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${newEvent.type.toUpperCase()}] ${newEvent.message}`, newEvent.data)
    }

    // 이벤트 개수 제한 (메모리 관리)
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500)
    }
  }

  /**
   * 에러 로깅
   */
  logError(message: string, error?: Error, source?: string): void {
    this.logEvent({
      type: 'error',
      message,
      data: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      source
    })
  }

  /**
   * 경고 로깅
   */
  logWarning(message: string, data?: any, source?: string): void {
    this.logEvent({
      type: 'warning',
      message,
      data,
      source
    })
  }

  /**
   * 정보 로깅
   */
  logInfo(message: string, data?: any, source?: string): void {
    this.logEvent({
      type: 'info',
      message,
      data,
      source
    })
  }

  /**
   * 성능 메트릭 기록
   */
  recordMetric(name: string, value: number, unit: string = 'ms'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date()
    }

    this.metrics.push(metric)

    // 성능 로그도 이벤트로 기록
    this.logEvent({
      type: 'performance',
      message: `Performance metric: ${name}`,
      data: metric
    })

    // 메트릭 개수 제한
    if (this.metrics.length > 500) {
      this.metrics = this.metrics.slice(-250)
    }
  }

  /**
   * 이벤트 구독
   */
  subscribe(listener: (event: MonitoringEvent) => void): () => void {
    this.listeners.push(listener)
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /**
   * 모든 이벤트 조회
   */
  getEvents(type?: MonitoringEvent['type'], limit?: number): MonitoringEvent[] {
    let filteredEvents = type 
      ? this.events.filter(e => e.type === type)
      : this.events

    if (limit) {
      filteredEvents = filteredEvents.slice(-limit)
    }

    return filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * 성능 메트릭 조회
   */
  getMetrics(name?: string, limit?: number): PerformanceMetric[] {
    let filteredMetrics = name 
      ? this.metrics.filter(m => m.name === name)
      : this.metrics

    if (limit) {
      filteredMetrics = filteredMetrics.slice(-limit)
    }

    return filteredMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * 시스템 상태 체크
   */
  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical'
    errorCount: number
    warningCount: number
    lastError?: MonitoringEvent
    uptime: number
  } {
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    
    const recentEvents = this.events.filter(e => e.timestamp.getTime() > oneHourAgo)
    const errorCount = recentEvents.filter(e => e.type === 'error').length
    const warningCount = recentEvents.filter(e => e.type === 'warning').length
    
    const lastError = this.events
      .filter(e => e.type === 'error')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]

    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    if (errorCount > 10) {
      status = 'critical'
    } else if (errorCount > 5 || warningCount > 20) {
      status = 'warning'
    }

    return {
      status,
      errorCount,
      warningCount,
      lastError,
      uptime: now - (this.startTime || now)
    }
  }

  /**
   * 통계 정보
   */
  getStats(): {
    totalEvents: number
    eventsByType: Record<string, number>
    avgMetricValue: Record<string, number>
  } {
    const eventsByType: Record<string, number> = {}
    
    for (const event of this.events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
    }

    const avgMetricValue: Record<string, number> = {}
    const metricGroups: Record<string, number[]> = {}
    
    for (const metric of this.metrics) {
      if (!metricGroups[metric.name]) {
        metricGroups[metric.name] = []
      }
      metricGroups[metric.name].push(metric.value)
    }

    for (const [name, values] of Object.entries(metricGroups)) {
      avgMetricValue[name] = values.reduce((sum, val) => sum + val, 0) / values.length
    }

    return {
      totalEvents: this.events.length,
      eventsByType,
      avgMetricValue
    }
  }

  /**
   * 데이터 초기화
   */
  clear(): void {
    this.events = []
    this.metrics = []
  }

  private startTime = Date.now()

  private notifyListeners(event: MonitoringEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Monitoring listener error:', error)
      }
    })
  }
}

// 전역 모니터링 서비스 인스턴스
export const monitoringService = new MonitoringService()

// 전역 에러 핸들러 설정 (브라우저 환경)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    monitoringService.logError(
      'Uncaught error',
      new Error(event.message),
      event.filename
    )
  })

  window.addEventListener('unhandledrejection', (event) => {
    monitoringService.logError(
      'Unhandled promise rejection',
      event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    )
  })
}

export default monitoringService