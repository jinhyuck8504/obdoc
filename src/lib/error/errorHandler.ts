// 오류 타입 정의
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  SERVER = 'server',
  DATABASE = 'database',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 오류 인터페이스
export interface AppError {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  message: string
  userMessage: string
  details?: any
  timestamp: Date
  userId?: string
  context?: Record<string, any>
  stack?: string
  recoverable: boolean
  retryable: boolean
  suggestions?: string[]
}

// 한국어 오류 메시지 매핑
const ERROR_MESSAGES: Record<string, { message: string; suggestions: string[] }> = {
  // 인증 관련
  'auth/invalid-email': {
    message: '올바른 이메일 주소를 입력해주세요.',
    suggestions: ['이메일 형식을 확인해주세요 (예: user@example.com)']
  },
  'auth/user-disabled': {
    message: '계정이 비활성화되었습니다.',
    suggestions: ['고객센터에 문의해주세요', '관리자에게 계정 활성화를 요청하세요']
  },
  'auth/user-not-found': {
    message: '등록되지 않은 이메일입니다.',
    suggestions: ['이메일 주소를 다시 확인해주세요', '회원가입을 진행해주세요']
  },
  'auth/wrong-password': {
    message: '비밀번호가 올바르지 않습니다.',
    suggestions: ['비밀번호를 다시 확인해주세요', '비밀번호 찾기를 이용해주세요']
  },
  'auth/too-many-requests': {
    message: '너무 많은 로그인 시도가 있었습니다.',
    suggestions: ['잠시 후 다시 시도해주세요', '비밀번호 찾기를 이용해주세요']
  },
  'auth/weak-password': {
    message: '비밀번호가 너무 간단합니다.',
    suggestions: ['8자 이상의 비밀번호를 사용해주세요', '영문, 숫자를 조합해주세요']
  },
  'auth/email-already-in-use': {
    message: '이미 사용 중인 이메일입니다.',
    suggestions: ['다른 이메일을 사용해주세요', '로그인을 시도해보세요']
  },

  // 네트워크 관련
  'network/timeout': {
    message: '요청 시간이 초과되었습니다.',
    suggestions: ['인터넷 연결을 확인해주세요', '잠시 후 다시 시도해주세요']
  },
  'network/offline': {
    message: '인터넷 연결이 끊어졌습니다.',
    suggestions: ['인터넷 연결을 확인해주세요', 'Wi-Fi 또는 데이터 연결을 확인해주세요']
  },
  'network/server-error': {
    message: '서버에 일시적인 문제가 발생했습니다.',
    suggestions: ['잠시 후 다시 시도해주세요', '문제가 지속되면 고객센터에 문의해주세요']
  },

  // 데이터베이스 관련
  'database/connection-failed': {
    message: '데이터베이스 연결에 실패했습니다.',
    suggestions: ['잠시 후 다시 시도해주세요', '관리자에게 문의해주세요']
  },
  'database/query-failed': {
    message: '데이터 처리 중 오류가 발생했습니다.',
    suggestions: ['입력 정보를 다시 확인해주세요', '잠시 후 다시 시도해주세요']
  },

  // 검증 관련
  'validation/required-field': {
    message: '필수 입력 항목이 누락되었습니다.',
    suggestions: ['모든 필수 항목을 입력해주세요', '빨간색으로 표시된 항목을 확인해주세요']
  },
  'validation/invalid-format': {
    message: '입력 형식이 올바르지 않습니다.',
    suggestions: ['입력 형식을 다시 확인해주세요', '예시를 참고해주세요']
  },
  'validation/phone-format': {
    message: '전화번호 형식이 올바르지 않습니다.',
    suggestions: ['010-1234-5678 형식으로 입력해주세요', '하이픈(-)을 포함해서 입력해주세요']
  },
  'validation/business-number': {
    message: '사업자등록번호 형식이 올바르지 않습니다.',
    suggestions: ['123-45-67890 형식으로 입력해주세요', '10자리 숫자를 하이픈으로 구분해주세요']
  },

  // 권한 관련
  'permission/access-denied': {
    message: '접근 권한이 없습니다.',
    suggestions: ['로그인 상태를 확인해주세요', '관리자에게 권한을 요청해주세요']
  },
  'permission/insufficient-role': {
    message: '해당 기능을 사용할 권한이 없습니다.',
    suggestions: ['계정 유형을 확인해주세요', '관리자에게 문의해주세요']
  },

  // 파일 관련
  'file/too-large': {
    message: '파일 크기가 너무 큽니다.',
    suggestions: ['5MB 이하의 파일을 업로드해주세요', '이미지를 압축해서 다시 시도해주세요']
  },
  'file/invalid-type': {
    message: '지원하지 않는 파일 형식입니다.',
    suggestions: ['JPG, PNG, PDF 파일만 업로드 가능합니다', '파일 확장자를 확인해주세요']
  },

  // 일반적인 오류
  'general/not-found': {
    message: '요청한 정보를 찾을 수 없습니다.',
    suggestions: ['URL을 다시 확인해주세요', '삭제되었거나 이동된 정보일 수 있습니다']
  },
  'general/rate-limit': {
    message: '요청 한도를 초과했습니다.',
    suggestions: ['잠시 후 다시 시도해주세요', '너무 빠른 요청을 피해주세요']
  }
}

// 오류 생성 함수
export function createError(
  type: ErrorType,
  originalError: any,
  context?: Record<string, any>
): AppError {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const timestamp = new Date()
  
  // 오류 코드 추출
  const errorCode = getErrorCode(originalError)
  const errorInfo = ERROR_MESSAGES[errorCode] || {
    message: '알 수 없는 오류가 발생했습니다.',
    suggestions: ['페이지를 새로고침해주세요', '문제가 지속되면 고객센터에 문의해주세요']
  }

  // 심각도 결정
  const severity = determineSeverity(type, originalError)
  
  // 복구 가능성 결정
  const recoverable = isRecoverable(type, originalError)
  const retryable = isRetryable(type, originalError)

  return {
    id: errorId,
    type,
    severity,
    message: originalError?.message || '알 수 없는 오류',
    userMessage: errorInfo.message,
    details: originalError,
    timestamp,
    context,
    stack: originalError?.stack,
    recoverable,
    retryable,
    suggestions: errorInfo.suggestions
  }
}

// 오류 코드 추출
function getErrorCode(error: any): string {
  if (error?.code) return error.code
  if (error?.name) return error.name.toLowerCase()
  if (error?.message) {
    // 일반적인 오류 패턴 매칭
    if (error.message.includes('timeout')) return 'network/timeout'
    if (error.message.includes('network')) return 'network/offline'
    if (error.message.includes('required')) return 'validation/required-field'
    if (error.message.includes('format')) return 'validation/invalid-format'
    if (error.message.includes('permission')) return 'permission/access-denied'
    if (error.message.includes('not found')) return 'general/not-found'
  }
  return 'unknown'
}

// 심각도 결정
function determineSeverity(type: ErrorType, error: any): ErrorSeverity {
  switch (type) {
    case ErrorType.VALIDATION:
      return ErrorSeverity.LOW
    case ErrorType.AUTHENTICATION:
    case ErrorType.AUTHORIZATION:
      return ErrorSeverity.MEDIUM
    case ErrorType.DATABASE:
    case ErrorType.SERVER:
      return ErrorSeverity.HIGH
    case ErrorType.NETWORK:
      return error?.message?.includes('timeout') ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH
    default:
      return ErrorSeverity.MEDIUM
  }
}

// 복구 가능성 확인
function isRecoverable(type: ErrorType, error: any): boolean {
  switch (type) {
    case ErrorType.VALIDATION:
    case ErrorType.AUTHENTICATION:
      return true
    case ErrorType.NETWORK:
      return true
    case ErrorType.RATE_LIMIT:
      return true
    case ErrorType.NOT_FOUND:
      return false
    case ErrorType.SERVER:
    case ErrorType.DATABASE:
      return false
    default:
      return true
  }
}

// 재시도 가능성 확인
function isRetryable(type: ErrorType, error: any): boolean {
  switch (type) {
    case ErrorType.NETWORK:
    case ErrorType.SERVER:
    case ErrorType.DATABASE:
      return true
    case ErrorType.RATE_LIMIT:
      return true
    case ErrorType.VALIDATION:
    case ErrorType.AUTHENTICATION:
    case ErrorType.AUTHORIZATION:
    case ErrorType.NOT_FOUND:
      return false
    default:
      return false
  }
}

// 중앙화된 오류 처리기
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorLog: AppError[] = []
  private maxLogSize = 100

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  // 오류 처리
  handle(error: any, type: ErrorType = ErrorType.UNKNOWN, context?: Record<string, any>): AppError {
    const appError = createError(type, error, context)
    
    // 로그에 저장
    this.logError(appError)
    
    // 콘솔에 출력 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error Handler:', {
        id: appError.id,
        type: appError.type,
        severity: appError.severity,
        message: appError.message,
        userMessage: appError.userMessage,
        context: appError.context,
        suggestions: appError.suggestions
      })
    }

    // 심각한 오류는 외부 서비스에 보고 (실제 환경에서)
    if (appError.severity === ErrorSeverity.CRITICAL || appError.severity === ErrorSeverity.HIGH) {
      this.reportError(appError)
    }

    return appError
  }

  // 오류 로그 저장
  private logError(error: AppError): void {
    this.errorLog.unshift(error)
    
    // 로그 크기 제한
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    // 로컬 스토리지에 저장 (클라이언트 사이드)
    if (typeof window !== 'undefined') {
      try {
        const recentErrors = this.errorLog.slice(0, 10).map(err => ({
          id: err.id,
          type: err.type,
          severity: err.severity,
          userMessage: err.userMessage,
          timestamp: err.timestamp
        }))
        localStorage.setItem('obdoc_error_log', JSON.stringify(recentErrors))
      } catch (e) {
        // 로컬 스토리지 저장 실패 시 무시
      }
    }
  }

  // 외부 오류 보고 서비스에 전송
  private reportError(error: AppError): void {
    // 실제 환경에서는 Sentry, LogRocket 등의 서비스 사용
    if (process.env.NODE_ENV === 'production') {
      // 예: Sentry.captureException(error)
      console.error('Critical Error Reported:', error)
    }
  }

  // 오류 로그 조회
  getErrorLog(): AppError[] {
    return [...this.errorLog]
  }

  // 특정 타입의 오류 조회
  getErrorsByType(type: ErrorType): AppError[] {
    return this.errorLog.filter(error => error.type === type)
  }

  // 오류 로그 초기화
  clearErrorLog(): void {
    this.errorLog = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('obdoc_error_log')
    }
  }

  // 오류 통계
  getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    
    Object.values(ErrorType).forEach(type => {
      stats[type] = this.errorLog.filter(error => error.type === type).length
    })

    return stats
  }
}

// 편의 함수들
export const errorHandler = ErrorHandler.getInstance()

export function handleValidationError(error: any, context?: Record<string, any>): AppError {
  return errorHandler.handle(error, ErrorType.VALIDATION, context)
}

export function handleAuthError(error: any, context?: Record<string, any>): AppError {
  return errorHandler.handle(error, ErrorType.AUTHENTICATION, context)
}

export function handleNetworkError(error: any, context?: Record<string, any>): AppError {
  return errorHandler.handle(error, ErrorType.NETWORK, context)
}

export function handleServerError(error: any, context?: Record<string, any>): AppError {
  return errorHandler.handle(error, ErrorType.SERVER, context)
}

export function handleDatabaseError(error: any, context?: Record<string, any>): AppError {
  return errorHandler.handle(error, ErrorType.DATABASE, context)
}

// React 컴포넌트에서 사용할 수 있는 오류 처리 훅
export function useErrorHandler() {
  const handleError = (error: any, type: ErrorType = ErrorType.UNKNOWN, context?: Record<string, any>) => {
    return errorHandler.handle(error, type, context)
  }

  return {
    handleError,
    handleValidationError: (error: any, context?: Record<string, any>) => handleValidationError(error, context),
    handleAuthError: (error: any, context?: Record<string, any>) => handleAuthError(error, context),
    handleNetworkError: (error: any, context?: Record<string, any>) => handleNetworkError(error, context),
    handleServerError: (error: any, context?: Record<string, any>) => handleServerError(error, context),
    getErrorLog: () => errorHandler.getErrorLog(),
    clearErrorLog: () => errorHandler.clearErrorLog()
  }
}