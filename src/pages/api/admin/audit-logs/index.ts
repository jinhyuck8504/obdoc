/**
 * 감사 로그 조회 API
 * 관리자가 시스템 감사 로그를 조회할 수 있습니다.
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

// 쿼리 파라미터 검증
const validateQueryParams = (query: any): { isValid: boolean; error?: string; params?: any } => {
  const {
    page = '1',
    limit = '50',
    startDate,
    endDate,
    eventType,
    userId,
    ipAddress,
    success,
    sortBy = 'timestamp',
    sortOrder = 'desc'
  } = query

  // 페이지 번호 검증
  const pageNum = parseInt(page)
  if (isNaN(pageNum) || pageNum < 1 || pageNum > 10000) {
    return { isValid: false, error: 'Invalid page number (1-10000)' }
  }

  // 제한 수 검증
  const limitNum = parseInt(limit)
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
    return { isValid: false, error: 'Invalid limit (1-1000)' }
  }

  // 날짜 범위 검증
  let startDateTime, endDateTime
  if (startDate) {
    startDateTime = new Date(startDate)
    if (isNaN(startDateTime.getTime())) {
      return { isValid: false, error: 'Invalid start date format' }
    }
  }

  if (endDate) {
    endDateTime = new Date(endDate)
    if (isNaN(endDateTime.getTime())) {
      return { isValid: false, error: 'Invalid end date format' }
    }
  }

  if (startDateTime && endDateTime && startDateTime > endDateTime) {
    return { isValid: false, error: 'Start date must be before end date' }
  }

  // 날짜 범위 제한 (최대 90일)
  if (startDateTime && endDateTime) {
    const daysDiff = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > 90) {
      return { isValid: false, error: 'Date range cannot exceed 90 days' }
    }
  }

  // 이벤트 타입 검증
  const allowedEventTypes = [
    'api_call',
    'login_attempt',
    'code_generation',
    'code_validation',
    'suspicious_activity',
    'admin_action'
  ]
  if (eventType && !allowedEventTypes.includes(eventType)) {
    return { isValid: false, error: 'Invalid event type' }
  }

  // 성공 여부 검증
  let successFilter
  if (success === 'true') {
    successFilter = true
  } else if (success === 'false') {
    successFilter = false
  }

  // 정렬 필드 검증
  const allowedSortFields = ['timestamp', 'event_type', 'user_id', 'ip_address']
  if (!allowedSortFields.includes(sortBy)) {
    return { isValid: false, error: 'Invalid sort field' }
  }

  // 정렬 순서 검증
  if (!['asc', 'desc'].includes(sortOrder)) {
    return { isValid: false, error: 'Invalid sort order' }
  }

  return {
    isValid: true,
    params: {
      page: pageNum,
      limit: limitNum,
      startDate: startDateTime,
      endDate: endDateTime,
      eventType,
      userId,
      ipAddress,
      success: successFilter,
      sortBy,
      sortOrder
    }
  }
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

    // 2. 쿼리 파라미터 검증
    const validation = validateQueryParams(req.query)
    if (!validation.isValid) {
      await logAPICall(req, res, 'VALIDATION_FAILED', validation.error, Date.now() - startTime)
      return res.status(400).json({
        success: false,
        error: validation.error
      })
    }

    const {
      page,
      limit,
      startDate,
      endDate,
      eventType,
      userId,
      ipAddress,
      success,
      sortBy,
      sortOrder
    } = validation.params!

    // 3. 인증 토큰 확인
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

    // 4. 관리자 권한 확인
    const isAdmin = await verifyAdminPermission(tokenData.userId)
    if (!isAdmin) {
      await logAPICall(req, res, 'FORBIDDEN', 'Not an admin', Date.now() - startTime, tokenData.userId)
      return res.status(403).json({
        success: false,
        error: 'Administrator permission required'
      })
    }

    // 5. 쿼리 빌더 생성
    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        event_type,
        user_id,
        ip_address,
        user_agent,
        details,
        success,
        timestamp
      `)

    // 6. 필터 적용
    if (startDate) {
      query = query.gte('timestamp', startDate.toISOString())
    }

    if (endDate) {
      query = query.lte('timestamp', endDate.toISOString())
    }

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (ipAddress) {
      query = query.eq('ip_address', ipAddress)
    }

    if (success !== undefined) {
      query = query.eq('success', success)
    }

    // 7. 정렬 및 페이지네이션 적용
    const offset = (page - 1) * limit
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    // 8. 데이터 조회
    const { data: logs, error: logsError } = await query

    if (logsError) {
      await logAPICall(req, res, 'DATABASE_ERROR', logsError.message, Date.now() - startTime, tokenData.userId)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch audit logs'
      })
    }

    // 9. 전체 개수 조회 (페이지네이션용)
    let countQuery = supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })

    if (startDate) {
      countQuery = countQuery.gte('timestamp', startDate.toISOString())
    }

    if (endDate) {
      countQuery = countQuery.lte('timestamp', endDate.toISOString())
    }

    if (eventType) {
      countQuery = countQuery.eq('event_type', eventType)
    }

    if (userId) {
      countQuery = countQuery.eq('user_id', userId)
    }

    if (ipAddress) {
      countQuery = countQuery.eq('ip_address', ipAddress)
    }

    if (success !== undefined) {
      countQuery = countQuery.eq('success', success)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      console.error('Count query error:', countError)
    }

    // 10. 응답 데이터 가공 (민감한 정보 제거)
    const processedLogs = logs?.map(log => ({
      id: log.id,
      eventType: log.event_type,
      userId: log.user_id,
      ipAddress: log.ip_address,
      userAgent: log.user_agent ? log.user_agent.substring(0, 100) : null, // 길이 제한
      details: {
        endpoint: log.details?.endpoint,
        method: log.details?.method,
        status: log.details?.status,
        duration: log.details?.duration,
        message: log.details?.message
      },
      success: log.success,
      timestamp: log.timestamp
    })) || []

    // 11. 통계 정보 생성
    const stats = {
      totalLogs: totalCount || 0,
      successfulEvents: logs?.filter(log => log.success).length || 0,
      failedEvents: logs?.filter(log => !log.success).length || 0,
      uniqueUsers: new Set(logs?.map(log => log.user_id).filter(Boolean)).size,
      uniqueIPs: new Set(logs?.map(log => log.ip_address).filter(Boolean)).size
    }

    // 12. 성공 응답
    await logAPICall(
      req,
      res,
      'SUCCESS',
      `Retrieved ${processedLogs.length} audit logs`,
      Date.now() - startTime,
      tokenData.userId
    )

    res.status(200).json({
      success: true,
      data: {
        logs: processedLogs,
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit),
          hasNext: page * limit < (totalCount || 0),
          hasPrev: page > 1
        },
        filters: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          eventType,
          userId,
          ipAddress,
          success,
          sortBy,
          sortOrder
        },
        stats
      }
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
        endpoint: '/api/admin/audit-logs',
        method: req.method,
        status,
        message,
        duration,
        query_params: req.query
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