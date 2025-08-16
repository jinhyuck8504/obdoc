/**
 * 병원 코드 생성 및 관리 유틸리티
 */

import { HospitalType, RegionCode, HospitalCodeError } from '@/types/hospital'
import crypto from 'crypto'

// 지역 코드 매핑
const REGION_CODE_MAP: Record<string, RegionCode> = {
  '서울': 'SEOUL',
  '부산': 'BUSAN',
  '대구': 'DAEGU',
  '인천': 'INCHEON',
  '광주': 'GWANGJU',
  '대전': 'DAEJEON',
  '울산': 'ULSAN',
  '세종': 'SEJONG',
  '경기': 'GYEONGGI',
  '강원': 'GANGWON',
  '충북': 'CHUNGBUK',
  '충남': 'CHUNGNAM',
  '전북': 'JEONBUK',
  '전남': 'JEONNAM',
  '경북': 'GYEONGBUK',
  '경남': 'GYEONGNAM',
  '제주': 'JEJU'
}

// 병원 유형 코드 매핑
const HOSPITAL_TYPE_CODE_MAP: Record<HospitalType, string> = {
  'clinic': 'CLINIC',
  'oriental_clinic': 'ORIENTAL',
  'hospital': 'HOSPITAL'
}

/**
 * 지역명을 지역 코드로 변환
 */
export const getRegionCode = (region: string): RegionCode => {
  // 정확한 매칭 시도
  if (REGION_CODE_MAP[region]) {
    return REGION_CODE_MAP[region]
  }
  
  // 부분 매칭 시도
  for (const [key, value] of Object.entries(REGION_CODE_MAP)) {
    if (region.includes(key) || key.includes(region)) {
      return value
    }
  }
  
  // 기본값으로 서울 반환
  return 'SEOUL'
}

/**
 * 병원 유형을 유형 코드로 변환
 */
export const getTypeCode = (type: HospitalType): string => {
  return HOSPITAL_TYPE_CODE_MAP[type]
}

/**
 * 다음 순번 생성 (실제로는 데이터베이스에서 조회)
 */
export const getNextSequence = async (regionCode: string, typeCode: string): Promise<number> => {
  // TODO: 실제 구현에서는 데이터베이스에서 해당 지역/유형의 마지막 순번을 조회
  // 현재는 임시로 랜덤 번호 생성
  return Math.floor(Math.random() * 999) + 1
}

/**
 * 병원 코드 생성
 * 형식: OB-{지역코드}-{타입}-{순번}
 * 예시: OB-SEOUL-CLINIC-001
 */
export const generateHospitalCode = async (
  hospitalName: string,
  hospitalType: HospitalType,
  region: string
): Promise<string> => {
  try {
    const prefix = 'OB'
    const regionCode = getRegionCode(region)
    const typeCode = getTypeCode(hospitalType)
    const sequence = await getNextSequence(regionCode, typeCode)
    
    return `${prefix}-${regionCode}-${typeCode}-${sequence.toString().padStart(3, '0')}`
  } catch (error) {
    throw new Error(HospitalCodeError.GENERATION_FAILED)
  }
}

/**
 * 병원 코드 유효성 검증
 */
export const validateHospitalCode = (code: string): boolean => {
  // 형식: OB-{지역코드}-{타입}-{순번}
  const pattern = /^OB-[A-Z]+-(CLINIC|ORIENTAL|HOSPITAL)-\d{3}$/
  return pattern.test(code)
}

/**
 * 병원 코드에서 정보 추출
 */
export const parseHospitalCode = (code: string): {
  prefix: string
  regionCode: string
  typeCode: string
  sequence: string
} | null => {
  if (!validateHospitalCode(code)) {
    return null
  }
  
  const parts = code.split('-')
  return {
    prefix: parts[0],
    regionCode: parts[1],
    typeCode: parts[2],
    sequence: parts[3]
  }
}

/**
 * 안전한 랜덤 문자열 생성
 */
export const generateSecureRandom = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length)
    result += chars[randomIndex]
  }
  
  return result
}

/**
 * 가입 코드 생성
 * 형식: {병원코드}-{년월}-{랜덤문자열}
 * 예시: OB-SEOUL-CLINIC-001-202401-A7B9X2K5
 */
export const generateInviteCode = (hospitalCode: string): string => {
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`
  const randomString = generateSecureRandom(8)
  
  return `${hospitalCode}-${yearMonth}-${randomString}`
}

/**
 * 가입 코드 유효성 검증
 */
export const validateInviteCodeFormat = (code: string): boolean => {
  // 형식: {병원코드}-{년월}-{랜덤문자열}
  const pattern = /^OB-[A-Z]+-(?:CLINIC|ORIENTAL|HOSPITAL)-\d{3}-\d{6}-[A-Z0-9]{8}$/
  return pattern.test(code)
}

/**
 * 가입 코드에서 병원 코드 추출
 */
export const extractHospitalCodeFromInvite = (inviteCode: string): string | null => {
  if (!validateInviteCodeFormat(inviteCode)) {
    return null
  }
  
  // 마지막 두 부분(-년월-랜덤문자열)을 제거하여 병원 코드 추출
  const parts = inviteCode.split('-')
  if (parts.length >= 6) {
    return parts.slice(0, 4).join('-')
  }
  
  return null
}

/**
 * 코드 중복 확인 (실제로는 데이터베이스 조회)
 */
export const checkHospitalCodeExists = async (code: string): Promise<boolean> => {
  // TODO: 실제 구현에서는 데이터베이스에서 코드 존재 여부 확인
  return false
}

/**
 * 대안 코드 생성 (중복 시)
 */
export const generateAlternativeCode = async (originalCode: string): Promise<string> => {
  const parsed = parseHospitalCode(originalCode)
  if (!parsed) {
    throw new Error(HospitalCodeError.INVALID_HOSPITAL_INFO)
  }
  
  // 순번을 증가시켜 대안 코드 생성
  let sequence = parseInt(parsed.sequence)
  let attempts = 0
  const maxAttempts = 100
  
  while (attempts < maxAttempts) {
    sequence++
    const newCode = `${parsed.prefix}-${parsed.regionCode}-${parsed.typeCode}-${sequence.toString().padStart(3, '0')}`
    
    const exists = await checkHospitalCodeExists(newCode)
    if (!exists) {
      return newCode
    }
    
    attempts++
  }
  
  throw new Error(HospitalCodeError.DUPLICATE_CODE)
}

/**
 * 고유한 병원 코드 보장
 */
export const ensureUniqueHospitalCode = async (
  hospitalName: string,
  hospitalType: HospitalType,
  region: string
): Promise<string> => {
  const code = await generateHospitalCode(hospitalName, hospitalType, region)
  const exists = await checkHospitalCodeExists(code)
  
  if (exists) {
    return await generateAlternativeCode(code)
  }
  
  return code
}