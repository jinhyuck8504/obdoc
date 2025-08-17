/**
 * Rate Limiter 미들웨어
 */
import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15분
  maxRequests: 100,
  message: 'Too many requests'
}

// 메모리 기반 저장소 (프로덕션에서는 Redis 등 사용 권장)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiter 미들웨어
 */
export function rateLimiter(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config }

  return (request: NextRequest): NextResponse | null => {
    const ip = getClientIP(request)
    const now = Date.now()
    const key = `${ip}:${request.nextUrl.pathname}`

    // 기존 기록 확인
    const record = requestCounts.get(key)

    if (!record || now > record.resetTime) {
      // 새로운 윈도우 시작
      requestCounts.set(key, {
        count: 1,
        resetTime: now + finalConfig.windowMs
      })
      return null // 통과
    }

    if (record.count >= finalConfig.maxRequests) {
      // 제한 초과
      return new NextResponse(finalConfig.message, { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString()
        }
      })
    }

    // 카운트 증가
    record.count++
    return null // 통과
  }
}

/**
 * 클라이언트 IP 주소 추출
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.ip

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return realIP || remoteAddr || 'unknown'
}

/**
 * API 라우트용 rate limiter 래퍼
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: Partial<RateLimitConfig>
) {
  const limiter = rateLimiter(config)

  return async (req: NextRequest): Promise<NextResponse> => {
    const limitResponse = limiter(req)
    if (limitResponse) {
      return limitResponse
    }

    return handler(req)
  }
}

/**
 * 정리 함수 (만료된 기록 제거)
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now()
  
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key)
    }
  }
}

// 주기적으로 만료된 기록 정리
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRecords, 5 * 60 * 1000) // 5분마다
}

/**
 * 엄격한 Rate Limiter (더 낮은 제한)
 */
export function strictRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const strictConfig = {
    windowMs: 5 * 60 * 1000, // 5분
    maxRequests: 10, // 더 낮은 제한
    message: 'Too many requests - strict limit applied',
    ...config
  }

  return rateLimiter(strictConfig)
}

/**
 * Rate limit 통계 조회
 */
export function getRateLimitStats(): {
  totalKeys: number
  activeWindows: number
  topIPs: Array<{ ip: string; requests: number }>
} {
  const now = Date.now()
  const activeRecords = Array.from(requestCounts.entries())
    .filter(([_, record]) => now <= record.resetTime)

  const ipStats = new Map<string, number>()
  
  activeRecords.forEach(([key, record]) => {
    const ip = key.split(':')[0]
    ipStats.set(ip, (ipStats.get(ip) || 0) + record.count)
  })

  const topIPs = Array.from(ipStats.entries())
    .map(([ip, requests]) => ({ ip, requests }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10)

  return {
    totalKeys: requestCounts.size,
    activeWindows: activeRecords.length,
    topIPs
  }
}

/**
 * 차단된 IP 목록 조회
 */
export function getBlockedIPs(): Array<{ ip: string; blockedUntil: number }> {
  const now = Date.now()
  const blocked: Array<{ ip: string; blockedUntil: number }> = []

  for (const [key, record] of requestCounts.entries()) {
    if (record.count >= defaultConfig.maxRequests && now <= record.resetTime) {
      const ip = key.split(':')[0]
      blocked.push({
        ip,
        blockedUntil: record.resetTime
      })
    }
  }

  return blocked
}

/**
 * 의심스러운 IP 목록 조회
 */
export function getSuspiciousIPs(): Array<{ ip: string; requests: number; suspicionLevel: 'LOW' | 'MEDIUM' | 'HIGH' }> {
  const now = Date.now()
  const ipStats = new Map<string, number>()

  // 활성 기록에서 IP별 요청 수 집계
  for (const [key, record] of requestCounts.entries()) {
    if (now <= record.resetTime) {
      const ip = key.split(':')[0]
      ipStats.set(ip, (ipStats.get(ip) || 0) + record.count)
    }
  }

  const suspicious: Array<{ ip: string; requests: number; suspicionLevel: 'LOW' | 'MEDIUM' | 'HIGH' }> = []

  for (const [ip, requests] of ipStats.entries()) {
    let suspicionLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'

    if (requests >= defaultConfig.maxRequests * 0.8) {
      suspicionLevel = 'HIGH'
    } else if (requests >= defaultConfig.maxRequests * 0.5) {
      suspicionLevel = 'MEDIUM'
    } else if (requests >= defaultConfig.maxRequests * 0.3) {
      suspicionLevel = 'LOW'
    } else {
      continue // 의심스럽지 않음
    }

    suspicious.push({ ip, requests, suspicionLevel })
  }

  return suspicious.sort((a, b) => b.requests - a.requests)
}

export default rateLimiter