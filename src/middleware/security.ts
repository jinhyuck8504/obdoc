// 보안 미들웨어

import { NextRequest, NextResponse } from 'next/server'
import { SECURITY_HEADERS, SecurityUtils, AuditLogger } from '@/lib/security'

// 보안 미들웨어 설정
interface SecurityMiddlewareConfig {
  enableCSP: boolean
  enableRateLimit: boolean
  enableAuditLog: boolean
  rateLimitRequests: number
  rateLimitWindow: number
  excludePaths: string[]
}

const DEFAULT_CONFIG: SecurityMiddlewareConfig = {
  enableCSP: true,
  enableRateLimit: true,
  enableAuditLog: true,
  rateLimitRequests: 100,
  rateLimitWindow: 15 * 60 * 1000, // 15분
  excludePaths: ['/api/health', '/favicon.ico', '/_next']
}

// IP 주소 추출
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

// User Agent 검증
function validateUserAgent(userAgent: string): boolean {
  // 의심스러운 User Agent 패턴 검사
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http-client/i
  ]
  
  // 개발 환경에서는 모든 User Agent 허용
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  return !suspiciousPatterns.some(pattern => pattern.test(userAgent))
}

// 경로 검증
function isExcludedPath(pathname: string, excludePaths: string[]): boolean {
  return excludePaths.some(path => pathname.startsWith(path))
}

// 레이트 리미팅
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(
  ip: string, 
  maxRequests: number, 
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `${ip}_${Math.floor(now / windowMs)}`
  
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs }
  
  if (now > current.resetTime) {
    // 윈도우 리셋
    current.count = 0
    current.resetTime = now + windowMs
  }
  
  current.count++
  rateLimitStore.set(key, current)
  
  // 만료된 엔트리 정리
  for (const [storeKey, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(storeKey)
    }
  }
  
  return {
    allowed: current.count <= maxRequests,
    remaining: Math.max(0, maxRequests - current.count),
    resetTime: current.resetTime
  }
}

// 보안 헤더 추가
function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

// 의심스러운 요청 감지
function detectSuspiciousRequest(request: NextRequest): {
  isSuspicious: boolean
  reasons: string[]
} {
  const reasons: string[] = []
  const url = request.nextUrl
  const userAgent = request.headers.get('user-agent') || ''
  
  // SQL 인젝션 패턴 검사
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/|;|'|"|`)/,
    /(\bOR\b|\bAND\b).*?[=<>]/i
  ]
  
  const queryString = url.search
  if (sqlPatterns.some(pattern => pattern.test(queryString))) {
    reasons.push('SQL injection attempt detected')
  }
  
  // XSS 패턴 검사
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ]
  
  if (xssPatterns.some(pattern => pattern.test(queryString))) {
    reasons.push('XSS attempt detected')
  }
  
  // 경로 순회 공격 검사
  if (url.pathname.includes('../') || url.pathname.includes('..\\')) {
    reasons.push('Path traversal attempt detected')
  }
  
  // 비정상적으로 긴 URL
  if (url.href.length > 2048) {
    reasons.push('Abnormally long URL')
  }
  
  // 의심스러운 User Agent
  if (!validateUserAgent(userAgent)) {
    reasons.push('Suspicious user agent')
  }
  
  // 비정상적인 헤더
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    reasons.push('Abnormally large request body')
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reasons
  }
}

// 메인 보안 미들웨어
export function createSecurityMiddleware(config: Partial<SecurityMiddlewareConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  return async function securityMiddleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    
    // 제외 경로 확인
    if (isExcludedPath(pathname, finalConfig.excludePaths)) {
      return NextResponse.next()
    }
    
    // 의심스러운 요청 감지
    const suspiciousCheck = detectSuspiciousRequest(request)
    if (suspiciousCheck.isSuspicious) {
      // 감사 로그 기록
      if (finalConfig.enableAuditLog) {
        AuditLogger.logSecurityEvent(
          'anonymous',
          'suspicious_request_blocked',
          {
            ip,
            userAgent,
            pathname,
            reasons: suspiciousCheck.reasons
          }
        )
      }
      
      return new NextResponse('Forbidden', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }
    
    // 레이트 리미팅
    if (finalConfig.enableRateLimit) {
      const rateLimit = checkRateLimit(
        ip,
        finalConfig.rateLimitRequests,
        finalConfig.rateLimitWindow
      )
      
      if (!rateLimit.allowed) {
        // 감사 로그 기록
        if (finalConfig.enableAuditLog) {
          AuditLogger.logSecurityEvent(
            'anonymous',
            'rate_limit_exceeded',
            { ip, userAgent, pathname }
          )
        }
        
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Content-Type': 'text/plain',
            'X-RateLimit-Limit': finalConfig.rateLimitRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        })
      }
    }
    
    // 정상 요청 처리
    const response = NextResponse.next()
    
    // 보안 헤더 추가
    addSecurityHeaders(response)
    
    // 레이트 리미팅 헤더 추가
    if (finalConfig.enableRateLimit) {
      const rateLimit = checkRateLimit(ip, finalConfig.rateLimitRequests, finalConfig.rateLimitWindow)
      response.headers.set('X-RateLimit-Limit', finalConfig.rateLimitRequests.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
      response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString())
    }
    
    // 감사 로그 기록 (정상 요청)
    if (finalConfig.enableAuditLog && pathname.startsWith('/api/')) {
      AuditLogger.log(
        'anonymous',
        'api_request',
        pathname,
        { method: request.method, ip, userAgent },
        'low'
      )
    }
    
    return response
  }
}

// API 라우트용 보안 미들웨어
export function createAPISecurityMiddleware() {
  return async function apiSecurityMiddleware(
    request: NextRequest,
    context: { params: any }
  ) {
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const pathname = request.nextUrl.pathname
    
    // CSRF 토큰 검증 (POST, PUT, DELETE 요청)
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      const csrfToken = request.headers.get('x-csrf-token')
      if (!csrfToken) {
        return new NextResponse(
          JSON.stringify({ error: 'CSRF token required' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
    
    // Content-Type 검증
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid content type' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
    
    // 요청 본문 크기 제한
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB
      return new NextResponse(
        JSON.stringify({ error: 'Request body too large' }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // 감사 로그 기록
    AuditLogger.log(
      'anonymous', // 실제로는 인증된 사용자 ID를 사용
      `api_${request.method.toLowerCase()}`,
      pathname,
      { ip, userAgent },
      'medium'
    )
    
    return NextResponse.next()
  }
}

// 인증 미들웨어
export function createAuthMiddleware(protectedPaths: string[] = ['/dashboard', '/api/protected']) {
  return async function authMiddleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    
    // 보호된 경로 확인
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
    
    if (isProtectedPath) {
      const authHeader = request.headers.get('authorization')
      const sessionCookie = request.cookies.get('session')
      
      if (!authHeader && !sessionCookie) {
        // 로그인 페이지로 리다이렉트
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        
        return NextResponse.redirect(loginUrl)
      }
      
      // 세션 검증 로직 (실제 구현에서는 JWT 또는 세션 검증)
      // 여기서는 기본적인 검증만 수행
    }
    
    return NextResponse.next()
  }
}

export default createSecurityMiddleware