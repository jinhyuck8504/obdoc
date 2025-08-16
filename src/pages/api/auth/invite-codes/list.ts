/**
 * 가입 코드 목록 조회 API
 * 의사가 자신의 가입 코드 목록을 조회할 수 있습니다.
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { createSecurityLog } from '@/lib/inviteCodeSecurity'
import { securityMiddleware, getClientIP } from '@/lib/middleware/security'
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

// 의사의 병원 코드 확인
const getDoctorHospitalCode = async (userId: string): Promise<{ isValid: boolean; hospitalCode?: string }> => {
  try {
    const { data: doctor, error } = await supabase
      .from('doctors')
      .select('hospital_code')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error || !doctor || !doctor.hospital_code) {
      return { isValid: false }
    }

    return { isValid: true, hospitalCode: doctor.hospital_code }
  } catch (error) {
    return { isValid: false }
  }
}

// 쿼리 파라미터 검증
const validateQueryParams = (query: any): { isValid: boolean; error?: string; params?: any } => {
  const { page = '1', limit = '10', status, sortBy = 'created_at', sortOrder = 'desc' } = query

  // 페이지 번호 검증
  const pageNum = parseInt(page)
  if (isNaN(pageNum) || pageNum < 1 || pageNum > 1000) {
    return { isValid: false, error: 'Invalid page number (1-1000)' }
  }

  // 제한 수 검증
  const limitNum = parseInt(limit)
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return { isValid: false, error: 'Invalid limit (1-100)' }
  }

  // 상태 필터 검증
  if (status && !['active', 'inactive', 'expired'].includes(status)) {
    return { isValid: false, error: 'Invalid status filter' }
  }

  // 정렬 필드 검증
  const allowedSortFields = ['created_at', 'expires_at', 'used_count', 'max_uses', 'description']
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
      status,
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

    const { page, limit, status, sortBy, sortOrder } = validation.params!

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
    if (!tokenData || tokenData.role !== 'doctor') {
      await logAPICall(req, res, 'UNAUTHORIZED', 'Invalid token or not a doctor', Date.now() - startTime)
      return res.status(401).json({
        success: false,
        error: 'Doctor authentication required'
      })
    }

    // 4. 의사의 병원 코드 확인
    const doctorInfo = await getDoctorHospitalCode(tokenData.userId)
    if (!doctorInfo.isValid) {
      await logAPICall(req, res, 'FORBIDDEN', 'Doctor hospital code not found', Date.now() - startTime, tokenData.userId)
      return res.status(403).json({
        success: false,
        error: 'Doctor hospital information required'
      })
    }

    // 5. 쿼리 빌더 생성
    let query = supabase
      .from('invite_codes')
      .select(`
        id,
        code,
        description,
        max_uses,
        used_count,
        is_active,
        created_at,
        expires_at,
        deactivated_at,
        hospitals!inner(hospital_name)
      `)
      .eq('hospital_code', doctorInfo.hospitalCode!)

    // 6. 상태 필터 적용
    if (status === 'active') {
      query = query.eq('is_active', true).gt('expires_at', new Date().toISOString())
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    } else if (status === 'expired') {
      query = query.eq('is_active', true).lt('expires_at', new Date().toISOString())
    }

    // 7. 정렬 및 페이지네이션 적용
    const offset = (page - 1) * limit
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    // 8. 데이터 조회
    const { data: codes, error: codesError, count } = await query

    if (codesError) {
      await logAPICall(req, res, 'DATABASE_ERROR', codesError.message, Date.now() - startTime, tokenData.userId)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch invite codes'
      })
    }

    // 9. 전체 개수 조회 (페이지네이션용)
    let countQuery = supabase
      .from('invite_codes')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_code', doctorInfo.hospitalCode!)

    if (status === 'active') {
      countQuery = countQuery.eq('is_active', true).gt('expires_at', new Date().toISOString())
    } else if (status === 'inactive') {
      countQuery = countQuery.eq('is_active', false)
    } else if (status === 'expired') {
      countQuery = countQuery.eq('is_active', true).lt('expires_at', new Date().toISOString())
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      console.error('Count query error:', countError)
    }

    // 10. 응답 데이터 가공
    const processedCodes = codes?.map(code => ({
      id: code.id,
      code: code.code,
      description: code.description,
      maxUses: code.max_uses,
      usedCount: code.used_count,
      remainingUses: code.max_uses - code.used_count,
      isActive: code.is_active,
      isExpired: new Date(code.expires_at) < new Date(),
      createdAt: code.created_at,
      expiresAt: code.expires_at,
      deactivatedAt: code.deactivated_at,
      hospitalName: code.hospitals?.hospital_name
    })) || []

    // 11. 성공 응답
    await logAPICall(
      req,
      res,
      'SUCCESS',
      `Retrieved ${processedCodes.length} invite codes`,
      Date.now() - startTime,
      tokenData.userId
    )

    res.status(200).json({
      success: true,
      data: {
        codes: processedCodes,
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit),
          hasNext: page * limit < (totalCount || 0),
          hasPrev: page > 1
        },
        filters: {
          status,
          sortBy,
          sortOrder
        }
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
        endpoint: '/api/auth/invite-codes/list',
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