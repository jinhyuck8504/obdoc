/**
 * 가입 코드 검증 및 관리 서비스
 */

import { supabase } from './supabase'
import { 
  InviteCode, 
  InviteCodeValidationResult, 
  InviteCodeError, 
  InviteCodeGenerationRequest,
  HospitalData,
  AuditLog
} from '@/types/hospital'
import { 
  validateInviteCodeFormat, 
  extractHospitalCodeFromInvite,
  generateInviteCode,
  hashInviteCode,
  validateInviteCode,
  canUseInviteCode,
  checkRateLimit,
  createSecurityLog,
  detectSuspiciousActivity
} from './inviteCodeSecurity'

/**
 * 가입 코드 검증 (클라이언트용) - 보안 강화 버전
 */
export const validateInviteCodeClient = async (
  code: string,
  ipAddress: string = '',
  userAgent: string = ''
): Promise<InviteCodeValidationResult> => {
  try {
    // 1. Rate limiting 체크 (더 엄격한 제한)
    const rateLimitResult = await checkRateLimit('invite_code_validation', ipAddress, 3, 60000) // 분당 3회로 제한
    if (!rateLimitResult.allowed) {
      // 의심스러운 활동 감지
      await checkSuspiciousActivity(ipAddress)
      
      return {
        isValid: false,
        error: '너무 많은 시도가 감지되었습니다. 잠시 후 다시 시도해주세요.',
        errorCode: InviteCodeError.RATE_LIMIT_EXCEEDED
      }
    }

    // 2. 입력값 정제 및 형식 검증
    const sanitizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
    if (!validateInviteCodeFormat(sanitizedCode)) {
      await logInviteCodeAttempt(sanitizedCode, null, ipAddress, userAgent, false, 'Invalid format')
      
      return {
        isValid: false,
        error: '가입 코드 형식이 올바르지 않습니다.',
        errorCode: InviteCodeError.INVALID_FORMAT
      }
    }

    // 3. 병원 코드 추출 및 검증
    const hospitalCode = extractHospitalCodeFromInvite(sanitizedCode)
    if (!hospitalCode) {
      await logInviteCodeAttempt(sanitizedCode, null, ipAddress, userAgent, false, 'Hospital code extraction failed')
      
      return {
        isValid: false,
        error: '가입 코드에서 병원 정보를 찾을 수 없습니다.',
        errorCode: InviteCodeError.INVALID_FORMAT
      }
    }

    // 4. 병원 존재 여부 먼저 확인
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('hospital_code, hospital_name, hospital_type, is_active, address')
      .eq('hospital_code', hospitalCode)
      .eq('is_active', true)
      .single()

    if (hospitalError || !hospital) {
      await logInviteCodeAttempt(sanitizedCode, null, ipAddress, userAgent, false, 'Hospital not found or inactive')
      
      return {
        isValid: false,
        error: '해당 병원을 찾을 수 없거나 서비스를 이용할 수 없습니다.',
        errorCode: InviteCodeError.HOSPITAL_INACTIVE
      }
    }

    // 5. 가입 코드 해시 생성 및 조회
    const hashedCode = hashInviteCode(sanitizedCode)
    const { data: inviteCodeData, error: inviteError } = await supabase
      .from('hospital_signup_codes')
      .select('*')
      .eq('code', hashedCode)
      .eq('hospital_code', hospitalCode)
      .eq('is_active', true)
      .single()

    if (inviteError || !inviteCodeData) {
      await logInviteCodeAttempt(sanitizedCode, null, ipAddress, userAgent, false, 'Code not found in database')
      
      return {
        isValid: false,
        error: '유효하지 않은 가입 코드입니다.',
        errorCode: InviteCodeError.NOT_FOUND
      }
    }

    // 6. 사용 가능 여부 상세 확인
    const now = new Date()
    const expiresAt = new Date(inviteCodeData.expires_at)
    const currentUses = inviteCodeData.current_uses || 0
    const maxUses = inviteCodeData.max_uses

    // 만료 시간 확인
    if (expiresAt <= now) {
      await logInviteCodeAttempt(sanitizedCode, inviteCodeData.id, ipAddress, userAgent, false, 'Code expired')
      
      return {
        isValid: false,
        error: `가입 코드가 만료되었습니다. (만료일: ${expiresAt.toLocaleDateString('ko-KR')})`,
        errorCode: InviteCodeError.EXPIRED
      }
    }

    // 사용 횟수 확인
    if (maxUses && currentUses >= maxUses) {
      await logInviteCodeAttempt(sanitizedCode, inviteCodeData.id, ipAddress, userAgent, false, 'Max uses exceeded')
      
      return {
        isValid: false,
        error: `가입 코드 사용 횟수가 초과되었습니다. (${currentUses}/${maxUses})`,
        errorCode: InviteCodeError.MAX_USES_EXCEEDED
      }
    }

    // 7. 추가 보안 검증
    // 동일 IP에서 같은 코드 반복 검증 시도 확인
    const recentAttempts = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'code_validation')
      .eq('ip_address', ipAddress)
      .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 최근 5분
      .order('timestamp', { ascending: false })
      .limit(10)

    if (recentAttempts.data && recentAttempts.data.length > 5) {
      await checkSuspiciousActivity(ipAddress)
    }

    // 8. 성공 로그 기록
    await logInviteCodeAttempt(sanitizedCode, inviteCodeData.id, ipAddress, userAgent, true, 'Validation successful')

    // 9. 병원 정보 반환
    const hospitalInfo: HospitalData = {
      hospitalCode: hospital.hospital_code,
      hospitalName: hospital.hospital_name,
      hospitalType: hospital.hospital_type,
      region: '', // 필요시 추가
      address: hospital.address,
      isActive: hospital.is_active,
      createdAt: new Date() // 필요시 실제 값으로 변경
    }

    return {
      isValid: true,
      hospitalInfo,
      codeInfo: {
        id: inviteCodeData.id,
        expiresAt: expiresAt,
        remainingUses: maxUses ? maxUses - currentUses : null,
        createdBy: inviteCodeData.created_by
      }
    }

  } catch (error) {
    console.error('가입 코드 검증 중 오류:', error)
    
    // 시스템 오류도 로그에 기록
    await logInviteCodeAttempt(code, null, ipAddress, userAgent, false, `System error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    return {
      isValid: false,
      error: '가입 코드 검증 중 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      errorCode: InviteCodeError.SYSTEM_ERROR
    }
  }
}

/**
 * 가입 코드 사용 처리
 */
export const useInviteCode = async (
  code: string,
  customerId: string,
  ipAddress: string = '',
  userAgent: string = ''
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 먼저 검증
    const validation = await validateInviteCodeClient(code, ipAddress, userAgent)
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }

    // 트랜잭션으로 사용 처리
    const { data, error } = await supabase.rpc('use_invite_code', {
      p_code: hashInviteCode(code),
      p_customer_id: customerId,
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    })

    if (error) {
      console.error('가입 코드 사용 처리 오류:', error)
      return { success: false, error: '가입 코드 사용 처리 중 오류가 발생했습니다.' }
    }

    return { success: true }

  } catch (error) {
    console.error('가입 코드 사용 중 오류:', error)
    return { success: false, error: '가입 코드 사용 중 오류가 발생했습니다.' }
  }
}

/**
 * 의사용 가입 코드 생성 (통합 버전)
 */
export const generateInviteCodeForDoctor = async (
  request: InviteCodeGenerationRequest,
  doctorId: string
): Promise<{ success: boolean; inviteCode?: InviteCode; code?: string; error?: string }> => {
  try {
    // 의사 권한 확인
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('hospital_code')
      .eq('user_id', doctorId)
      .single()

    if (doctorError || !doctor) {
      return { success: false, error: '의사 정보를 찾을 수 없습니다.' }
    }

    if (doctor.hospital_code !== request.hospitalCode) {
      return { success: false, error: '병원 코드가 일치하지 않습니다.' }
    }

    // 가입 코드 생성
    const inviteCode = generateInviteCode(request.hospitalCode)
    const hashedCode = hashInviteCode(inviteCode)

    // 데이터베이스에 저장
    const { data, error } = await supabase
      .from('hospital_signup_codes')
      .insert({
        code: hashedCode,
        hospital_code: request.hospitalCode,
        description: request.description,
        created_by: doctorId,
        expires_at: request.expiresAt?.toISOString(),
        max_uses: request.maxUses,
        current_uses: 0,
        is_active: request.isActive
      })
      .select()
      .single()

    if (error) {
      console.error('가입 코드 생성 오류:', error)
      return { success: false, error: '가입 코드 생성 중 오류가 발생했습니다.' }
    }

    const newInviteCode: InviteCode = {
      id: data.id,
      code: inviteCode, // 원본 코드 반환
      hospitalCode: data.hospital_code,
      description: data.description || '',
      maxUses: data.max_uses,
      usedCount: data.current_uses || 0,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined
    }

    return { success: true, inviteCode: newInviteCode }

  } catch (error) {
    console.error('가입 코드 생성 중 오류:', error)
    return { success: false, error: '가입 코드 생성 중 오류가 발생했습니다.' }
  }
}

/**
 * 의사의 가입 코드 목록 조회 (InviteCodeManager용)
 */
export const getInviteCodesByDoctor = async (
  doctorId: string
): Promise<InviteCode[]> => {
  try {
    const { data, error } = await supabase
      .from('hospital_signup_codes')
      .select('*')
      .eq('created_by', doctorId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('가입 코드 목록 조회 오류:', error)
      throw new Error('가입 코드 목록을 불러올 수 없습니다.')
    }

    return data.map(item => ({
      id: item.id,
      code: `INV-${item.hospital_code}-${item.id.slice(-6).toUpperCase()}`, // 표시용 코드
      hospitalCode: item.hospital_code,
      description: item.description || '',
      maxUses: item.max_uses,
      usedCount: item.current_uses || 0,
      isActive: item.is_active,
      createdAt: new Date(item.created_at),
      expiresAt: item.expires_at ? new Date(item.expires_at) : undefined,
      lastUsedAt: item.last_used_at ? new Date(item.last_used_at) : undefined
    }))

  } catch (error) {
    console.error('가입 코드 목록 조회 중 오류:', error)
    throw error
  }
}

/**
 * 가입 코드 비활성화 (InviteCodeManager용)
 */
export const deactivateInviteCode = async (
  codeId: string,
  doctorId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('hospital_signup_codes')
      .update({ is_active: false })
      .eq('id', codeId)
      .eq('created_by', doctorId)

    if (error) {
      console.error('가입 코드 비활성화 오류:', error)
      return { success: false, error: '가입 코드 비활성화 중 오류가 발생했습니다.' }
    }

    return { success: true }

  } catch (error) {
    console.error('가입 코드 비활성화 중 오류:', error)
    return { success: false, error: '가입 코드 비활성화 중 오류가 발생했습니다.' }
  }
}

/**
 * 의사의 가입 코드 목록 조회 (기존 함수)
 */
export const getDoctorInviteCodes = async (
  doctorId: string
): Promise<{ success: boolean; codes?: InviteCode[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('hospital_signup_codes')
      .select(`
        *,
        usage_history:hospital_signup_code_usage(*)
      `)
      .eq('created_by', doctorId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('가입 코드 목록 조회 오류:', error)
      return { success: false, error: '가입 코드 목록을 불러올 수 없습니다.' }
    }

    return { success: true, codes: data as InviteCode[] }

  } catch (error) {
    console.error('가입 코드 목록 조회 중 오류:', error)
    return { success: false, error: '가입 코드 목록 조회 중 오류가 발생했습니다.' }
  }
}



/**
 * 가입 코드 시도 로그 기록
 */
const logInviteCodeAttempt = async (
  code: string,
  codeId: string | null,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  details: string
): Promise<void> => {
  try {
    const log = createSecurityLog(
      'code_validation',
      'anonymous',
      ipAddress,
      userAgent,
      {
        code_id: codeId,
        code_format_valid: validateInviteCodeFormat(code),
        details
      },
      success
    )

    await supabase
      .from('audit_logs')
      .insert(log)

  } catch (error) {
    console.error('감사 로그 기록 오류:', error)
  }
}

/**
 * 의심스러운 활동 감지 및 알림
 */
export const checkSuspiciousActivity = async (
  ipAddress: string,
  timeWindowMs: number = 60 * 60 * 1000 // 1시간
): Promise<void> => {
  try {
    const since = new Date(Date.now() - timeWindowMs)

    // 최근 시도 내역 조회
    const { data: attempts, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'code_validation')
      .eq('ip_address', ipAddress)
      .gte('timestamp', since.toISOString())
      .order('timestamp', { ascending: false })

    if (error || !attempts) {
      return
    }

    // 의심스러운 패턴 감지
    const analysis = detectSuspiciousActivity(
      attempts.map(attempt => ({
        timestamp: new Date(attempt.timestamp).getTime(),
        ipAddress: attempt.ip_address,
        userAgent: attempt.user_agent,
        success: attempt.success
      }))
    )

    if (analysis.isSuspicious) {
      // 보안 알림 생성
      await supabase
        .from('security_alerts')
        .insert({
          type: 'MULTIPLE_FAILED_CODES',
          severity: analysis.severity,
          details: {
            ip_address: ipAddress,
            reasons: analysis.reasons,
            attempt_count: attempts.length
          },
          timestamp: new Date().toISOString(),
          resolved: false
        })
    }

  } catch (error) {
    console.error('의심스러운 활동 감지 오류:', error)
  }
}

/**
 * 가입 코드 통계 조회
 */
export const getInviteCodeStats = async (
  hospitalCode: string
): Promise<{
  totalCodes: number
  activeCodes: number
  usedCodes: number
  totalUsages: number
  successRate: number
}> => {
  try {
    const { data: stats, error } = await supabase.rpc('get_invite_code_stats', {
      p_hospital_code: hospitalCode
    })

    if (error) {
      console.error('가입 코드 통계 조회 오류:', error)
      return {
        totalCodes: 0,
        activeCodes: 0,
        usedCodes: 0,
        totalUsages: 0,
        successRate: 0
      }
    }

    return stats || {
      totalCodes: 0,
      activeCodes: 0,
      usedCodes: 0,
      totalUsages: 0,
      successRate: 0
    }

  } catch (error) {
    console.error('가입 코드 통계 조회 중 오류:', error)
    return {
      totalCodes: 0,
      activeCodes: 0,
      usedCodes: 0,
      totalUsages: 0,
      successRate: 0
    }
  }
}
/**
 *
 실시간 가입 코드 검증 (디바운싱 적용)
 */
let validationCache = new Map<string, { result: InviteCodeValidationResult; timestamp: number }>()
let validationTimeouts = new Map<string, NodeJS.Timeout>()

export const validateInviteCodeRealtime = async (
  code: string,
  ipAddress: string = '',
  userAgent: string = '',
  debounceMs: number = 500
): Promise<InviteCodeValidationResult> => {
  return new Promise((resolve) => {
    const cacheKey = `${code}-${ipAddress}`
    
    // 기존 타이머 취소
    if (validationTimeouts.has(cacheKey)) {
      clearTimeout(validationTimeouts.get(cacheKey)!)
    }

    // 캐시 확인 (5분간 유효)
    const cached = validationCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      resolve(cached.result)
      return
    }

    // 디바운싱 적용
    const timeout = setTimeout(async () => {
      try {
        const result = await validateInviteCodeClient(code, ipAddress, userAgent)
        
        // 성공한 결과만 캐싱 (실패는 재시도 가능하도록)
        if (result.isValid) {
          validationCache.set(cacheKey, {
            result,
            timestamp: Date.now()
          })
        }
        
        validationTimeouts.delete(cacheKey)
        resolve(result)
      } catch (error) {
        validationTimeouts.delete(cacheKey)
        resolve({
          isValid: false,
          error: '검증 중 오류가 발생했습니다.',
          errorCode: InviteCodeError.SYSTEM_ERROR
        })
      }
    }, debounceMs)

    validationTimeouts.set(cacheKey, timeout)
  })
}

/**
 * 가입 코드 형식 실시간 검증 (클라이언트 사이드)
 */
export const validateInviteCodeFormatRealtime = (code: string): {
  isValid: boolean
  errors: string[]
  suggestions: string[]
} => {
  const errors: string[] = []
  const suggestions: string[] = []

  if (!code || code.trim().length === 0) {
    return { isValid: false, errors: ['가입 코드를 입력해주세요.'], suggestions: [] }
  }

  const sanitized = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
  
  // 길이 검증
  if (sanitized.length < 20) {
    errors.push('가입 코드가 너무 짧습니다.')
    suggestions.push('완전한 가입 코드를 입력해주세요.')
  }

  if (sanitized.length > 50) {
    errors.push('가입 코드가 너무 깁니다.')
    suggestions.push('올바른 가입 코드를 확인해주세요.')
  }

  // 형식 검증
  const formatRegex = /^OB-[A-Z]+-[A-Z]+-\d{3}-\d{6}-[A-Z0-9]{8}$/
  if (!formatRegex.test(sanitized)) {
    errors.push('가입 코드 형식이 올바르지 않습니다.')
    suggestions.push('형식: OB-지역-병원유형-순번-년월-코드')
    suggestions.push('예시: OB-SEOUL-CLINIC-001-202401-A7B9X2K5')
  }

  // 부분별 검증
  const parts = sanitized.split('-')
  if (parts.length !== 6) {
    errors.push('가입 코드 구성 요소가 올바르지 않습니다.')
  } else {
    if (parts[0] !== 'OB') {
      errors.push('가입 코드는 OB로 시작해야 합니다.')
    }
    
    if (parts[3] && !/^\d{3}$/.test(parts[3])) {
      errors.push('병원 순번은 3자리 숫자여야 합니다.')
    }
    
    if (parts[4] && !/^\d{6}$/.test(parts[4])) {
      errors.push('년월 정보가 올바르지 않습니다.')
    }
    
    if (parts[5] && !/^[A-Z0-9]{8}$/.test(parts[5])) {
      errors.push('코드 부분은 8자리 영문 대문자와 숫자여야 합니다.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions
  }
}

/**
 * 가입 코드 보안 강도 검증
 */
export const checkInviteCodeSecurity = (code: string): {
  strength: 'weak' | 'medium' | 'strong'
  score: number
  issues: string[]
  recommendations: string[]
} => {
  const issues: string[] = []
  const recommendations: string[] = []
  let score = 0

  if (!code) {
    return {
      strength: 'weak',
      score: 0,
      issues: ['코드가 없습니다.'],
      recommendations: ['유효한 가입 코드를 입력해주세요.']
    }
  }

  const sanitized = code.trim().toUpperCase()

  // 길이 점수
  if (sanitized.length >= 30) score += 20
  else if (sanitized.length >= 20) score += 10
  else issues.push('코드가 너무 짧습니다.')

  // 복잡성 점수
  const hasNumbers = /\d/.test(sanitized)
  const hasLetters = /[A-Z]/.test(sanitized)
  const hasSpecialChars = /-/.test(sanitized)

  if (hasNumbers) score += 15
  if (hasLetters) score += 15
  if (hasSpecialChars) score += 10

  // 패턴 점수
  if (/^OB-/.test(sanitized)) score += 20
  else issues.push('올바른 OB 코드 형식이 아닙니다.')

  // 예측 가능성 검사
  if (/(.)\1{3,}/.test(sanitized)) {
    score -= 20
    issues.push('반복되는 문자가 너무 많습니다.')
  }

  if (/123|ABC|000/.test(sanitized)) {
    score -= 15
    issues.push('예측 가능한 패턴이 포함되어 있습니다.')
  }

  // 강도 결정
  let strength: 'weak' | 'medium' | 'strong'
  if (score >= 70) strength = 'strong'
  else if (score >= 40) strength = 'medium'
  else strength = 'weak'

  // 권장사항
  if (strength === 'weak') {
    recommendations.push('병원에서 제공받은 정확한 가입 코드를 입력해주세요.')
    recommendations.push('코드를 다시 확인해주세요.')
  } else if (strength === 'medium') {
    recommendations.push('코드 형식을 다시 한 번 확인해주세요.')
  }

  return { strength, score, issues, recommendations }
}

/**
 * 가입 코드 사용 내역 조회
 */
export const getInviteCodeUsageHistory = async (
  codeId: string,
  doctorId: string
): Promise<{
  success: boolean
  history?: Array<{
    id: string
    customerId: string
    customerName?: string
    usedAt: Date
    ipAddress: string
    userAgent: string
    success: boolean
  }>
  error?: string
}> => {
  try {
    const { data, error } = await supabase
      .from('hospital_signup_code_usage')
      .select(`
        *,
        customers:customer_id (
          name,
          user_id
        )
      `)
      .eq('code_id', codeId)
      .order('used_at', { ascending: false })

    if (error) {
      console.error('가입 코드 사용 내역 조회 오류:', error)
      return { success: false, error: '사용 내역을 불러올 수 없습니다.' }
    }

    // 의사 권한 확인
    const { data: codeData, error: codeError } = await supabase
      .from('hospital_signup_codes')
      .select('created_by')
      .eq('id', codeId)
      .single()

    if (codeError || !codeData || codeData.created_by !== doctorId) {
      return { success: false, error: '접근 권한이 없습니다.' }
    }

    const history = data.map(usage => ({
      id: usage.id,
      customerId: usage.customer_id,
      customerName: usage.customers?.name || '알 수 없음',
      usedAt: new Date(usage.used_at),
      ipAddress: usage.ip_address,
      userAgent: usage.user_agent,
      success: usage.success
    }))

    return { success: true, history }

  } catch (error) {
    console.error('가입 코드 사용 내역 조회 중 오류:', error)
    return { success: false, error: '사용 내역 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 캐시 정리 (메모리 관리)
 */
export const clearValidationCache = (): void => {
  validationCache.clear()
  validationTimeouts.forEach(timeout => clearTimeout(timeout))
  validationTimeouts.clear()
}

/**
 * 주기적 캐시 정리 (5분마다)
 */
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    validationCache.forEach((value, key) => {
      if (now - value.timestamp > 5 * 60 * 1000) { // 5분 경과
        expiredKeys.push(key)
      }
    })
    
    expiredKeys.forEach(key => validationCache.delete(key))
  }, 5 * 60 * 1000) // 5분마다 실행
}