/**
 * 보안 미들웨어
 */
import { NextRequest, NextResponse } from 'next/server'

export interface SecurityConfig {
  enableRateLimit?: boolean
  enableCORS?: boolean
  enableCSRF?: boolean
  allowedOrigins?: string[]
  rateLimitRequests?: number
  rateLimitWindow?: number
}

/**
 * 기본 보안 설정
 */
const defaultConfig: SecurityConfig = {
  enableRateLimit: true,
  enableCORS: true,
  enableCSRF: false,
  allowedOrigins: ['http://localhost:3000'],
  rateLimitRequests: 100,
  rateLimitWindow: 15 * 60 * 1000 // 15분
}

/**
 * Rate limiting을 위한 간단한 메모리 저장소
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limit 체크
 */
function checkRateLimit(ip: string, config: SecurityConfig): boolean {
  const now = Date.now()
  const key = ip
  const limit = config.rateLimitRequests || 100
  const window = config.rateLimitWindow || 15 * 60 * 1000

  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + window })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

/**
 * CORS 헤더 설정
 */
function setCORSHeaders(response: NextResponse, config: SecurityConfig): void {
  const allowedOrigins = config.allowedOrigins || ['*']
  
  response.headers.set('Access-Control-Allow-Origin', allowedOrigins.join(', '))
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
}

/**
 * 보안 헤더 설정
 */
function setSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
}

/**
 * 보안 미들웨어 함수
 */
export function securityMiddleware(config: SecurityConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config }

  return async (request: NextRequest): Promise<NextResponse> => {
    const response = NextResponse.next()

    // IP 주소 추출
    const ip = request.ip || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Rate limiting
    if (finalConfig.enableRateLimit && !checkRateLimit(ip, finalConfig)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }

    // CORS 설정
    if (finalConfig.enableCORS) {
      setCORSHeaders(response, finalConfig)
    }

    // 보안 헤더 설정
    setSecurityHeaders(response)

    // OPTIONS 요청 처리
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers })
    }

    return response
  }
}

/**
 * API 라우트용 보안 검증
 */
export function validateApiRequest(request: NextRequest): { isValid: boolean; error?: string } {
  // Content-Type 검증
  if (request.method === 'POST' || request.method === 'PUT') {
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return { isValid: false, error: 'Invalid content type' }
    }
  }

  // Authorization 헤더 검증 (필요한 경우)
  const authHeader = request.headers.get('authorization')
  if (request.url.includes('/api/admin/') && !authHeader) {
    return { isValid: false, error: 'Authorization required' }
  }

  return { isValid: true }
}

/**
 * 입력 데이터 검증
 */
export function validateInput(data: any, rules: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field]

    if (rule.required && (!value || value === '')) {
      errors.push(`${field} is required`)
    }

    if (value && rule.type) {
      if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${field} must be a valid email`)
      }

      if (rule.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`)
      }

      if (rule.type === 'number' && typeof value !== 'number') {
        errors.push(`${field} must be a number`)
      }
    }

    if (value && rule.minLength && value.length < rule.minLength) {
      errors.push(`${field} must be at least ${rule.minLength} characters`)
    }

    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${field} must be no more than ${rule.maxLength} characters`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export default securityMiddleware