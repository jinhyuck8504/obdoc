import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { createSecurityLog } from '@/lib/inviteCodeSecurity'
import jwt from 'jsonwebtoken'

// Rate limiting 저장소
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const rateLimit = (key: string, limit: number = 5, windowMs: number = 300000): boolean => {
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

const verifyToken = (token: string): { userId: string; role: string } | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return { userId: decoded.sub, role: decoded.role }
  } catch (error) {
    return null
  }
}

const getClientIP = (req: NextApiRequest): string => {
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.socket.remoteAddress
  return ip || 'unknown'
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

const verifyCodeOwnership = async (codeId: string, userId: string): Promise<{ isValid: boolean; codeData?: any }> => {
  try {
    const { data: code, error } = await supabase
      .from('hospital_signup_codes')
      .select(`
        id,
        code,
        description,
        created_by,
        is_active,
        expires_at,
        hospitals:hospital_code(hospital_name)
      `)
      .eq('id', codeId)
      .eq('created_by', userId)
      .single()

    if (error || !code) {
      return { isValid: false }
    }

    return { isValid: true, codeData: code }
  } catch (error) {
    return { isValid: false }
  }
}

const sendInviteEmail = async (
  email: string, 
  code: string, 
  hospitalName: string, 
  description: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 실제로는 이메일 서비스 (SendGrid, AWS SES 등) 사용
    // 여기서는 시뮬레이션
    
    const emailContent = {
      to: email,
      subject: `${hospitalName} 가입 초대`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${hospitalName}에서 초대합니다</h2>
          <p>안녕하세요,</p>
          <p>${hospitalName}에서 ObDoc 서비스 가입을 위한 초대 코드를 보내드립니다.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">가입 코드</h3>
            <div style="font-family: monospace; font-size: 18px; font-weight: bold; color: #1f2937; background: white; padding: 10px; border-radius: 4px;">
              ${code}
            </div>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
              ${description}
            </p>
          </div>
          
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/signup?code=${code}&hospital=${encodeURIComponent(hospitalName)}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              지금 가입하기
            </a>
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p>이 이메일은 ${hospitalName}에서 발송되었습니다.</p>
            <p>가입을 원하지 않으시면 이 이메일을 무시하셔도 됩니다.</p>
          </div>
        </div>
      `
    }

    // 실제 이메일 발송 로직 (여기서는 시뮬레이션)
    console.log('Email would be sent:', emailContent)
    
    // 이메일 발송 기록
    await supabase
      .from('email_logs')
      .insert({
        recipient_email: email,
        subject: emailContent.subject,
        template_type: 'invite_code',
        sent_at: new Date().toISOString(),
        status: 'sent',
        code_id: null // codeId는 별도로 설정
      })

    return { success: true }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' })
    }

    // 요청 검증
    const { codeId, email, hospitalName, doctorId } = req.body
    if (!codeId || !email || !hospitalName || !doctorId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' })
    }

    // 인증 확인
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }

    const token = authHeader.substring(7)
    const tokenData = verifyToken(token)
    if (!tokenData || tokenData.userId !== doctorId) {
      return res.status(401).json({ success: false, error: 'Invalid authentication' })
    }

    // Rate limiting
    const rateLimitKey = `email_share_${tokenData.userId}`
    if (!rateLimit(rateLimitKey, 5, 300000)) { // 5분에 5개
      return res.status(429).json({ success: false, error: 'Too many email requests' })
    }

    // 코드 소유권 확인
    const ownership = await verifyCodeOwnership(codeId, tokenData.userId)
    if (!ownership.isValid || !ownership.codeData) {
      return res.status(403).json({ success: false, error: 'Code not found or access denied' })
    }

    // 코드 활성 상태 확인
    if (!ownership.codeData.is_active) {
      return res.status(400).json({ success: false, error: 'Code is not active' })
    }

    // 만료 확인
    if (ownership.codeData.expires_at && new Date(ownership.codeData.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'Code has expired' })
    }

    // 이메일 발송
    const emailResult = await sendInviteEmail(
      email,
      ownership.codeData.code,
      hospitalName,
      ownership.codeData.description
    )

    if (emailResult.success) {
      await logAPICall(req, res, 'SUCCESS', `Email sent to ${email}`, Date.now() - startTime, tokenData.userId)
      res.status(200).json({ success: true, message: 'Email sent successfully' })
    } else {
      await logAPICall(req, res, 'FAILED', emailResult.error || 'Email sending failed', Date.now() - startTime, tokenData.userId)
      res.status(500).json({ success: false, error: emailResult.error })
    }

  } catch (error) {
    console.error('API Error:', error)
    await logAPICall(req, res, 'ERROR', error instanceof Error ? error.message : 'Unknown error', Date.now() - startTime)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

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
        endpoint: '/api/auth/invite-codes/share-email',
        method: req.method,
        status,
        message,
        duration,
        recipient_email: req.body?.email?.replace(/(.{2}).*(@.*)/, '$1***$2'), // 이메일 마스킹
        code_id: req.body?.codeId
      },
      status === 'SUCCESS'
    )

    await supabase.from('audit_logs').insert(log)
  } catch (error) {
    console.error('Failed to log API call:', error)
  }
}