import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { createSecurityLog } from '@/lib/inviteCodeSecurity'
import jwt from 'jsonwebtoken'

// Rate limiting 저장소
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting
const rateLimit = (key: string, limit: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

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

    return !error && admin
  } catch (error) {
    return false
  }
}

// IP 주소 추출
const getClientIP = (req: NextApiRequest): string => {
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.socket.remoteAddress
  return ip || 'unknown'
}

// 병원 목록 조회
const getHospitals = async (req: NextApiRequest): Promise<any> => {
  const { search, status, limit = 50, offset = 0 } = req.query

  let query = supabase
    .from('hospitals')
    .select(`
      hospital_code,
      hospital_name,
      hospital_type,
      region,
      address,
      is_active,
      created_at,
      doctors:doctors(count),
      invite_codes:hospital_signup_codes(
        id,
        is_active,
        current_uses,
        max_uses,
        created_at
      )
    `)
    .order('created_at', { ascending: false })

  // 검색 필터
  if (search && typeof search === 'string') {
    query = query.or(`hospital_name.ilike.%${search}%,hospital_code.ilike.%${search}%`)
  }

  // 상태 필터
  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'inactive') {
    query = query.eq('is_active', false)
  }

  // 페이지네이션
  const limitNum = Math.min(parseInt(limit as string) || 50, 100)
  const offsetNum = parseInt(offset as string) || 0
  query = query.range(offsetNum, offsetNum + limitNum - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch hospitals: ${error.message}`)
  }

  // 통계 계산
  const hospitalsWithStats = data?.map(hospital => {
    const activeCodes = hospital.invite_codes?.filter(code => code.is_active).length || 0
    const totalCodes = hospital.invite_codes?.length || 0
    const totalUsages = hospital.invite_codes?.reduce((sum, code) => sum + (code.current_uses || 0), 0) || 0
    const doctorCount = hospital.doctors?.[0]?.count || 0

    return {
      hospitalCode: hospital.hospital_code,
      hospitalName: hospital.hospital_name,
      hospitalType: hospital.hospital_type,
      region: hospital.region,
      address: hospital.address,
      isActive: hospital.is_active,
      createdAt: hospital.created_at,
      stats: {
        doctorCount,
        totalCodes,
        activeCodes,
        totalUsages
      }
    }
  })

  return {
    hospitals: hospitalsWithStats || [],
    pagination: {
      total: count || 0,
      limit: limitNum,
      offset: offsetNum,
      hasMore: (count || 0) > offsetNum + limitNum
    }
  }
}

// 병원 상세 정보 조회
const getHospitalDetails = async (hospitalCode: string): Promise<any> => {
  const { data: hospital, error } = await supabase
    .from('hospitals')
    .select(`
      *,
      doctors:doctors(
        user_id,
        medical_license,
        specialization,
        years_of_experience,
        is_active,
        created_at,
        users:user_id(name, email)
      ),
      invite_codes:hospital_signup_codes(
        id,
        code,
        description,
        max_uses,
        current_uses,
        is_active,
        created_at,
        expires_at,
        last_used_at
      ),
      security_alerts:security_alerts(
        id,
        type,
        severity,
        details,
        timestamp,
        resolved
      )
    `)
    .eq('hospital_code', hospitalCode)
    .single()

  if (error) {
    throw new Error(`Hospital not found: ${error.message}`)
  }

  return hospital
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)
  const userAgent = req.headers['user-agent'] || ''

  try {
    // 1. 인증 토큰 확인
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

    // 2. 관리자 권한 확인
    const isAdmin = await verifyAdminPermission(tokenData.userId)
    if (!isAdmin) {
      await logAPICall(req, res, 'FORBIDDEN', 'Not an admin', Date.now() - startTime, tokenData.userId)
      return res.status(403).json({ 
        success: false, 
        error: 'Admin permission required' 
      })
    }

    // 3. Rate limiting
    const rateLimitKey = `admin_hospitals_${tokenData.userId}`
    if (!rateLimit(rateLimitKey, 20, 60000)) { // 분당 20회
      await logAPICall(req, res, 'RATE_LIMITED', 'Too many requests', Date.now() - startTime, tokenData.userId)
      return res.status(429).json({ 
        success: false, 
        error: 'Too many requests. Please try again later.' 
      })
    }

    // 4. 요청 처리
    if (req.method === 'GET') {
      const { hospitalCode } = req.query

      if (hospitalCode && typeof hospitalCode === 'string') {
        // 특정 병원 상세 정보 조회
        const hospitalDetails = await getHospitalDetails(hospitalCode)
        
        await logAPICall(
          req, 
          res, 
          'SUCCESS', 
          `Hospital details retrieved: ${hospitalCode}`,
          Date.now() - startTime,
          tokenData.userId
        )

        res.status(200).json({
          success: true,
          hospital: hospitalDetails
        })
      } else {
        // 병원 목록 조회
        const result = await getHospitals(req)
        
        await logAPICall(
          req, 
          res, 
          'SUCCESS', 
          `Hospitals list retrieved: ${result.hospitals.length} items`,
          Date.now() - startTime,
          tokenData.userId
        )

        res.status(200).json({
          success: true,
          ...result
        })
      }
    } else {
      await logAPICall(req, res, 'METHOD_NOT_ALLOWED', 'Method not allowed', Date.now() - startTime, tokenData.userId)
      res.status(405).json({ 
        success: false, 
        error: 'Method not allowed' 
      })
    }

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
        endpoint: '/api/admin/hospitals',
        method: req.method,
        status,
        message,
        duration,
        query_params: req.query,
        hospital_code: req.query?.hospitalCode
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