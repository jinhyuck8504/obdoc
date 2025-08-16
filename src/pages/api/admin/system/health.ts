/**
 * 시스템 상태 확인 API
 * 관리자가 시스템의 전반적인 상태를 모니터링할 수 있습니다.
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { createSecurityLog } from '@/lib/inviteCodeSecurity'
import { getClientIP } from '@/lib/middleware/security'
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

// 데이터베이스 연결 상태 확인
const checkDatabaseHealth = async (): Promise<{ status: string; responseTime: number; error?: string }> => {
  const startTime = Date.now()
  
  try {
    const { data, error } = await supabase
      .from('hospitals')
      .select('count')
      .limit(1)

    const responseTime = Date.now() - startTime

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        error: error.message
      }
    }

    return {
      status: responseTime < 1000 ? 'healthy' : 'slow',
      responseTime
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}

// 시스템 통계 수집
const collectSystemStats = async (): Promise<any> => {
  try {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 병원 통계
    const { data: hospitalStats } = await supabase
      .from('hospitals')
      .select('is_active')

    const totalHospitals = hospitalStats?.length || 0
    const activeHospitals = hospitalStats?.filter(h => h.is_active).length || 0

    // 가입 코드 통계
    const { data: codeStats } = await supabase
      .from('invite_codes')
      .select('is_active, created_at, used_count, max_uses')

    const totalCodes = codeStats?.length || 0
    const activeCodes = codeStats?.filter(c => c.is_active).length || 0
    const codesCreatedLast24h = codeStats?.filter(c => 
      new Date(c.created_at) > last24Hours
    ).length || 0

    // 사용량 통계
    const totalUsages = codeStats?.reduce((sum, code) => sum + (code.used_count || 0), 0) || 0
    const totalCapacity = codeStats?.reduce((sum, code) => sum + (code.max_uses || 0), 0) || 0

    // 최근 API 호출 통계
    const { data: apiStats } = await supabase
      .from('audit_logs')
      .select('success, timestamp, event_type')
      .gte('timestamp', last24Hours.toISOString())

    const totalAPICalls = apiStats?.length || 0
    const successfulCalls = apiStats?.filter(log => log.success).length || 0
    const failedCalls = totalAPICalls - successfulCalls

    // 보안 알림 통계
    const { data: securityStats } = await supabase
      .from('security_alerts')
      .select('severity, resolved, created_at')
      .gte('created_at', last7Days.toISOString())

    const totalAlerts = securityStats?.length || 0
    const unresolvedAlerts = securityStats?.filter(alert => !alert.resolved).length || 0
    const criticalAlerts = securityStats?.filter(alert => 
      alert.severity === 'critical' && !alert.resolved
    ).length || 0

    return {
      hospitals: {
        total: totalHospitals,
        active: activeHospitals,
        inactive: totalHospitals - activeHospitals
      },
      inviteCodes: {
        total: totalCodes,
        active: activeCodes,
        inactive: totalCodes - activeCodes,
        createdLast24h: codesCreatedLast24h,
        totalUsages,
        totalCapacity,
        utilizationRate: totalCapacity > 0 ? (totalUsages / totalCapacity * 100).toFixed(2) : 0
      },
      apiCalls: {
        last24h: {
          total: totalAPICalls,
          successful: successfulCalls,
          failed: failedCalls,
          successRate: totalAPICalls > 0 ? (successfulCalls / totalAPICalls * 100).toFixed(2) : 100
        }
      },
      security: {
        totalAlerts,
        unresolvedAlerts,
        criticalAlerts,
        last7Days: totalAlerts
      }
    }
  } catch (error) {
    console.error('Failed to collect system stats:', error)
    return {
      error: 'Failed to collect system statistics'
    }
  }
}

// 시스템 성능 메트릭 수집
const collectPerformanceMetrics = async (): Promise<any> => {
  try {
    const startTime = Date.now()
    
    // 메모리 사용량 (Node.js)
    const memoryUsage = process.memoryUsage()
    
    // 업타임
    const uptime = process.uptime()
    
    // 데이터베이스 응답 시간 테스트
    const dbHealth = await checkDatabaseHealth()
    
    const totalTime = Date.now() - startTime

    return {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      uptime: {
        seconds: Math.round(uptime),
        formatted: formatUptime(uptime)
      },
      database: dbHealth,
      responseTime: totalTime
    }
  } catch (error) {
    return {
      error: 'Failed to collect performance metrics'
    }
  }
}

// 업타임 포맷팅
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  return `${days}d ${hours}h ${minutes}m`
}

// 시스템 상태 평가
const evaluateSystemHealth = (stats: any, performance: any): { status: string; issues: string[] } => {
  const issues: string[] = []
  let status = 'healthy'

  // 데이터베이스 상태 확인
  if (performance.database?.status === 'unhealthy') {
    issues.push('Database connection issues detected')
    status = 'unhealthy'
  } else if (performance.database?.status === 'slow') {
    issues.push('Database response time is slow')
    if (status === 'healthy') status = 'degraded'
  }

  // API 성공률 확인
  const successRate = parseFloat(stats.apiCalls?.last24h?.successRate || '100')
  if (successRate < 95) {
    issues.push(`API success rate is low: ${successRate}%`)
    if (status === 'healthy') status = 'degraded'
  }

  // 보안 알림 확인
  if (stats.security?.criticalAlerts > 0) {
    issues.push(`${stats.security.criticalAlerts} critical security alerts`)
    status = 'unhealthy'
  } else if (stats.security?.unresolvedAlerts > 10) {
    issues.push(`${stats.security.unresolvedAlerts} unresolved security alerts`)
    if (status === 'healthy') status = 'degraded'
  }

  // 메모리 사용량 확인
  if (performance.memory?.heapUsed > 500) { // 500MB 이상
    issues.push('High memory usage detected')
    if (status === 'healthy') status = 'degraded'
  }

  return { status, issues }
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

    // 4. 시스템 상태 정보 수집
    const [stats, performance] = await Promise.all([
      collectSystemStats(),
      collectPerformanceMetrics()
    ])

    // 5. 전체 시스템 상태 평가
    const healthCheck = evaluateSystemHealth(stats, performance)

    // 6. 응답 데이터 구성
    const healthData = {
      timestamp: new Date().toISOString(),
      status: healthCheck.status,
      issues: healthCheck.issues,
      statistics: stats,
      performance,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }

    // 7. 성공 응답
    await logAPICall(
      req,
      res,
      'SUCCESS',
      `System health check completed - Status: ${healthCheck.status}`,
      Date.now() - startTime,
      tokenData.userId
    )

    res.status(200).json({
      success: true,
      data: healthData
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
      error: 'Internal server error',
      status: 'unhealthy'
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
        endpoint: '/api/admin/system/health',
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