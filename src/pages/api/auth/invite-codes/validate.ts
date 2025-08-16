import { NextApiRequest, NextApiResponse } from 'next'
import { validateInviteCodeClient } from '@/lib/inviteCodeService'
import { createSecurityLog } from '@/lib/inviteCodeSecurity'
import { supabase } from '@/lib/supabase'

// Rate limiting 저장소 (실제로는 Redis 사용 권장)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting 미들웨어
const rateLimit = (ip: string, limit: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now()
  const key = `validate_${ip}`
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

  const { code } = req.body
  if (!code || typeof code !== 'string') {
    return { isValid: false, error: 'Invalid request body' }
  }

  if (code.length > 100) {
    return { isValid: false, error: 'Code too long' }
  }

  return { isValid: true }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)
  const userAgent = req.headers['user-agent'] || ''

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

    // 2. Rate limiting
    if (!rateLimit(clientIP, 5, 60000)) {
      await logAPICall(req, res, 'RATE_LIMITED', 'Too many requests', Date.now() - startTime)
      return res.status(429).json({ 
        success: false, 
        error: 'Too many requests. Please try again later.' 
      })
    }

    // 3. 가입 코드 검증
    const { code } = req.body
    const result = await validateInviteCodeClient(code, clientIP, userAgent)

    // 4. 응답 준비
    const responseData = {
      success: result.isValid,
      ...(result.isValid ? {
        hospitalInfo: result.hospitalInfo,
        codeInfo: {
          expiresAt: result.codeInfo?.expiresAt,
          remainingUses: result.codeInfo?.remainingUses
        }
      } : {
        error: result.error,
        errorCode: result.errorCode
      })
    }

    // 5. 감사 로그 기록
    await logAPICall(
      req, 
      res, 
      result.isValid ? 'SUCCESS' : 'FAILED', 
      result.isValid ? 'Code validation successful' : result.error,
      Date.now() - startTime
    )

    // 6. 응답 반환
    const statusCode = result.isValid ? 200 : 400
    res.status(statusCode).json(responseData)

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
  duration: number
) {
  try {
    const log = createSecurityLog(
      'api_call',
      'anonymous',
      getClientIP(req),
      req.headers['user-agent'] || '',
      {
        endpoint: '/api/auth/invite-codes/validate',
        method: req.method,
        status,
        message,
        duration,
        body_size: JSON.stringify(req.body).length
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