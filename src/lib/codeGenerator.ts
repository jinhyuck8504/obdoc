// 병원 가입 코드 생성 유틸리티

/**
 * 8자리 영숫자 병원 가입 코드 생성
 * 형식: ABC12345 (영문 3자리 + 숫자 5자리)
 */
export function generateHospitalCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  
  let code = ''
  
  // 첫 3자리는 영문 대문자
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  
  // 나머지 5자리는 숫자
  for (let i = 0; i < 5; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  return code
}

/**
 * 병원 코드 형식 검증
 * @param code 검증할 코드
 * @returns 형식이 올바른지 여부
 */
export function validateCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false
  }
  
  // 정확히 8자리, 첫 3자리는 영문 대문자, 나머지 5자리는 숫자
  return /^[A-Z]{3}[0-9]{5}$/.test(code)
}

/**
 * 코드 형식을 표준화 (대문자 변환, 공백 제거)
 * @param code 입력된 코드
 * @returns 표준화된 코드
 */
export function normalizeCode(code: string): string {
  if (!code || typeof code !== 'string') {
    return ''
  }
  
  return code.trim().toUpperCase()
}

/**
 * 중복되지 않는 코드 생성 (데이터베이스 체크 포함)
 * @param checkExistence 코드 존재 여부 확인 함수
 * @param maxAttempts 최대 시도 횟수
 * @returns 고유한 코드
 */
export async function generateUniqueCode(
  checkExistence: (code: string) => Promise<boolean>,
  maxAttempts: number = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateHospitalCode()
    const exists = await checkExistence(code)
    
    if (!exists) {
      return code
    }
  }
  
  throw new Error('고유한 코드 생성에 실패했습니다. 다시 시도해주세요.')
}