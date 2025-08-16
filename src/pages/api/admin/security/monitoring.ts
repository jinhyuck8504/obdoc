/**
 * 보안 모니터링 대시보드 API
 * 실시간 보안 상태와 통계를 제공합니다.
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { createSecurityLog } from '@/lib/inviteCodeSecurity'
import { getClientIP } from '@/lib/middleware/security'
import { getRateLimitStats, getBlockedIPs, getSuspiciousIPs } from '@/lib/middleware/rateLimiter'
import jwt from 'jsonwebtoken'

// JWT 토큰 검증
const verifyToken = (token: string): { userId: string; role: string } | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return { userId: decoded.sub, role: decoded.role }
  } catch (error) {
    return null
  }
}

// 관리자 권한 확인
const verifyAdminPermission = async (userId: string): Promise<boolean> => {
  try {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    return !error && !!admin
  } catch (error) {
    return false
  }
}

// 실시간 보안 통계 수집
const collectSecurityStats = async (): Promise<any> => {
  try {
    const now = new Date()
    const last1Hour = new Date(now.getTime() - 60 * 60 * 1000)
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 최근 보안 이벤트 통계
    const { data: recentEvents } = await supabase
      .from('audit_logs')
      .select('event_type, success, timestamp, ip_address')
      .gte('timestamp', last24Hours.toISOString())
      .order('timestamp', { ascending: false })

    // 실패한 로그인 시도
    const failedLogins = recentEvents?.filter(event => 
      event.event_type === 'login_attempt' && !event.success
    ).length || 0

    // 의심스러운 활동
    const suspiciousActivities = recentEvents?.filter(event => 
      event.event_type === 'suspicious_activity'
    ).length || 0

    // Rate limit 위반
    const rateLimitViolations = recentEvents?.filter(event => 
      event.event_type === 'rate_limit_violation'
    ).length || 0

    // 고유 IP 주소 수
    const uniqueIPs = new Set(recentEvents?.map(event => event.ip_address)).size

    // 보안 알림 통계
    const { data: alerts } = await supabase
      .from('security_alerts')
      .select('severity, resolved, created_at, type')
      .gte('created_at', last7Days.toISOString())

    const alertStats = {
      total: alerts?.length || 0,
      unresolved: alerts?.filter(alert => !alert.resolved).length || 0,
      critical: alerts?.filter(alert => alert.severity === 'critical' && !alert.resolved).length || 0,
      high: alerts?.filter(alert => alert.severity === 'high' && !alert.resolved).length || 0,
      medium: alerts?.filter(alert => alert.severity === 'medium' && !alert.resolved).length || 0,
      low: alerts?.filter(alert => alert.severity === 'low' && !alert.resolved).length || 0
    }

    // 알림 유형별 통계
    const alertsByType = alerts?.reduce((acc: any, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1
      return acc
    }, {}) || {}

    // 시간대별 이벤트 분포 (최근 24시간)
    const hourlyEvents = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
      const hourStart = new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours())
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)
      
      const eventsInHour = recentEvents?.filter(event => {
        const eventTime = new Date(event.timestamp)
        return eventTime >= hourStart && eventTime < hourEnd
      }).length || 0

      return {
        hour: hourStart.getHours(),
        events: eventsInHour,
        timestamp: hourStart.toISOString()
      }
    }).reverse()

    // Rate Limiter 통계
    const rateLimitStats = getRateLimitStats()

    return {
      events: {
        last24Hours: recentEvents?.length || 0,
        failedLogins,
        suspiciousActivities,
        rateLimitViolations,
        uniqueIPs
      },
      alerts: alertStats,
      alertsByType,
      hourlyDistribution: hourlyEvents,
      rateLimiting: {
        ...rateLimitStats,
        blockedIPs: getBlockedIPs(),
        suspiciousIPs: getSuspiciousIPs()
      }
    }
  } catch (error) {
    console.error('Failed to collect security stats:', error)
    return {
      error: 'Failed to collect security statistics'
    }
  }
}

// 위험 점수 계산
const calculateRiskScore = (stats: any): { score: number; level: string; factors: string[] } => {
  let score = 0
  const factors: string[] = []

  // 실패한 로그인 시도
  if (stats.events?.failedLogins > 10) {
    score += 30
    factors.push(`${stats.events.failedLogins} failed login attempts`)
  } else if (stats.events?.failedLogins > 5) {
    score += 15
    factors.push(`${stats.events.failedLogins} failed login attempts`)
  }

  // 의심스러운 활동
  if (stats.events?.suspiciousActivities > 5) {
    score += 25
    factors.push(`${stats.events.suspiciousActivities} suspicious activities`)
  } else if (stats.events?.suspiciousActivities > 0) {
    score += 10
    factors.push(`${stats.events.suspiciousActivities} suspicious activities`)
  }

  // Rate limit 위반
  if (stats.events?.rateLimitViolations > 20) {
    score += 20
    factors.push(`${stats.events.rateLimitViolations} rate limit violations`)
  } else if (stats.events?.rateLimitViolations > 10) {
    score += 10
    factors.push(`${stats.events.rateLimitViolations} rate limit violations`)
  }

  // 미해결 중요 알림
  if (stats.alerts?.critical > 0) {
    score += 40
    factors.push(`${stats.alerts.critical} critical alerts`)
  }

  if (stats.alerts?.high > 3) {
    score += 20
    factors.push(`${stats.alerts.high} high priority alerts`)
  } else if (stats.alerts?.high > 0) {
    score += 10
    factors.push(`${stats.alerts.high} high priority alerts`)
  }

  // 차단된 IP 수
  if (stats.rateLimiting?.blockedIPs?.length > 10) {
    score += 15
    factors.push(`${stats.rateLimiting.blockedIPs.length} blocked IPs`)
  } else if (stats.rateLimiting?.blockedIPs?.length > 5) {
    score += 8
    factors.push(`${stats.rateLimiting.blockedIPs.length} blocked IPs`)
  }

  // 위험 수준 결정
  let level = 'low'
  if (score >= 70) {
    level = 'critical'
  } else if (score >= 50) {
    level = 'high'
  } else if (score >= 30) {
    level = 'medium'
  }

  return { score: Math.min(100, score), level, factors }
}

// 최근 보안 이벤트 조회
const getRecentSecurityEvents = async (limit: number = 20): Promise<any[]> => {
  try {
    const { data: events } = await supabase
      .from('audit_logs')
      .select('event_type, user_id, ip_address, details, success, timestamp')
      .in('event_type', ['suspicious_activity', 'rate_limit_violation', 'login_attempt'])
      .eq('success', false)
      .order('timestamp', { ascending: false })
      .limit(limit)

    return events?.map(event => ({
      type: event.event_type,
      userId: event.user_id,
      ipAddress: event.ip_address,
      details: event.details,
      timestamp: event.timestamp,
      severity: event.event_type === 'suspicious_activity' ? 'high' : 'medium'
    })) || []
  } catch (error) {
    console.error('Failed to get recent security events:', error)
    return []
  }
}

// 보안 권장사항 생성
const generateSecurityRecommendations = (stats: any, riskScore: any): string[] => {
  const recommendations: string[] = []

  if (stats.events?.failedLogins > 10) {
    recommendations.push('Consider implementing account lockout policies')
    recommendations.push('Review and strengthen password requirements')
  }

  if (stats.events?.suspiciousActivities > 5) {
    recommendations.push('Investigate suspicious IP addresses')
    recommendations.push('Consider implementing additional authentication factors')
  }

  if (stats.alerts?.unresolved > 10) {
    recommendations.push('Review and resolve pending security alerts')
    recommendations.push('Establish alert response procedures')
  }

  if (stats.rateLimiting?.blockedIPs?.length > 10) {
    recommendations.push('Review blocked IP addresses for false positives')
    recommendations.push('Consider implementing IP whitelisting for trusted sources')
  }

  if (riskScore.score > 50) {
    recommendations.push('Conduct immediate security review')
    recommendations.push('Consider enabling additional monitoring')
  }

  if (recommendations.length === 0) {
    recommendations.push('Security posture appears healthy')
    recommendations.push('Continue regular monitoring and maintenance')
  }

  return recommendations
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)

  try {
    // 1. HTTP 메서드 확인
    if (req.method !== 'GET') {
      await logAPICall(req, res, 'METHOD_NOT_ALLOWED', 'Invalid HTTP method', Date.now() - startTime)
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      })
    }

    // 2. 인증 토큰 확인
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await logAPICall(req, res, 'UNAUTHORIZED', 'Missing or invalid token', Date.now() - startTime)
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    const token = authHeader.substring(7)
    const tokenData = verifyToken(token)
    if (!tokenData) {
      await logAPICall(req, res, 'UNAUTHORIZED', 'Invalid token', Date.now() - startTime)
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      })
    }

    // 3. 관리자 권한 확인
    const isAdmin = await verifyAdminPermission(tokenData.userId)
    if (!isAdmin) {
      await logAPICall(req, res, 'FORBIDDEN', 'Not an admin', Date.now() - startTime, tokenData.userId)
      return res.status(403).json({
        success: false,
        error: 'Administrator permission required'
      })
    }

    // 4. 보안 통계 수집
    const [stats, recentEvents] = await Promise.all([
      collectSecurityStats(),
      getRecentSecurityEvents(20)
    ])

    // 5. 위험 점수 계산
    const riskScore = calculateRiskScore(stats)

    // 6. 보안 권장사항 생성
    const recommendations = generateSecurityRecommendations(stats, riskScore)

    // 7. 응답 데이터 구성
    const monitoringData = {
      timestamp: new Date().toISOString(),
      riskScore,
      statistics: stats,
      recentEvents,
      recommendations,
      systemStatus: {
        rateLimiterActive: true,
        auditLoggingActive: true,
        alertSystemActive: true,
        monitoringActive: true
      }
    }

    // 8. 성공 응답
    await logAPICall(
      req,
      res,
      'SUCCESS',
      `Security monitoring data retrieved - Risk Level: ${riskScore.level}`,
      Date.now() - startTime,
      tokenData.userId
    )

    res.status(200).json({
      success: true,
      data: monitoringData
    })

  } catch (error) {
    console.error('API Error:', error)
    
    await logAPICall(
      req,
      res,
      'ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      Date.now() - startTime
    )

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

// API 호출 로그 기록
async function logAPICall(
  req: NextApiRequest,
  res: NextApiResponse,
  status: string,
  message: string,
  duration: number,
  userId?: string
) {
  try {
    const log = createSecurityLog(
      'api_call',
      userId || 'anonymous',
      getClientIP(req),
      req.headers['user-agent'] || '',
      {
        endpoint: '/api/admin/security/monitoring',
        method: req.method,
        status,
        message,
        duration
      },
      status === 'SUCCESS'
    )

    await supabase
      .from('audit_logs')
      .insert(log)
  } catch (error) {
    console.error('Failed to log API call:', error)
  }
}