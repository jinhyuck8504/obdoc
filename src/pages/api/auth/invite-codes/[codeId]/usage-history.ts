import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { createSecurityLog } from '@/lib/inviteCodeSecurity'
import jwt from 'jsonwebtoken'

// Rate limiting 저장소
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

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

const verifyCodeOwnership = async (codeId: string, userId: string): Promise<boolean> => {
  try {
    const { data: code, error } = await supabase
      .from('hospital_signup_codes')
      .select('created_by')
      .eq('id', codeId)
      .single()

    return !error && code?.created_by === userId
  } catch (error) {
    return false
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)
  const { codeId } = req.query

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method not allowed' })
    }

    // 인증 확인
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }

    const token = authHeader.substring(7)
    const tokenData = verifyToken(token)
    if (!tokenData) {
      return res.status(401).json({ success: false, error: 'Invalid token' })
    }

    // Rate limiting
    const rateLimitKey = `usage_history_${tokenData.userId}`
    if (!rateLimit(rateLimitKey, 10, 60000)) {
      return res.status(429).json({ success: false, error: 'Too many requests' })
    }

    // 코드 소유권 확인
    const isOwner = await verifyCodeOwnership(codeId as string, tokenData.userId)
    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    // 사용 내역 조회
    const { data: usageHistory, error } = await supabase
      .from('code_usage_history')
      .select(`
        id,
        used_at,
        ip_address,
        user_agent,
        success,
        customer_id,
        customers:customer_id(name, email)
      `)
      .eq('code_id', codeId)
      .order('used_at', { ascending: false })
      .limit(100)

    if (error) {
      throw new Error(`Failed to fetch usage history: ${error.message}`)
    }

    // 개인정보 마스킹
    const maskedHistory = usageHistory?.map(usage => ({
      id: usage.id,
      usedAt: usage.used_at,
      ipAddress: usage.ip_address?.replace(/\.\d+$/, '.***'), // IP 마지막 옥텟 마스킹
      userAgent: usage.user_agent?.split(' ')[0] || 'Unknown', // 브라우저만 표시
      success: usage.success,
      customerName: usage.customers?.name || 'Anonymous',
      customerEmail: usage.customers?.email ? 
        usage.customers.email.replace(/(.{2}).*(@.*)/, '$1***$2') : // 이메일 마스킹
        'Not provided'
    }))

    await logAPICall(req, res, 'SUCCESS', `Usage history retrieved for code ${codeId}`, Date.now() - startTime, tokenData.userId)

    res.status(200).json({
      success: true,
      usageHistory: maskedHistory || []
    })

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
        endpoint: `/api/auth/invite-codes/${req.query.codeId}/usage-history`,
        method: req.method,
        status,
        message,
        duration,
        code_id: req.query.codeId
      },
      status === 'SUCCESS'
    )

    await supabase.from('audit_logs').insert(log)
  } catch (error) {
    console.error('Failed to log API call:', error)
  }
}