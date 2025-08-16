/**
 * 가입 코드 비활성화 API
 * 의사가 자신의 가입 코드를 비활성화할 수 있습니다.
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

// 코드 소유권 확인
const verifyCodeOwnership = async (codeId: string, userId: string): Promise<{ isValid: boolean; hospitalCode?: string }> => {
  try {
    const { data: code, error } = await supabase
      .from('invite_codes')
      .select(`
        id,
        hospital_code,
        hospitals!inner(doctor_id)
      `)
      .eq('id', codeId)
      .eq('hospitals.doctor_id', userId)
      .single()

    if (error || !code) {
      return { isValid: false }
    }

    return { isValid: true, hospitalCode: code.hospital_code }
  } catch (error) {
    return { isValid: false }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)
  const { codeId } = req.query

  try {
    // 1. HTTP 메서드 확인
    if (req.method !== 'PUT') {
      await logAPICall(req, res, 'METHOD_NOT_ALLOWED', 'Invalid HTTP method', Date.now() - startTime)
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      })
    }

    // 2. 코드 ID 검증
    if (!codeId || typeof codeId !== 'string') {
      await logAPICall(req, res, 'VALIDATION_FAILED', 'Invalid code ID', Date.now() - startTime)
      return res.status(400).json({
        success: false,
        error: 'Valid code ID is required'
      })
    }

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

    // 4. 코드 소유권 확인
    const ownership = await verifyCodeOwnership(codeId, tokenData.userId)
    if (!ownership.isValid) {
      await logAPICall(req, res, 'FORBIDDEN', 'Code ownership verification failed', Date.now() - startTime, tokenData.userId)
      return res.status(403).json({
        success: false,
        error: 'You can only deactivate your own invite codes'
      })
    }

    // 5. 코드 비활성화
    const { data: updatedCode, error: updateError } = await supabase
      .from('invite_codes')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by: tokenData.userId
      })
      .eq('id', codeId)
      .select()
      .single()

    if (updateError) {
      await logAPICall(req, res, 'DATABASE_ERROR', updateError.message, Date.now() - startTime, tokenData.userId)
      return res.status(500).json({
        success: false,
        error: 'Failed to deactivate invite code'
      })
    }

    // 6. 성공 응답
    await logAPICall(
      req,
      res,
      'SUCCESS',
      `Invite code deactivated: ${codeId}`,
      Date.now() - startTime,
      tokenData.userId
    )

    res.status(200).json({
      success: true,
      message: 'Invite code deactivated successfully',
      code: {
        id: updatedCode.id,
        code: updatedCode.code,
        isActive: updatedCode.is_active,
        deactivatedAt: updatedCode.deactivated_at
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
        endpoint: `/api/auth/invite-codes/${req.query.codeId}/deactivate`,
        method: req.method,
        status,
        message,
        duration,
        code_id: req.query.codeId
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