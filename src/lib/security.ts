// 보안 유틸리티 라이브러리

import DOMPurify from 'isomorphic-dompurify'
import CryptoJS from 'crypto-js'

// 보안 설정
export const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30분
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15분
  PASSWORD_MIN_LENGTH: 8,
  CSRF_TOKEN_LENGTH: 32,
  ENCRYPTION_KEY_LENGTH: 256,
  SALT_ROUNDS: 12
}

// XSS 보호 클래스
export class XSSProtection {
  // HTML 콘텐츠 정화
  static sanitizeHTML(html: string): string {
    if (typeof window === 'undefined') {
      // 서버 사이드에서는 기본적인 정화만 수행
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
    }

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'title', 'target'],
      ALLOW_DATA_ATTR: false
    })
  }

  // 텍스트 입력 정화
  static sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '') // HTML 태그 제거
      .replace(/javascript:/gi, '') // JavaScript 프로토콜 제거
      .replace(/on\w+\s*=/gi, '') // 이벤트 핸들러 제거
      .trim()
  }

  // URL 검증
  static validateURL(url: string): boolean {
    try {
      const urlObj = new URL(url)
      const allowedProtocols = ['http:', 'https:', 'mailto:']
      return allowedProtocols.includes(urlObj.protocol)
    } catch {
      return false
    }
  }

  // 이메일 검증
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && !email.includes('<') && !email.includes('>')
  }

  // 전화번호 검증 (한국)
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  // SQL 인젝션 패턴 감지
  static detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/|;|'|"|`)/,
      /(\bOR\b|\bAND\b).*?[=<>]/i
    ]

    return sqlPatterns.some(pattern => pattern.test(input))
  }
}

// 입력 검증 클래스
export class InputValidator {
  // 비밀번호 강도 검사
  static validatePasswordStrength(password: string): {
    isValid: boolean
    score: number
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0

    if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      feedback.push(`최소 ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH}자 이상이어야 합니다`)
    } else {
      score += 1
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('소문자를 포함해야 합니다')
    } else {
      score += 1
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('대문자를 포함해야 합니다')
    } else {
      score += 1
    }

    if (!/[0-9]/.test(password)) {
      feedback.push('숫자를 포함해야 합니다')
    } else {
      score += 1
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('특수문자를 포함해야 합니다')
    } else {
      score += 1
    }

    // 연속된 문자 검사
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('동일한 문자를 3번 이상 연속 사용할 수 없습니다')
      score -= 1
    }

    // 일반적인 패턴 검사
    const commonPatterns = ['123456', 'password', 'qwerty', 'abc123']
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      feedback.push('일반적인 패턴은 사용할 수 없습니다')
      score -= 1
    }

    return {
      isValid: score >= 4 && feedback.length === 0,
      score: Math.max(0, Math.min(5, score)),
      feedback
    }
  }

  // 파일 업로드 검증
  static validateFileUpload(file: File): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      errors.push('허용되지 않는 파일 형식입니다')
    }

    if (file.size > maxSize) {
      errors.push('파일 크기가 5MB를 초과합니다')
    }

    // 파일명 검증
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      errors.push('파일명에 특수문자가 포함되어 있습니다')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 사업자등록번호 검증
  static validateBusinessNumber(number: string): boolean {
    const cleanNumber = number.replace(/[^0-9]/g, '')

    if (cleanNumber.length !== 10) return false

    const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5]
    let sum = 0

    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanNumber[i]) * weights[i]
    }

    const remainder = sum % 10
    const checkDigit = remainder === 0 ? 0 : 10 - remainder

    return checkDigit === parseInt(cleanNumber[9])
  }
}

// 세션 보안 관리 클래스
export class SessionSecurity {
  private static readonly SESSION_KEY = 'obdoc_session'
  private static readonly CSRF_KEY = 'obdoc_csrf'

  // 세션 생성
  static createSession(userId: string, role: string): string {
    const sessionData = {
      userId,
      role,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      csrfToken: this.generateCSRFToken(),
      fingerprint: this.generateFingerprint()
    }

    const sessionToken = this.encryptSessionData(sessionData)

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.SESSION_KEY, sessionToken)
      sessionStorage.setItem(this.CSRF_KEY, sessionData.csrfToken)
    }

    return sessionToken
  }

  // 세션 검증
  static validateSession(sessionToken: string): {
    isValid: boolean
    userId?: string
    role?: string
    needsRefresh?: boolean
  } {
    try {
      const sessionData = this.decryptSessionData(sessionToken)
      const now = Date.now()

      // 세션 만료 검사
      if (now - sessionData.createdAt > SECURITY_CONFIG.SESSION_TIMEOUT) {
        return { isValid: false }
      }

      // 비활성 시간 검사
      if (now - sessionData.lastActivity > SECURITY_CONFIG.SESSION_TIMEOUT / 2) {
        return {
          isValid: true,
          userId: sessionData.userId,
          role: sessionData.role,
          needsRefresh: true
        }
      }

      // 핑거프린트 검증
      if (sessionData.fingerprint !== this.generateFingerprint()) {
        return { isValid: false }
      }

      return {
        isValid: true,
        userId: sessionData.userId,
        role: sessionData.role
      }
    } catch {
      return { isValid: false }
    }
  }

  // 세션 갱신
  static refreshSession(sessionToken: string): string | null {
    const validation = this.validateSession(sessionToken)
    if (!validation.isValid || !validation.userId || !validation.role) {
      return null
    }

    return this.createSession(validation.userId, validation.role)
  }

  // 세션 삭제
  static destroySession(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.SESSION_KEY)
      sessionStorage.removeItem(this.CSRF_KEY)
      localStorage.removeItem(this.SESSION_KEY)
    }
  }

  // CSRF 토큰 생성
  static generateCSRFToken(): string {
    const array = new Uint8Array(SECURITY_CONFIG.CSRF_TOKEN_LENGTH)
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array)
    } else {
      // Fallback for server-side
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // CSRF 토큰 검증
  static validateCSRFToken(token: string): boolean {
    if (typeof window === 'undefined') return true // 서버사이드에서는 스킵

    const storedToken = sessionStorage.getItem(this.CSRF_KEY)
    return storedToken === token
  }

  // 브라우저 핑거프린트 생성
  private static generateFingerprint(): string {
    if (typeof window === 'undefined') return 'server'

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('fingerprint', 10, 10)

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|')

    return CryptoJS.SHA256(fingerprint).toString()
  }

  // 세션 데이터 암호화
  private static encryptSessionData(data: any): string {
    const key = this.getEncryptionKey()
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString()
  }

  // 세션 데이터 복호화
  private static decryptSessionData(encryptedData: string): any {
    const key = this.getEncryptionKey()
    const bytes = CryptoJS.AES.decrypt(encryptedData, key)
    return JSON.parse(bytes.toString())
  }

  // 암호화 키 생성
  private static getEncryptionKey(): string {
    // 실제 환경에서는 환경 변수에서 가져와야 함
    return process.env.NEXT_PUBLIC_SESSION_KEY || 'default-session-key-change-in-production'
  }
}

// 감사 로그 인터페이스
interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  details: any
  ipAddress: string
  userAgent: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// 감사 로깅 클래스
export class AuditLogger {
  private static logs: AuditLog[] = []

  // 로그 기록
  static log(
    userId: string,
    action: string,
    resource: string,
    details: any = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const log: AuditLog = {
      id: this.generateLogId(),
      userId,
      action,
      resource,
      details,
      ipAddress: this.getClientIP(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      timestamp: new Date().toISOString(),
      severity
    }

    this.logs.push(log)

    // 로그 저장 (실제 환경에서는 데이터베이스나 로그 서비스로)
    this.persistLog(log)

    // 중요한 로그는 즉시 알림
    if (severity === 'critical' || severity === 'high') {
      this.sendAlert(log)
    }
  }

  // 로그인 시도 기록
  static logLoginAttempt(email: string, success: boolean, reason?: string): void {
    this.log(
      email,
      'login_attempt',
      'authentication',
      { success, reason },
      success ? 'low' : 'medium'
    )
  }

  // 데이터 접근 기록
  static logDataAccess(userId: string, resource: string, action: string): void {
    this.log(
      userId,
      action,
      resource,
      {},
      'low'
    )
  }

  // 민감한 작업 기록
  static logSensitiveAction(userId: string, action: string, details: any): void {
    this.log(
      userId,
      action,
      'sensitive_operation',
      details,
      'high'
    )
  }

  // 보안 이벤트 기록
  static logSecurityEvent(userId: string, event: string, details: any): void {
    this.log(
      userId,
      event,
      'security',
      details,
      'critical'
    )
  }

  // 로그 조회
  static getLogs(filters?: {
    userId?: string
    action?: string
    severity?: string
    startDate?: string
    endDate?: string
  }): AuditLog[] {
    let filteredLogs = [...this.logs]

    if (filters) {
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId)
      }
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action.includes(filters.action!))
      }
      if (filters.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === filters.severity)
      }
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!)
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!)
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }

  // 로그 ID 생성
  private static generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  // 클라이언트 IP 주소 가져오기
  private static getClientIP(): string {
    // 실제 환경에서는 요청 헤더에서 가져와야 함
    return 'unknown'
  }

  // 로그 영구 저장
  private static persistLog(log: AuditLog): void {
    // 실제 환경에서는 데이터베이스나 로그 서비스에 저장
    console.log('Audit Log:', log)
  }

  // 중요 로그 알림
  private static sendAlert(log: AuditLog): void {
    // 실제 환경에서는 알림 서비스로 전송
    console.warn('Security Alert:', log)
  }
}

// 보안 헤더 설정
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self';
    frame-ancestors 'none';
  `.replace(/\s+/g, ' ').trim()
}

// 보안 유틸리티 함수들
export const SecurityUtils = {
  // 안전한 랜덤 문자열 생성
  generateSecureRandom: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''

    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(length)
      window.crypto.getRandomValues(array)
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length]
      }
    } else {
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)]
      }
    }

    return result
  },

  // 해시 생성
  generateHash: (data: string, salt?: string): string => {
    const saltedData = salt ? data + salt : data
    return CryptoJS.SHA256(saltedData).toString()
  },

  // 시간 기반 토큰 생성
  generateTimeBasedToken: (secret: string, window: number = 30): string => {
    const time = Math.floor(Date.now() / 1000 / window)
    return CryptoJS.HmacSHA256(time.toString(), secret).toString()
  },

  // 레이트 리미팅 체크
  checkRateLimit: (key: string, limit: number, windowMs: number): boolean => {
    if (typeof window === 'undefined') return true

    const now = Date.now()
    const windowKey = `rate_limit_${key}_${Math.floor(now / windowMs)}`
    const count = parseInt(localStorage.getItem(windowKey) || '0')

    if (count >= limit) {
      return false
    }

    localStorage.setItem(windowKey, (count + 1).toString())
    return true
  }
}

export default {
  XSSProtection,
  InputValidator,
  SessionSecurity,
  AuditLogger,
  SecurityUtils,
  SECURITY_CONFIG,
  SECURITY_HEADERS
}