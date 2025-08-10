/**
 * 프로덕션 환경에서 Hydration 오류 모니터링 시스템
 */

interface HydrationMetrics {
  errorCount: number
  errorRate: number
  avgHydrationTime: number
  lastErrorTime: Date | null
  errorsByComponent: Record<string, number>
  errorsByType: Record<string, number>
  userAgent: string
  sessionId: string
}

interface HydrationErrorReport {
  id: string
  timestamp: Date
  error: string
  component: string
  stack?: string
  userAgent: string
  url: string
  userId?: string
  sessionId: string
  hydrationTime?: number
  recoveryAttempted: boolean
  recoverySuccessful?: boolean
}

class HydrationProductionMonitor {
  private metrics: HydrationMetrics
  private errorReports: HydrationErrorReport[] = []
  private hydrationStartTime: number | null = null
  private isEnabled: boolean
  private reportingEndpoint: string | null = null

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production'
    this.reportingEndpoint = process.env.NEXT_PUBLIC_HYDRATION_MONITORING_ENDPOINT || null
    
    this.metrics = {
      errorCount: 0,
      errorRate: 0,
      avgHydrationTime: 0,
      lastErrorTime: null,
      errorsByComponent: {},
      errorsByType: {},
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      sessionId: this.generateSessionId()
    }

    if (this.isEnabled) {
      this.setupMonitoring()
    }
  }

  /**
   * 모니터링 시스템 초기화
   */
  private setupMonitoring(): void {
    if (typeof window === 'undefined') return

    // Hydration 시작 시간 기록
    this.hydrationStartTime = performance.now()

    // 페이지 로드 완료 시 Hydration 시간 계산
    window.addEventListener('load', () => {
      if (this.hydrationStartTime) {
        const hydrationTime = performance.now() - this.hydrationStartTime
        this.updateHydrationTime(hydrationTime)
      }
    })

    // 전역 오류 핸들러
    window.addEventListener('error', (event) => {
      if (this.isHydrationError(event.error)) {
        this.reportError({
          error: event.error.message,
          component: 'Unknown',
          stack: event.error.stack,
          url: window.location.href
        })
      }
    })

    // Promise rejection 핸들러
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && this.isHydrationError(event.reason)) {
        this.reportError({
          error: event.reason.message || 'Unhandled Promise Rejection',
          component: 'Unknown',
          stack: event.reason.stack,
          url: window.location.href
        })
      }
    })

    // 주기적 메트릭 전송
    setInterval(() => {
      this.sendMetrics()
    }, 60000) // 1분마다

    // 페이지 언로드 시 최종 메트릭 전송
    window.addEventListener('beforeunload', () => {
      this.sendMetrics(true)
    })
  }

  /**
   * Hydration 오류인지 확인
   */
  private isHydrationError(error: any): boolean {
    if (!error) return false
    
    const message = error.message || error.toString()
    return typeof message === 'string' && (
      message.includes('Hydration') ||
      message.includes('hydration') ||
      message.includes('server HTML') ||
      message.includes('client-side')
    )
  }

  /**
   * 오류 보고
   */
  reportError(errorData: {
    error: string
    component: string
    stack?: string
    url: string
    userId?: string
    recoveryAttempted?: boolean
    recoverySuccessful?: boolean
  }): void {
    if (!this.isEnabled) return

    const report: HydrationErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      userAgent: this.metrics.userAgent,
      sessionId: this.metrics.sessionId,
      hydrationTime: this.hydrationStartTime ? performance.now() - this.hydrationStartTime : undefined,
      recoveryAttempted: false,
      ...errorData
    }

    this.errorReports.push(report)
    this.updateMetrics(report)

    // 즉시 중요한 오류 전송
    if (this.isCriticalError(report)) {
      this.sendErrorReport(report)
    }
  }

  /**
   * 메트릭 업데이트
   */
  private updateMetrics(report: HydrationErrorReport): void {
    this.metrics.errorCount++
    this.metrics.lastErrorTime = report.timestamp

    // 컴포넌트별 오류 카운트
    this.metrics.errorsByComponent[report.component] = 
      (this.metrics.errorsByComponent[report.component] || 0) + 1

    // 오류 타입별 카운트
    const errorType = this.categorizeError(report.error)
    this.metrics.errorsByType[errorType] = 
      (this.metrics.errorsByType[errorType] || 0) + 1

    // 오류율 계산 (최근 1시간 기준)
    const recentErrors = this.errorReports.filter(
      r => Date.now() - r.timestamp.getTime() < 3600000
    )
    this.metrics.errorRate = recentErrors.length
  }

  /**
   * Hydration 시간 업데이트
   */
  private updateHydrationTime(time: number): void {
    const currentAvg = this.metrics.avgHydrationTime
    const count = this.errorReports.length + 1
    this.metrics.avgHydrationTime = (currentAvg * (count - 1) + time) / count
  }

  /**
   * 오류 분류
   */
  private categorizeError(error: string): string {
    if (error.includes('Text content does not match')) return 'text-mismatch'
    if (error.includes('Expected server HTML')) return 'html-structure-mismatch'
    if (error.includes('Hydration failed')) return 'hydration-failure'
    if (error.includes('Cannot read properties')) return 'property-access-error'
    return 'unknown'
  }

  /**
   * 중요한 오류인지 확인
   */
  private isCriticalError(report: HydrationErrorReport): boolean {
    // 같은 컴포넌트에서 5번 이상 오류 발생
    if (this.metrics.errorsByComponent[report.component] >= 5) return true
    
    // 1분 내에 10개 이상 오류 발생
    const recentErrors = this.errorReports.filter(
      r => Date.now() - r.timestamp.getTime() < 60000
    )
    if (recentErrors.length >= 10) return true

    return false
  }

  /**
   * 개별 오류 보고서 전송
   */
  private async sendErrorReport(report: HydrationErrorReport): Promise<void> {
    if (!this.reportingEndpoint) return

    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'hydration-error',
          data: report
        })
      })
    } catch (error) {
      console.error('Failed to send hydration error report:', error)
    }
  }

  /**
   * 메트릭 전송
   */
  private async sendMetrics(isBeforeUnload = false): Promise<void> {
    if (!this.reportingEndpoint || this.metrics.errorCount === 0) return

    const payload = {
      type: 'hydration-metrics',
      data: {
        ...this.metrics,
        timestamp: new Date(),
        isBeforeUnload
      }
    }

    try {
      if (isBeforeUnload && navigator.sendBeacon) {
        // 페이지 언로드 시 beacon 사용
        navigator.sendBeacon(
          this.reportingEndpoint,
          JSON.stringify(payload)
        )
      } else {
        await fetch(this.reportingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })
      }
    } catch (error) {
      console.error('Failed to send hydration metrics:', error)
    }
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return `hydration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 오류 ID 생성
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 현재 메트릭 반환
   */
  getMetrics(): HydrationMetrics {
    return { ...this.metrics }
  }

  /**
   * 오류 보고서 반환
   */
  getErrorReports(): HydrationErrorReport[] {
    return [...this.errorReports]
  }

  /**
   * 메트릭 초기화
   */
  clearMetrics(): void {
    this.metrics.errorCount = 0
    this.metrics.errorRate = 0
    this.metrics.lastErrorTime = null
    this.metrics.errorsByComponent = {}
    this.metrics.errorsByType = {}
    this.errorReports = []
  }
}

// 싱글톤 인스턴스
export const hydrationMonitor = new HydrationProductionMonitor()

/**
 * 프로덕션 모니터링 대시보드 데이터
 */
export interface HydrationDashboardData {
  totalErrors: number
  errorRate: number
  avgHydrationTime: number
  topErrorComponents: Array<{ component: string; count: number }>
  errorTrends: Array<{ date: string; count: number }>
  errorTypes: Array<{ type: string; count: number }>
  recentErrors: HydrationErrorReport[]
}

/**
 * 대시보드 데이터 생성
 */
export function generateDashboardData(): HydrationDashboardData {
  const metrics = hydrationMonitor.getMetrics()
  const reports = hydrationMonitor.getErrorReports()

  // 상위 오류 컴포넌트
  const topErrorComponents = Object.entries(metrics.errorsByComponent)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([component, count]) => ({ component, count }))

  // 오류 트렌드 (최근 7일)
  const errorTrends = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const count = reports.filter(r => 
      r.timestamp.toISOString().split('T')[0] === dateStr
    ).length

    return { date: dateStr, count }
  }).reverse()

  // 오류 타입
  const errorTypes = Object.entries(metrics.errorsByType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  // 최근 오류
  const recentErrors = reports
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 20)

  return {
    totalErrors: metrics.errorCount,
    errorRate: metrics.errorRate,
    avgHydrationTime: metrics.avgHydrationTime,
    topErrorComponents,
    errorTrends,
    errorTypes,
    recentErrors
  }
}

export default HydrationProductionMonitor