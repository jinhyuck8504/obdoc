import { NextApiRequest, NextApiResponse } from 'next'
import { generateHospitalCodeForDoctor } from '@/lib/hospitalCodeService'
import { createSecurityLog } from '@/lib/inviteCodeSecurity'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

// Rate limiting 저장소
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting (매우 엄격한 제한 - 병원 코드는 한 번만 생성)
const rateLimit = (key: string, limit: number = 1, windowMs: number = 86400000): boolean => { // 24시간에 1개
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

// 의사 등록 중 상태 확인
const verifyDoctorRegistration = async (userId: string): Promise<{ isValid: boolean; hasHospitalCode?: boolean }> => {
  try {
    const { data: doctor, error } = await supabase
      .from('doctors')
      .select('hospital_code')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return { isValid: false }
    }

    // 이미 병원 코드가 있으면 중복 생성 방지
    if (doctor && doctor.hospital_code) {
      return { isValid: false, hasHospitalCode: true }
    }

    return { isValid: true, hasHospitalCode: false }
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

  const { hospitalName, hospitalType, region, address, phoneNumber, registrationNumber, medicalLicenseNumber } = req.body

  if (!hospitalName || typeof hospitalName !== 'string' || hospitalName.length < 2 || hospitalName.length > 100) {
    return { isValid: false, error: 'Valid hospital name is required (2-100 chars)' }
  }

  if (!hospitalType || !['clinic', 'oriental_clinic', 'hospital'].includes(hospitalType)) {
    return { isValid: false, error: 'Valid hospital type is required' }
  }

  if (!region || typeof region !== 'string' || region.length < 2 || region.length > 20) {
    return { isValid: false, error: 'Valid region is required' }
  }

  // 선택적 필드 검증
  if (address && (typeof address !== 'string' || address.length > 200)) {
    return { isValid: false, error: 'Address too long (max 200 chars)' }
  }

  if (phoneNumber && (typeof phoneNumber !== 'string' || !/^[\d-+\s()]+$/.test(phoneNumber))) {
    return { isValid: false, error: 'Invalid phone number format' }
  }

  if (registrationNumber && (typeof registrationNumber !== 'string' || registrationNumber.length > 50)) {
    return { isValid: false, error: 'Registration number too long (max 50 chars)' }
  }

  if (medicalLicenseNumber && (typeof medicalLicenseNumber !== 'string' || medicalLicenseNumber.length > 50)) {
    return { isValid: false, error: 'Medical license number too long (max 50 chars)' }
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
    if (!tokenData || tokenData.role !== 'doctor') {
      await logAPICall(req, res, 'UNAUTHORIZED', 'Invalid token or not a doctor', Date.now() - startTime)
      return res.status(401).json({ 
        success: false, 
        error: 'Doctor authentication required' 
      })
    }

    // 3. 의사 등록 상태 확인
    const registration = await verifyDoctorRegistration(tokenData.userId)
    if (!registration.isValid) {
      const message = registration.hasHospitalCode 
        ? 'Hospital code already exists for this doctor'
        : 'Doctor registration not found or invalid'
      
      await logAPICall(req, res, 'FORBIDDEN', message, Date.now() - startTime, tokenData.userId)
      return res.status(403).json({ 
        success: false, 
        error: registration.hasHospitalCode 
          ? 'You already have a hospital code. Each doctor can only have one hospital code.'
          : 'Doctor registration required before generating hospital code'
      })
    }

    // 4. Rate limiting (사용자별 - 매우 엄격)
    const rateLimitKey = `hospital_code_${tokenData.userId}`
    if (!rateLimit(rateLimitKey, 1, 86400000)) { // 24시간에 1개
      await logAPICall(req, res, 'RATE_LIMITED', 'Hospital code generation limit exceeded', Date.now() - startTime, tokenData.userId)
      return res.status(429).json({ 
        success: false, 
        error: 'Hospital code generation limit exceeded. You can only generate one hospital code per day.' 
      })
    }

    // 5. 병원 코드 생성
    const { hospitalName, hospitalType, region, address, phoneNumber, registrationNumber, medicalLicenseNumber } = req.body
    
    const request = {
      hospitalName,
      hospitalType,
      region,
      address,
      phoneNumber,
      registrationNumber,
      medicalLicenseNumber
    }

    const result = await generateHospitalCodeForDoctor(
      request,
      tokenData.userId,
      clientIP,
      userAgent
    )

    // 6. 응답 준비
    if (result.success && result.hospitalCode && result.hospitalData) {
      await logAPICall(
        req, 
        res, 
        'SUCCESS', 
        `Hospital code generated: ${result.hospitalCode}`,
        Date.now() - startTime,
        tokenData.userId
      )

      res.status(201).json({
        success: true,
        hospitalCode: result.hospitalCode,
        hospitalData: {
          hospitalCode: result.hospitalData.hospitalCode,
          hospitalName: result.hospitalData.hospitalName,
          hospitalType: result.hospitalData.hospitalType,
          region: result.hospitalData.region,
          address: result.hospitalData.address,
          isActive: result.hospitalData.isActive,
          createdAt: result.hospitalData.createdAt
        }
      })
    } else {
      await logAPICall(
        req, 
        res, 
        'FAILED', 
        result.error || 'Hospital code generation failed',
        Date.now() - startTime,
        tokenData.userId
      )

      res.status(400).json({
        success: false,
        error: result.error || 'Failed to generate hospital code'
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
        endpoint: '/api/auth/hospital-codes/generate',
        method: req.method,
        status,
        message,
        duration,
        body_size: JSON.stringify(req.body).length,
        hospital_name: req.body?.hospitalName,
        hospital_type: req.body?.hospitalType,
        region: req.body?.region
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