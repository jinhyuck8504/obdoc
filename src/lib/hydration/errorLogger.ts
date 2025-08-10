interface HydrationErrorLog {
  timestamp: Date
  component: string
  error: string
  stack?: string
  userAgent: string
  url: string
  userId?: string
  sessionId?: string
}

interface ErrorLoggerConfig {
  enableConsoleLogging: boolean
  enableRemoteLogging: boolean
  remoteEndpoint?: string
  maxRetries: number
}

class HydrationErrorLogger {
  private config: ErrorLoggerConfig
  private errorQueue: HydrationErrorLog[] = []
  private isProcessing = false

  constructor(config: Partial<ErrorLoggerConfig> = {}) {
    this.config = {
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableRemoteLogging: process.env.NODE_ENV === 'production',
      maxRetries: 3,
      ...config
    }
  }

  /**
   * Hydration 오류를 로깅합니다.
   */
  logError(error: Error, component?: string, userId?: string): void {
    const errorLog: HydrationErrorLog = {
      timestamp: new Date(),
      component: component || 'Unknown',
      error: error.message,
      stack: error.stack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      userId,
      sessionId: this.getSessionId()
    }

    // 콘솔 로깅
    if (this.config.enableConsoleLogging) {
      this.logToConsole(errorLog)
    }

    // 원격 로깅
    if (this.config.enableRemoteLogging) {
      this.queueForRemoteLogging(errorLog)
    }
  }

  /**
   * 콘솔에 오류를 로깅합니다.
   */
  private logToConsole(errorLog: HydrationErrorLog): void {
    console.group('🚨 Hydration Error Log')
    console.error('Timestamp:', errorLog.timestamp.toISOString())
    console.error('Component:', errorLog.component)
    console.error('Error:', errorLog.error)
    console.error('URL:', errorLog.url)
    console.error('User Agent:', errorLog.userAgent)
    if (errorLog.userId) {
      console.error('User ID:', errorLog.userId)
    }
    if (errorLog.stack) {
      console.error('Stack:', errorLog.stack)
    }
    console.groupEnd()
  }

  /**
   * 원격 로깅을 위해 큐에 추가합니다.
   */
  private queueForRemoteLogging(errorLog: HydrationErrorLog): void {
    this.errorQueue.push(errorLog)
    
    if (!this.isProcessing) {
      this.processErrorQueue()
    }
  }

  /**
   * 오류 큐를 처리합니다.
   */
  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.errorQueue.length > 0) {
      const errorLog = this.errorQueue.shift()
      if (errorLog) {
        await this.sendToRemote(errorLog)
      }
    }

    this.isProcessing = false
  }

  /**
   * 원격 서버로 오류 로그를 전송합니다.
   */
  private async sendToRemote(errorLog: HydrationErrorLog, retryCount = 0): Promise<void> {
    if (!this.config.remoteEndpoint) {
      // 원격 엔드포인트가 설정되지 않은 경우 로컬 스토리지에 저장
      this.saveToLocalStorage(errorLog)
      return
    }

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorLog)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to send error log to remote:', error)
      
      // 재시도
      if (retryCount < this.config.maxRetries) {
        setTimeout(() => {
          this.sendToRemote(errorLog, retryCount + 1)
        }, Math.pow(2, retryCount) * 1000) // 지수 백오프
      } else {
        // 최대 재시도 횟수 초과 시 로컬 스토리지에 저장
        this.saveToLocalStorage(errorLog)
      }
    }
  }

  /**
   * 로컬 스토리지에 오류 로그를 저장합니다.
   */
  private saveToLocalStorage(errorLog: HydrationErrorLog): void {
    try {
      const existingLogs = localStorage.getItem('hydration_error_logs')
      const logs = existingLogs ? JSON.parse(existingLogs) : []
      
      logs.push(errorLog)
      
      // 최대 100개의 로그만 유지
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100)
      }
      
      localStorage.setItem('hydration_error_logs', JSON.stringify(logs))
    } catch (error) {
      console.error('Failed to save error log to localStorage:', error)
    }
  }

  /**
   * 세션 ID를 생성하거나 가져옵니다.
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server'
    
    let sessionId = sessionStorage.getItem('hydration_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('hydration_session_id', sessionId)
    }
    return sessionId
  }

  /**
   * 저장된 오류 로그를 가져옵니다.
   */
  getStoredLogs(): HydrationErrorLog[] {
    try {
      const logs = localStorage.getItem('hydration_error_logs')
      return logs ? JSON.parse(logs) : []
    } catch (error) {
      console.error('Failed to retrieve stored error logs:', error)
      return []
    }
  }

  /**
   * 저장된 오류 로그를 삭제합니다.
   */
  clearStoredLogs(): void {
    try {
      localStorage.removeItem('hydration_error_logs')
    } catch (error) {
      console.error('Failed to clear stored error logs:', error)
    }
  }
}

// 싱글톤 인스턴스
export const hydrationErrorLogger = new HydrationErrorLogger()

export default HydrationErrorLogger