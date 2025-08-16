import { NextApiRequest, NextApiResponse } from 'next'
import { generateInviteCodeForDoctor } from '@/lib/inviteCodeService'
import { createSecurityLog } from '@/lib/inviteCodeSecurity'
import { supabase } from '@/lib/supabase'
import { strictRateLimiter, userKeyGenerator } from '@/lib/middleware/rateLimiter'
import { securityHeadersMiddleware, inputValidationMiddleware } from '@/lib/middleware/security'
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

// 의사 권한 확인
const verifyDoctorPermission = async (userId: string): Promise<{ isValid: boolean; hospitalCode?: string }> => {
  try {
    const { data: doctor, error } = await supabase
      .from('doctors')
      .select('hospital_code, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error || !doctor) {
      return { isValid: false }
    }

    return { isValid: true, hospitalCode: doctor.hospital_code }
  } catch (error) {
    return { isValid: false }
  }
}

// IP 주소 추출
const getClientIP = (req: NextApiRequest): string => {
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.socket.remoteAddress
  return ip || 'unknown'
}

// 요청 검증
const validateRequest = (req: NextApiRequest): { isValid: boolean; error?: string } => {
  if (req.method !== 'POST') {
    return { isValid: false, error: 'Method not allowed' }
  }

  const { hospitalCode, description, maxUses, expiresAt } = req.body

  if (!hospitalCode || typeof hospitalCode !== 'string') {
    return { isValid: false, error: 'Hospital code is required' }
  }

  if (!description || typeof description !== 'string' || description.length > 200) {
    return { isValid: false, error: 'Valid description is required (max 200 chars)' }
  }

  if (maxUses && (typeof maxUses !== 'number' || maxUses < 1 || maxUses > 1000)) {
    return { isValid: false, error: 'Max uses must be between 1 and 1000' }
  }

  if (expiresAt && isNaN(new Date(expiresAt).getTime())) {
    return { isValid: false, error: 'Invalid expiration date' }
  }

  return { isValid: true }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)
  const userAgent = req.headers['user-agent'] || ''

  // 보안 미들웨어 적용
  securityHeadersMiddleware(req, res, () => {})
  inputValidationMiddleware(req, res, () => {})

  try {
    // 1. 요청 검증
    const validation = validateRequest(req)
    if (!validation.isValid) {
      await logAPICall(req, res, 'VALIDATION_FAILED', validation.error, Date.now() - startTime)
      return res.status(400).json({ 
        success: false, 
        error: validation.error 
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

    // 3. 의사 권한 확인
    const permission = await verifyDoctorPermission(tokenData.userId)
    if (!permission.isValid) {
      await logAPICall(req, res, 'FORBIDDEN', 'Not a valid doctor', Date.now() - startTime)
      return res.status(403).json({ 
        success: false, 
        error: 'Doctor permission required' 
      })
    }

    // 4. 병원 코드 일치 확인
    const { hospitalCode } = req.body
    if (permission.hospitalCode !== hospitalCode) {
      await logAPICall(req, res, 'FORBIDDEN', 'Hospital code mismatch', Date.now() - startTime)
      return res.status(403).json({ 
        success: false, 
        error: 'Hospital code does not match your credentials' 
      })
    }

    // 5. Rate limiting (사용자별 - 더 엄격한 제한)
    const rateLimitAllowed = await strictRateLimiter.checkLimit(req, res)
    if (!rateLimitAllowed) {
      await logAPICall(req, res, 'RATE_LIMITED', 'Too many code generation requests', Date.now() - startTime, tokenData.userId)
      return // 응답은 rateLimiter에서 처리됨
    }

    // 6. 가입 코드 생성
    const { description, maxUses = 10, expiresAt, isActive = true } = req.body
    
    const request = {
      hospitalCode,
      description,
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive
    }

    const result = await generateInviteCodeForDoctor(request, tokenData.userId)

    // 7. 응답 준비
    if (result.success && result.inviteCode) {
      await logAPICall(
        req, 
        res, 
        'SUCCESS', 
        `Invite code generated: ${result.inviteCode.id}`,
        Date.now() - startTime,
        tokenData.userId
      )

      res.status(201).json({
        success: true,
        inviteCode: {
          id: result.inviteCode.id,
          code: result.inviteCode.code,
          description: result.inviteCode.description,
          maxUses: result.inviteCode.maxUses,
          usedCount: result.inviteCode.usedCount,
          isActive: result.inviteCode.isActive,
          createdAt: result.inviteCode.createdAt,
          expiresAt: result.inviteCode.expiresAt
        }
      })
    } else {
      await logAPICall(
        req, 
        res, 
        'FAILED', 
        result.error || 'Code generation failed',
        Date.now() - startTime,
        tokenData.userId
      )

      res.status(400).json({
        success: false,
        error: result.error || 'Failed to generate invite code'
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
        endpoint: '/api/auth/invite-codes/generate',
        method: req.method,
        status,
        message,
        duration,
        body_size: JSON.stringify(req.body).length,
        hospital_code: req.body?.hospitalCode
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