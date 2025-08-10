// Optional Sentry import - will be undefined if not installed
let Sentry: any
try {
  Sentry = require('@sentry/nextjs')
} catch (error) {
  // Sentry not installed, logging will work without it
  Sentry = null
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  userId?: string
  sessionId?: string
  requestId?: string
  userAgent?: string
  ip?: string
  [key: string]: any
}

class Logger {
  private level: LogLevel
  private isProduction: boolean

  constructor() {
    this.level = this.getLogLevel()
    this.isProduction = process.env.NODE_ENV === 'production'
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO'
    switch (level) {
      case 'DEBUG': return LogLevel.DEBUG
      case 'INFO': return LogLevel.INFO
      case 'WARN': return LogLevel.WARN
      case 'ERROR': return LogLevel.ERROR
      default: return LogLevel.INFO
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : ''
    return `[${timestamp}] ${level}: ${message}${contextStr}`
  }

  private logToConsole(level: string, message: string, context?: LogContext, error?: Error) {
    const formattedMessage = this.formatMessage(level, message, context)
    
    switch (level) {
      case 'DEBUG':
        console.debug(formattedMessage, error)
        break
      case 'INFO':
        console.info(formattedMessage, error)
        break
      case 'WARN':
        console.warn(formattedMessage, error)
        break
      case 'ERROR':
        console.error(formattedMessage, error)
        break
    }
  }

  private logToSentry(level: string, message: string, context?: LogContext, error?: Error) {
    if (!this.isProduction || !Sentry) return

    const sentryLevel = this.getSentryLevel(level)
    
    Sentry.withScope((scope: any) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setTag(key, String(value))
        })
      }
      
      scope.setLevel(sentryLevel)
      
      if (error) {
        Sentry.captureException(error)
      } else {
        Sentry.captureMessage(message, sentryLevel)
      }
    })
  }

  private getSentryLevel(level: string): string {
    switch (level) {
      case 'DEBUG': return 'debug'
      case 'INFO': return 'info'
      case 'WARN': return 'warning'
      case 'ERROR': return 'error'
      default: return 'info'
    }
  }

  debug(message: string, context?: LogContext) {
    if (!this.shouldLog(LogLevel.DEBUG)) return
    
    this.logToConsole('DEBUG', message, context)
    this.logToSentry('DEBUG', message, context)
  }

  info(message: string, context?: LogContext) {
    if (!this.shouldLog(LogLevel.INFO)) return
    
    this.logToConsole('INFO', message, context)
    this.logToSentry('INFO', message, context)
  }

  warn(message: string, context?: LogContext, error?: Error) {
    if (!this.shouldLog(LogLevel.WARN)) return
    
    this.logToConsole('WARN', message, context, error)
    this.logToSentry('WARN', message, context, error)
  }

  error(message: string, context?: LogContext, error?: Error) {
    if (!this.shouldLog(LogLevel.ERROR)) return
    
    this.logToConsole('ERROR', message, context, error)
    this.logToSentry('ERROR', message, context, error)
  }

  // Specific logging methods for common scenarios
  userAction(action: string, userId: string, details?: any) {
    this.info(`User action: ${action}`, {
      userId,
      action,
      details: details ? JSON.stringify(details) : undefined
    })
  }

  apiRequest(method: string, path: string, userId?: string, duration?: number) {
    this.info(`API request: ${method} ${path}`, {
      method,
      path,
      userId,
      duration: duration ? `${duration}ms` : undefined
    })
  }

  apiError(method: string, path: string, error: Error, userId?: string) {
    this.error(`API error: ${method} ${path}`, {
      method,
      path,
      userId,
      errorMessage: error.message,
      errorStack: error.stack
    }, error)
  }

  authEvent(event: string, userId?: string, details?: any) {
    this.info(`Auth event: ${event}`, {
      event,
      userId,
      details: details ? JSON.stringify(details) : undefined
    })
  }

  securityEvent(event: string, details: any, severity: 'info' | 'warn' | 'error' = 'warn') {
    const message = `Security event: ${event}`
    const context = {
      event,
      ...details
    }

    switch (severity) {
      case 'info':
        this.info(message, context)
        break
      case 'warn':
        this.warn(message, context)
        break
      case 'error':
        this.error(message, context)
        break
    }
  }

  performanceMetric(metric: string, value: number, context?: LogContext) {
    this.info(`Performance metric: ${metric} = ${value}`, {
      metric,
      value,
      ...context
    })
  }
}

export const logger = new Logger()

// Middleware helper for request logging
export function createRequestLogger(req: Request) {
  const requestId = crypto.randomUUID()
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  return {
    requestId,
    log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: any) => {
      logger[level](message, {
        requestId,
        userAgent,
        ip,
        ...context
      })
    }
  }
}