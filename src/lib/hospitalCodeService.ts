/**
 * 병원 코드 자동 생성 및 관리 서비스
 */

import { supabase } from './supabase'
import { 
  HospitalData, 
  HospitalCodeGenerationRequest
} from '@/types/hospital'
import { 
  ensureUniqueHospitalCode,
  validateHospitalCode
} from './hospitalCodeUtils'
import { createSecurityLog, checkRateLimit } from './inviteCodeSecurity'

// HospitalCodeGenerator 컴포넌트에서 사용하는 인터페이스
interface HospitalDataForGenerator {
  name: string;
  address: string;
  phone: string;
  adminEmail: string;
  description?: string;
  capacity?: number;
  specialties?: string[];
}

interface HospitalCodeResult {
  success: boolean;
  code?: string;
  data?: any;
  error?: string;
}

/**
 * 병원 코드 생성 (의사 가입 시)
 */
export const generateHospitalCodeForDoctor = async (
  request: HospitalCodeGenerationRequest,
  doctorId: string,
  ipAddress: string = '',
  userAgent: string = ''
): Promise<{ success: boolean; hospitalCode?: string; hospitalData?: HospitalData; error?: string }> => {
  try {
    // Rate limiting 체크
    const rateLimitResult = await checkRateLimit('hospital_code_generation', ipAddress, 3, 3600000) // 시간당 3회
    if (!rateLimitResult.allowed) {
      return { 
        success: false, 
        error: '병원 코드 생성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' 
      }
    }

    // 입력 데이터 검증
    if (!request.hospitalName || !request.hospitalType || !request.region) {
      return { 
        success: false, 
        error: '병원 이름, 유형, 지역 정보가 필요합니다.' 
      }
    }

    // 고유한 병원 코드 생성
    const hospitalCode = await ensureUniqueHospitalCode(
      request.hospitalName,
      request.hospitalType,
      request.region
    )

    // 병원 데이터 구성
    const hospitalData: Omit<HospitalData, 'createdAt'> = {
      hospitalCode,
      hospitalName: request.hospitalName,
      hospitalType: request.hospitalType,
      region: request.region,
      address: request.address,
      phoneNumber: request.phoneNumber,
      registrationNumber: request.registrationNumber,
      medicalLicenseNumber: request.medicalLicenseNumber,
      isActive: true
    }

    // 데이터베이스에 병원 정보 저장
    const { data: savedHospital, error: hospitalError } = await supabase
      .from('hospitals')
      .insert({
        ...hospitalData,
        created_by: doctorId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (hospitalError) {
      console.error('병원 정보 저장 오류:', hospitalError)
      
      // 중복 코드 오류인 경우 재시도
      if (hospitalError.code === '23505') { // unique_violation
        return await generateHospitalCodeForDoctor(request, doctorId, ipAddress, userAgent)
      }
      
      return { 
        success: false, 
        error: '병원 정보 저장 중 오류가 발생했습니다.' 
      }
    }

    // 성공 로그 기록
    await logHospitalCodeGeneration(
      hospitalCode,
      doctorId,
      ipAddress,
      userAgent,
      true,
      'Hospital code generated successfully'
    )

    return { 
      success: true, 
      hospitalCode,
      hospitalData: {
        ...hospitalData,
        createdAt: new Date(savedHospital.created_at)
      }
    }

  } catch (error) {
    console.error('병원 코드 생성 중 오류:', error)
    
    // 실패 로그 기록
    await logHospitalCodeGeneration(
      '',
      doctorId,
      ipAddress,
      userAgent,
      false,
      `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )

    return { 
      success: false, 
      error: '병원 코드 생성 중 오류가 발생했습니다.' 
    }
  }
}

/**
 * 병원 코드 유효성 확인
 */
export const validateHospitalCodeExists = async (
  hospitalCode: string
): Promise<{ exists: boolean; hospitalData?: HospitalData; error?: string }> => {
  try {
    // 형식 검증
    if (!validateHospitalCode(hospitalCode)) {
      return { 
        exists: false, 
        error: '병원 코드 형식이 올바르지 않습니다.' 
      }
    }

    // 데이터베이스에서 조회
    const { data: hospital, error } = await supabase
      .from('hospitals')
      .select('*')
      .eq('hospital_code', hospitalCode)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return { exists: false }
      }
      
      console.error('병원 코드 조회 오류:', error)
      return { 
        exists: false, 
        error: '병원 코드 조회 중 오류가 발생했습니다.' 
      }
    }

    return { 
      exists: true, 
      hospitalData: {
        hospitalCode: hospital.hospital_code,
        hospitalName: hospital.hospital_name,
        hospitalType: hospital.hospital_type,
        region: hospital.region,
        address: hospital.address,
        phoneNumber: hospital.phone_number,
        registrationNumber: hospital.registration_number,
        medicalLicenseNumber: hospital.medical_license_number,
        createdAt: new Date(hospital.created_at),
        isActive: hospital.is_active
      }
    }

  } catch (error) {
    console.error('병원 코드 검증 중 오류:', error)
    return { 
      exists: false, 
      error: '병원 코드 검증 중 오류가 발생했습니다.' 
    }
  }
}

/**
 * 병원 정보 조회
 */
export const getHospitalByCode = async (
  hospitalCode: string
): Promise<{ success: boolean; hospitalData?: HospitalData; error?: string }> => {
  try {
    const result = await validateHospitalCodeExists(hospitalCode)
    
    if (result.error) {
      return { success: false, error: result.error }
    }
    
    if (!result.exists) {
      return { success: false, error: '병원을 찾을 수 없습니다.' }
    }

    return { success: true, hospitalData: result.hospitalData }

  } catch (error) {
    console.error('병원 정보 조회 중 오류:', error)
    return { 
      success: false, 
      error: '병원 정보 조회 중 오류가 발생했습니다.' 
    }
  }
}

/**
 * 병원 정보 업데이트
 */
export const updateHospitalInfo = async (
  hospitalCode: string,
  updates: Partial<HospitalData>,
  doctorId: string
): Promise<{ success: boolean; hospitalData?: HospitalData; error?: string }> => {
  try {
    // 권한 확인 - 해당 병원의 소유자인지 확인
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('hospital_code')
      .eq('user_id', doctorId)
      .single()

    if (doctorError || !doctor || doctor.hospital_code !== hospitalCode) {
      return { 
        success: false, 
        error: '병원 정보를 수정할 권한이 없습니다.' 
      }
    }

    // 업데이트 실행
    const { data: updatedHospital, error: updateError } = await supabase
      .from('hospitals')
      .update({
        hospital_name: updates.hospitalName,
        hospital_type: updates.hospitalType,
        region: updates.region,
        address: updates.address,
        phone_number: updates.phoneNumber,
        registration_number: updates.registrationNumber,
        medical_license_number: updates.medicalLicenseNumber,
        updated_at: new Date().toISOString()
      })
      .eq('hospital_code', hospitalCode)
      .select()
      .single()

    if (updateError) {
      console.error('병원 정보 업데이트 오류:', updateError)
      return { 
        success: false, 
        error: '병원 정보 업데이트 중 오류가 발생했습니다.' 
      }
    }

    return { 
      success: true, 
      hospitalData: {
        hospitalCode: updatedHospital.hospital_code,
        hospitalName: updatedHospital.hospital_name,
        hospitalType: updatedHospital.hospital_type,
        region: updatedHospital.region,
        address: updatedHospital.address,
        phoneNumber: updatedHospital.phone_number,
        registrationNumber: updatedHospital.registration_number,
        medicalLicenseNumber: updatedHospital.medical_license_number,
        createdAt: new Date(updatedHospital.created_at),
        isActive: updatedHospital.is_active
      }
    }

  } catch (error) {
    console.error('병원 정보 업데이트 중 오류:', error)
    return { 
      success: false, 
      error: '병원 정보 업데이트 중 오류가 발생했습니다.' 
    }
  }
}

/**
 * 병원 비활성화
 */
export const deactivateHospital = async (
  hospitalCode: string,
  doctorId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 권한 확인
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('hospital_code')
      .eq('user_id', doctorId)
      .single()

    if (doctorError || !doctor || doctor.hospital_code !== hospitalCode) {
      return { 
        success: false, 
        error: '병원을 비활성화할 권한이 없습니다.' 
      }
    }

    // 병원 비활성화
    const { error: deactivateError } = await supabase
      .from('hospitals')
      .update({ 
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivation_reason: reason
      })
      .eq('hospital_code', hospitalCode)

    if (deactivateError) {
      console.error('병원 비활성화 오류:', deactivateError)
      return { 
        success: false, 
        error: '병원 비활성화 중 오류가 발생했습니다.' 
      }
    }

    // 관련 가입 코드도 비활성화
    await supabase
      .from('hospital_signup_codes')
      .update({ is_active: false })
      .eq('hospital_code', hospitalCode)

    return { success: true }

  } catch (error) {
    console.error('병원 비활성화 중 오류:', error)
    return { 
      success: false, 
      error: '병원 비활성화 중 오류가 발생했습니다.' 
    }
  }
}

/**
 * 병원 통계 조회
 */
export const getHospitalStats = async (
  hospitalCode: string
): Promise<{
  totalCustomers: number
  activeCustomers: number
  totalInviteCodes: number
  activeInviteCodes: number
  totalSignups: number
  recentSignups: number
}> => {
  try {
    const { data: stats, error } = await supabase.rpc('get_hospital_stats', {
      p_hospital_code: hospitalCode
    })

    if (error) {
      console.error('병원 통계 조회 오류:', error)
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        totalInviteCodes: 0,
        activeInviteCodes: 0,
        totalSignups: 0,
        recentSignups: 0
      }
    }

    return stats || {
      totalCustomers: 0,
      activeCustomers: 0,
      totalInviteCodes: 0,
      activeInviteCodes: 0,
      totalSignups: 0,
      recentSignups: 0
    }

  } catch (error) {
    console.error('병원 통계 조회 중 오류:', error)
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      totalInviteCodes: 0,
      activeInviteCodes: 0,
      totalSignups: 0,
      recentSignups: 0
    }
  }
}

/**
 * 지역별 병원 목록 조회 (관리자용)
 */
export const getHospitalsByRegion = async (
  region?: string,
  hospitalType?: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  success: boolean
  hospitals?: HospitalData[]
  total?: number
  error?: string
}> => {
  try {
    let query = supabase
      .from('hospitals')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (region) {
      query = query.eq('region', region)
    }

    if (hospitalType) {
      query = query.eq('hospital_type', hospitalType)
    }

    const { data: hospitals, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error('병원 목록 조회 오류:', error)
      return { 
        success: false, 
        error: '병원 목록 조회 중 오류가 발생했습니다.' 
      }
    }

    const hospitalData = hospitals?.map(hospital => ({
      hospitalCode: hospital.hospital_code,
      hospitalName: hospital.hospital_name,
      hospitalType: hospital.hospital_type,
      region: hospital.region,
      address: hospital.address,
      phoneNumber: hospital.phone_number,
      registrationNumber: hospital.registration_number,
      medicalLicenseNumber: hospital.medical_license_number,
      createdAt: new Date(hospital.created_at),
      isActive: hospital.is_active
    })) || []

    return { 
      success: true, 
      hospitals: hospitalData,
      total: count || 0
    }

  } catch (error) {
    console.error('병원 목록 조회 중 오류:', error)
    return { 
      success: false, 
      error: '병원 목록 조회 중 오류가 발생했습니다.' 
    }
  }
}

/**
 * 병원 코드 생성 로그 기록
 */
const logHospitalCodeGeneration = async (
  hospitalCode: string,
  doctorId: string,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  details: string
): Promise<void> => {
  try {
    const log = createSecurityLog(
      'hospital_code_generation',
      doctorId,
      ipAddress,
      userAgent,
      {
        hospital_code: hospitalCode,
        details
      },
      success
    )

    await supabase
      .from('audit_logs')
      .insert(log)

  } catch (error) {
    console.error('병원 코드 생성 로그 기록 오류:', error)
  }
}

/**
 * 병원 코드 중복 확인 (실제 구현)
 */
export const checkHospitalCodeDuplicate = async (hospitalCode: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('hospitals')
      .select('hospital_code')
      .eq('hospital_code', hospitalCode)
      .limit(1)

    if (error) {
      console.error('병원 코드 중복 확인 오류:', error)
      return false
    }

    return data && data.length > 0

  } catch (error) {
    console.error('병원 코드 중복 확인 중 오류:', error)
    return false
  }
}

/**
 * 병원명과 이메일 중복 확인 (HospitalCodeGenerator용)
 */
export const checkDuplicateHospital = async (
  hospitalName: string, 
  adminEmail: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('hospital_codes')
      .select('id')
      .or(`hospital_name.ilike.%${hospitalName}%,admin_email.eq.${adminEmail}`)
      .limit(1)

    if (error) {
      console.error('Duplicate check error:', error)
      throw new Error('중복 확인 중 오류가 발생했습니다.')
    }

    return data && data.length > 0
  } catch (error) {
    console.error('Duplicate check error:', error)
    throw error
  }
}

/**
 * 병원 코드 생성 (HospitalCodeGenerator용)
 */
export const generateHospitalCode = async (
  hospitalData: HospitalDataForGenerator
): Promise<HospitalCodeResult> => {
  try {
    // 중복 체크
    const isDuplicate = await checkDuplicateHospital(
      hospitalData.name, 
      hospitalData.adminEmail
    )
    
    if (isDuplicate) {
      return {
        success: false,
        error: '이미 등록된 병원명 또는 관리자 이메일입니다.'
      }
    }

    // 병원 코드 생성 (H + 7자리 랜덤)
    let code = generateCode()
    let attempts = 0
    const maxAttempts = 5

    // 코드 중복 체크 및 재생성
    while (attempts < maxAttempts) {
      const { data: existingCode, error } = await supabase
        .from('hospital_codes')
        .select('code')
        .eq('code', code)
        .limit(1)

      if (error) {
        console.error('Code duplicate check error:', error)
        return {
          success: false,
          error: '코드 중복 확인 중 오류가 발생했습니다.'
        }
      }

      if (!existingCode || existingCode.length === 0) {
        break // 중복되지 않는 코드 찾음
      }

      code = generateCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return {
        success: false,
        error: '고유한 병원 코드 생성에 실패했습니다. 다시 시도해주세요.'
      }
    }

    // 데이터베이스에 저장
    const { data, error } = await supabase
      .from('hospital_codes')
      .insert({
        code,
        hospital_name: hospitalData.name,
        hospital_address: hospitalData.address,
        hospital_phone: hospitalData.phone,
        admin_email: hospitalData.adminEmail,
        description: hospitalData.description,
        capacity: hospitalData.capacity,
        specialties: hospitalData.specialties,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: '데이터베이스 저장 중 오류가 발생했습니다.'
      }
    }

    return {
      success: true,
      code,
      data
    }
  } catch (error) {
    console.error('Hospital code generation error:', error)
    return {
      success: false,
      error: '병원 코드 생성 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 병원 코드 생성 헬퍼 함수
 */
const generateCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'H'
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 다음 순번 조회 (실제 구현)
 */
export const getNextHospitalSequence = async (
  regionCode: string, 
  typeCode: string
): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('get_next_hospital_sequence', {
      p_region_code: regionCode,
      p_type_code: typeCode
    })

    if (error) {
      console.error('다음 순번 조회 오류:', error)
      return Math.floor(Math.random() * 999) + 1
    }

    return data || 1

  } catch (error) {
    console.error('다음 순번 조회 중 오류:', error)
    return Math.floor(Math.random() * 999) + 1
  }
}