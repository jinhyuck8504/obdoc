/**
 * 보안 알림 관리 API
 * 관리자가 보안 알림을 조회하고 관리할 수 있습니다.
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

// GET: 보안 알림 목록 조회
const handleGetAlerts = async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
  const { page = '1', limit = '20', severity, resolved, type } = req.query

  // 쿼리 파라미터 검증
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)

  if (isNaN(pageNum) || pageNum < 1 || pageNum > 1000) {
    return res.status(400).json({
      success: false,
      error: 'Invalid page number (1-1000)'
    })
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      error: 'Invalid limit (1-100)'
    })
  }

  // 쿼리 빌더 생성
  let query = supabase
    .from('security_alerts')
    .select(`
      id,
      type,
      severity,
      message,
      details,
      hospital_code,
      created_at,
      resolved,
      resolved_at,
      resolved_by,
      hospitals(hospital_name)
    `)

  // 필터 적용
  if (severity && ['low', 'medium', 'high', 'critical'].includes(severity as string)) {
    query = query.eq('severity', severity)
  }

  if (resolved === 'true') {
    query = query.eq('resolved', true)
  } else if (resolved === 'false') {
    query = query.eq('resolved', false)
  }

  if (type && typeof type === 'string') {
    query = query.eq('type', type)
  }

  // 정렬 및 페이지네이션
  const offset = (pageNum - 1) * limitNum
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limitNum - 1)

  const { data: alerts, error: alertsError } = await query

  if (alertsError) {
    throw new Error(`Failed to fetch security alerts: ${alertsError.message}`)
  }

  // 전체 개수 조회
  let countQuery = supabase
    .from('security_alerts')
    .select('*', { count: 'exact', head: true })

  if (severity && ['low', 'medium', 'high', 'critical'].includes(severity as string)) {
    countQuery = countQuery.eq('severity', severity)
  }

  if (resolved === 'true') {
    countQuery = countQuery.eq('resolved', true)
  } else if (resolved === 'false') {
    countQuery = countQuery.eq('resolved', false)
  }

  if (type && typeof type === 'string') {
    countQuery = countQuery.eq('type', type)
  }

  const { count: totalCount } = await countQuery

  // 응답 데이터 가공
  const processedAlerts = alerts?.map(alert => ({
    id: alert.id,
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    details: alert.details,
    hospitalCode: alert.hospital_code,
    hospitalName: alert.hospitals?.hospital_name,
    createdAt: alert.created_at,
    resolved: alert.resolved,
    resolvedAt: alert.resolved_at,
    resolvedBy: alert.resolved_by
  })) || []

  return res.status(200).json({
    success: true,
    data: {
      alerts: processedAlerts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limitNum),
        hasNext: pageNum * limitNum < (totalCount || 0),
        hasPrev: pageNum > 1
      },
      filters: {
        severity,
        resolved,
        type
      }
    }
  })
}

// PUT: 보안 알림 해결 처리
const handleResolveAlert = async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
  const { alertId, resolution } = req.body

  if (!alertId || typeof alertId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Valid alert ID is required'
    })
  }

  if (!resolution || typeof resolution !== 'string' || resolution.length > 500) {
    return res.status(400).json({
      success: false,
      error: 'Valid resolution note is required (max 500 chars)'
    })
  }

  // 알림 해결 처리
  const { data: updatedAlert, error: updateError } = await supabase
    .from('security_alerts')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
      resolution_notes: resolution
    })
    .eq('id', alertId)
    .eq('resolved', false) // 이미 해결된 알림은 수정 불가
    .select()
    .single()

  if (updateError) {
    if (updateError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'Alert not found or already resolved'
      })
    }
    throw new Error(`Failed to resolve alert: ${updateError.message}`)
  }

  return res.status(200).json({
    success: true,
    message: 'Security alert resolved successfully',
    alert: {
      id: updatedAlert.id,
      resolved: updatedAlert.resolved,
      resolvedAt: updatedAlert.resolved_at,
      resolvedBy: updatedAlert.resolved_by
    }
  })
}

// POST: 새 보안 알림 생성 (시스템 내부용)
const handleCreateAlert = async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
  const { type, severity, message, details, hospitalCode } = req.body

  // 입력 검증
  if (!type || typeof type !== 'string' || type.length > 50) {
    return res.status(400).json({
      success: false,
      error: 'Valid alert type is required (max 50 chars)'
    })
  }

  if (!severity || !['low', 'medium', 'high', 'critical'].includes(severity)) {
    return res.status(400).json({
      success: false,
      error: 'Valid severity level is required (low, medium, high, critical)'
    })
  }

  if (!message || typeof message !== 'string' || message.length > 200) {
    return res.status(400).json({
      success: false,
      error: 'Valid message is required (max 200 chars)'
    })
  }

  if (hospitalCode && typeof hospitalCode !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Hospital code must be a string'
    })
  }

  // 알림 생성
  const { data: newAlert, error: createError } = await supabase
    .from('security_alerts')
    .insert({
      type,
      severity,
      message,
      details: details || {},
      hospital_code: hospitalCode,
      created_by: userId,
      resolved: false
    })
    .select()
    .single()

  if (createError) {
    throw new Error(`Failed to create security alert: ${createError.message}`)
  }

  return res.status(201).json({
    success: true,
    message: 'Security alert created successfully',
    alert: {
      id: newAlert.id,
      type: newAlert.type,
      severity: newAlert.severity,
      message: newAlert.message,
      createdAt: newAlert.created_at
    }
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)

  try {
    // 1. HTTP 메서드 확인
    if (!['GET', 'PUT', 'POST'].includes(req.method!)) {
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

    // 4. 메서드별 처리
    let result
    switch (req.method) {
      case 'GET':
        result = await handleGetAlerts(req, res, tokenData.userId)
        break
      case 'PUT':
        result = await handleResolveAlert(req, res, tokenData.userId)
        break
      case 'POST':
        result = await handleCreateAlert(req, res, tokenData.userId)
        break
    }

    // 5. 성공 로그
    await logAPICall(
      req,
      res,
      'SUCCESS',
      `Security alerts ${req.method} operation completed`,
      Date.now() - startTime,
      tokenData.userId
    )

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
        endpoint: '/api/admin/security/alerts',
        method: req.method,
        status,
        message,
        duration,
        query_params: req.query,
        body_size: req.body ? JSON.stringify(req.body).length : 0
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