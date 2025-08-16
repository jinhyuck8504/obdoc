/**
 * 가입 코드 보안 관련 유틸리티
 */

// import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { InviteCodeError } from '@/types/hospital'

// 암호화 설정
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-development'
const HASH_ROUNDS = 12

/**
 * 가입 코드 해싱 (임시 구현)
 */
export const hashInviteCode = (code: string): string => {
  // 임시로 crypto를 사용한 해싱
  return crypto.createHash('sha256').update(code + 'salt').digest('hex')
}

/**
 * 가입 코드 검증 (해시 비교)
 */
export const validateInviteCode = (inputCode: string, hashedCode: string): boolean => {
  // 임시로 crypto를 사용한 검증
  const inputHash = crypto.createHash('sha256').update(inputCode + 'salt').digest('hex')
  return inputHash === hashedCode
}

/**
 * 민감한 데이터 암호화
 */
export const encryptSensitiveData = (data: string): string => {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

/**
 * 민감한 데이터 복호화
 */
export const decryptSensitiveData = (encryptedData: string): string => {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Rate Limiting을 위한 키 생성
 */
export const generateRateLimitKey = (action: string, identifier: string): string => {
  return `rate_limit:${action}:${identifier}`
}

/**
 * IP 주소 기반 Rate Limiting 체크
 */
export const checkRateLimit = async (
  action: string,
  ipAddress: string,
  maxAttempts: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
  // TODO: 실제 구현에서는 Redis 또는 메모리 캐시 사용
  // 현재는 임시 구현
  const key = generateRateLimitKey(action, ipAddress)
  
  // 임시로 허용 반환 (실제로는 캐시에서 확인)
  return {
    allowed: true,
    remaining: maxAttempts - 1,
    resetTime: Date.now() + windowMs
  }
}

/**
 * 의심스러운 활동 패턴 감지
 */
export const detectSuspiciousActivity = (
  attempts: Array<{
    timestamp: number
    ipAddress: string
    userAgent: string
    success: boolean
  }>
): {
  isSuspicious: boolean
  reasons: string[]
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
} => {
  const reasons: string[] = []
  let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
  
  // 짧은 시간 내 많은 실패 시도
  const recentFailures = attempts.filter(
    attempt => !attempt.success && Date.now() - attempt.timestamp < 5 * 60 * 1000
  )
  
  if (recentFailures.length >= 10) {
    reasons.push('Multiple failed attempts in short time')
    severity = 'HIGH'
  } else if (recentFailures.length >= 5) {
    reasons.push('Several failed attempts detected')
    severity = 'MEDIUM'
  }
  
  // 동일 IP에서 다양한 User-Agent
  const uniqueUserAgents = new Set(attempts.map(a => a.userAgent))
  const uniqueIPs = new Set(attempts.map(a => a.ipAddress))
  
  if (uniqueUserAgents.size > 5 && uniqueIPs.size === 1) {
    reasons.push('Multiple user agents from single IP')
    severity = severity === 'HIGH' ? 'HIGH' : 'MEDIUM'
  }
  
  // 비정상적인 시간대 활동
  const nightAttempts = attempts.filter(attempt => {
    const hour = new Date(attempt.timestamp).getHours()
    return hour >= 2 && hour <= 5
  })
  
  if (nightAttempts.length > attempts.length * 0.8) {
    reasons.push('Unusual time pattern detected')
    severity = severity === 'HIGH' ? 'HIGH' : 'MEDIUM'
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reasons,
    severity
  }
}

/**
 * 가입 코드 만료 시간 계산
 */
export const calculateExpirationTime = (hoursFromNow: number): Date => {
  const now = new Date()
  return new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000)
}

/**
 * 가입 코드 만료 여부 확인
 */
export const isInviteCodeExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt
}

/**
 * 가입 코드 사용 가능 여부 확인
 */
export const canUseInviteCode = (
  currentUses: number,
  maxUses?: number,
  expiresAt?: Date
): { canUse: boolean; error?: InviteCodeError } => {
  // 만료 시간 확인
  if (expiresAt && isInviteCodeExpired(expiresAt)) {
    return { canUse: false, error: InviteCodeError.EXPIRED }
  }
  
  // 사용 횟수 확인
  if (maxUses && currentUses >= maxUses) {
    return { canUse: false, error: InviteCodeError.MAX_USES_EXCEEDED }
  }
  
  return { canUse: true }
}

/**
 * 보안 로그 생성
 */
export const createSecurityLog = (
  action: string,
  userId: string,
  ipAddress: string,
  userAgent: string,
  details: Record<string, any> = {},
  success: boolean = true
) => {
  return {
    id: crypto.randomUUID(),
    action,
    userId,
    ipAddress,
    userAgent,
    timestamp: new Date(),
    details,
    success
  }
}

/**
 * 민감한 정보 마스킹
 */
export const maskSensitiveInfo = (data: string, visibleChars: number = 4): string => {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length)
  }
  
  const visible = data.slice(-visibleChars)
  const masked = '*'.repeat(data.length - visibleChars)
  return masked + visible
}

/**
 * 안전한 비교 (타이밍 공격 방지)
 */
export const safeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * 입력 데이터 sanitization
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>\"']/g, '') // HTML 태그 및 따옴표 제거
    .replace(/javascript:/gi, '') // JavaScript 프로토콜 제거
    .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
    .trim()
}

/**
 * 가입 코드 강도 검증
 */
export const validateInviteCodeStrength = (code: string): {
  isStrong: boolean
  issues: string[]
} => {
  const issues: string[] = []
  
  if (code.length < 8) {
    issues.push('Code too short')
  }
  
  if (!/[A-Z]/.test(code)) {
    issues.push('Missing uppercase letters')
  }
  
  if (!/[0-9]/.test(code)) {
    issues.push('Missing numbers')
  }
  
  // 연속된 문자 확인
  for (let i = 0; i < code.length - 2; i++) {
    if (code.charCodeAt(i) + 1 === code.charCodeAt(i + 1) && 
        code.charCodeAt(i + 1) + 1 === code.charCodeAt(i + 2)) {
      issues.push('Contains sequential characters')
      break
    }
  }
  
  // 반복 문자 확인
  for (let i = 0; i < code.length - 2; i++) {
    if (code[i] === code[i + 1] && code[i + 1] === code[i + 2]) {
      issues.push('Contains repeated characters')
      break
    }
  }
  
  return {
    isStrong: issues.length === 0,
    issues
  }
}