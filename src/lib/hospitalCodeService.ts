// 병원 가입 코드 서비스
import { supabase } from '@/lib/supabase'
import { generateUniqueCode, validateCodeFormat, normalizeCode } from '@/lib/codeGenerator'
import type {
  HospitalCode,
  HospitalCodeUsage,
  CodeVerificationResult,
  CreateCodeRequest
} from '@/types/hospitalCode'

/**
 * 병원 코드 검증
 */
export async function verifyHospitalCode(inputCode: string): Promise<CodeVerificationResult> {
  try {
    const normalizedCode = normalizeCode(inputCode)
    
    // 1. 형식 검증
    if (!validateCodeFormat(normalizedCode)) {
      return { isValid: false, error: 'INVALID_FORMAT' }
    }

    // 2. 데이터베이스에서 코드 조회
    const { data: hospitalCode, error } = await supabase
      .from('hospital_signup_codes')
      .select('*')
      .eq('code', normalizedCode)
      .single()

    if (error || !hospitalCode) {
      return { isValid: false, error: 'CODE_NOT_FOUND' }
    }

    // 3. 활성화 상태 확인
    if (!hospitalCode.is_active) {
      return { isValid: false, error: 'CODE_INACTIVE' }
    }

    // 4. 만료일 확인
    if (hospitalCode.expires_at && new Date(hospitalCode.expires_at) < new Date()) {
      return { isValid: false, error: 'CODE_EXPIRED' }
    }

    // 5. 사용 한도 확인
    if (hospitalCode.max_uses && hospitalCode.current_uses >= hospitalCode.max_uses) {
      return { isValid: false, error: 'CODE_USAGE_EXCEEDED' }
    }

    // 6. 데이터 변환
    const code: HospitalCode = {
      id: hospitalCode.id,
      code: hospitalCode.code,
      doctorId: hospitalCode.doctor_id,
      name: hospitalCode.name,
      maxUses: hospitalCode.max_uses,
      currentUses: hospitalCode.current_uses,
      isActive: hospitalCode.is_active,
      expiresAt: hospitalCode.expires_at,
      createdAt: hospitalCode.created_at,
      updatedAt: hospitalCode.updated_at
    }

    return { isValid: true, code }
  } catch (error) {
    console.error('Code verification error:', error)
    return { isValid: false, error: 'CODE_NOT_FOUND' }
  }
}

/**
 * 병원 코드 생성
 */
export async function createHospitalCode(
  doctorId: string,
  request: CreateCodeRequest
): Promise<HospitalCode> {
  try {
    // 코드 존재 여부 확인 함수
    const checkCodeExists = async (code: string): Promise<boolean> => {
      const { data } = await supabase
        .from('hospital_signup_codes')
        .select('id')
        .eq('code', code)
        .single()
      return !!data
    }

    // 고유한 코드 생성
    const uniqueCode = await generateUniqueCode(checkCodeExists)

    // 데이터베이스에 저장
    const { data, error } = await supabase
      .from('hospital_signup_codes')
      .insert({
        doctor_id: doctorId,
        code: uniqueCode,
        name: request.name || null,
        max_uses: request.maxUses || null,
        expires_at: request.expiresAt || null,
        is_active: true,
        current_uses: 0
      })
      .select()
      .single()

    if (error) {
      throw new Error(`코드 생성 실패: ${error.message}`)
    }

    return {
      id: data.id,
      code: data.code,
      doctorId: data.doctor_id,
      name: data.name,
      maxUses: data.max_uses,
      currentUses: data.current_uses,
      isActive: data.is_active,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Create hospital code error:', error)
    throw error
  }
}

/**
 * 의사의 병원 코드 목록 조회
 */
export async function getDoctorHospitalCodes(doctorId: string): Promise<HospitalCode[]> {
  try {
    const { data, error } = await supabase
      .from('hospital_signup_codes')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`코드 목록 조회 실패: ${error.message}`)
    }

    return data.map((item: any) => ({
      id: item.id,
      code: item.code,
      doctorId: item.doctor_id,
      name: item.name,
      maxUses: item.max_uses,
      currentUses: item.current_uses,
      isActive: item.is_active,
      expiresAt: item.expires_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))
  } catch (error) {
    console.error('Get doctor hospital codes error:', error)
    throw error
  }
}

/**
 * 병원 코드 활성화/비활성화 토글
 */
export async function toggleHospitalCodeStatus(
  codeId: string,
  doctorId: string
): Promise<HospitalCode> {
  try {
    // 먼저 현재 상태 조회 (권한 확인 포함)
    const { data: currentCode, error: fetchError } = await supabase
      .from('hospital_signup_codes')
      .select('*')
      .eq('id', codeId)
      .eq('doctor_id', doctorId)
      .single()

    if (fetchError || !currentCode) {
      throw new Error('코드를 찾을 수 없거나 권한이 없습니다.')
    }

    // 상태 토글
    const { data, error } = await supabase
      .from('hospital_signup_codes')
      .update({ is_active: !currentCode.is_active })
      .eq('id', codeId)
      .eq('doctor_id', doctorId)
      .select()
      .single()

    if (error) {
      throw new Error(`코드 상태 변경 실패: ${error.message}`)
    }

    return {
      id: data.id,
      code: data.code,
      doctorId: data.doctor_id,
      name: data.name,
      maxUses: data.max_uses,
      currentUses: data.current_uses,
      isActive: data.is_active,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Toggle hospital code status error:', error)
    throw error
  }
}

/**
 * 병원 코드 삭제
 */
export async function deleteHospitalCode(
  codeId: string,
  doctorId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('hospital_signup_codes')
      .delete()
      .eq('id', codeId)
      .eq('doctor_id', doctorId)

    if (error) {
      throw new Error(`코드 삭제 실패: ${error.message}`)
    }
  } catch (error) {
    console.error('Delete hospital code error:', error)
    throw error
  }
}

/**
 * 코드 사용 기록
 */
export async function recordCodeUsage(
  codeId: string,
  customerId: string
): Promise<boolean> {
  try {
    // 트랜잭션으로 사용 기록 추가 및 사용 횟수 증가
    const { error: usageError } = await supabase
      .from('hospital_signup_code_usage')
      .insert({
        code_id: codeId,
        customer_id: customerId
      })

    if (usageError) {
      throw new Error(`사용 기록 저장 실패: ${usageError.message}`)
    }

    // 사용 횟수 증가
    const { error: updateError } = await supabase
      .rpc('increment_code_usage', { code_id: codeId })

    if (updateError) {
      console.error('Usage count increment error:', updateError)
      // 사용 기록은 저장되었으므로 에러를 던지지 않음
    }

    return true
  } catch (error) {
    console.error('Record code usage error:', error)
    return false
  }
}

/**
 * 병원 코드 사용 기록 (별칭)
 */
export const recordHospitalCodeUsage = recordCodeUsage

/**
 * 코드별 고객 목록 조회
 */
export async function getCodeCustomers(
  codeId: string,
  doctorId: string
): Promise<HospitalCodeUsage[]> {
  try {
    const { data, error } = await supabase
      .from('hospital_signup_code_usage')
      .select(`
        id,
        code_id,
        customer_id,
        used_at,
        customers!inner(
          user_id,
          name,
          users!inner(email)
        ),
        hospital_signup_codes!inner(
          doctor_id
        )
      `)
      .eq('code_id', codeId)
      .eq('hospital_signup_codes.doctor_id', doctorId)
      .order('used_at', { ascending: false })

    if (error) {
      throw new Error(`고객 목록 조회 실패: ${error.message}`)
    }

    return data.map((item: any) => ({
      id: item.id,
      codeId: item.code_id,
      customerId: item.customer_id,
      customerName: item.customers?.name,
      customerEmail: item.customers?.users?.email,
      usedAt: item.used_at
    }))
  } catch (error) {
    console.error('Get code customers error:', error)
    throw error
  }
}