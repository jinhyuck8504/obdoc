import { z } from 'zod'

// 검증 결과 타입
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
  message?: string
}

// 검증 오류 포맷팅
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {}
  
  error.issues.forEach((err) => {
    const path = err.path.join('.')
    if (!errors[path]) {
      errors[path] = []
    }
    errors[path].push(err.message)
  })
  
  return errors
}

// 스키마 검증 함수
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data)
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: formatValidationErrors(error),
        message: '입력 데이터가 올바르지 않습니다'
      }
    }
    return {
      success: false,
      message: '알 수 없는 검증 오류가 발생했습니다'
    }
  }
}

// 부분 검증 함수 (일부 필드만 검증)
export function validatePartial<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<Partial<T>> {
  try {
    // Zod v3에서는 partial() 메서드가 다르게 작동합니다
    const validatedData = schema.parse(data) as Partial<T>
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: formatValidationErrors(error),
        message: '입력 데이터가 올바르지 않습니다'
      }
    }
    return {
      success: false,
      message: '알 수 없는 검증 오류가 발생했습니다'
    }
  }
}

// 안전한 검증 함수 (오류를 던지지 않음)
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; error?: z.ZodError } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error }
    }
    throw error
  }
}

// 필드별 검증 함수
export function validateField<T>(
  schema: z.ZodSchema<T>,
  fieldName: string,
  value: unknown
): { isValid: boolean; error?: string } {
  try {
    schema.parse(value)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.issues.find((err: z.ZodIssue) => 
        err.path.length === 0 || err.path[0] === fieldName
      )
      return {
        isValid: false,
        error: fieldError?.message || '올바르지 않은 값입니다'
      }
    }
    return {
      isValid: false,
      error: '검증 중 오류가 발생했습니다'
    }
  }
}

// 한국어 오류 메시지 변환
export function translateErrorMessage(message: string): string {
  const translations: Record<string, string> = {
    'Required': '필수 입력 항목입니다',
    'Invalid email': '올바른 이메일 형식이 아닙니다',
    'String must contain at least': '최소',
    'String must contain at most': '최대',
    'characters': '자',
    'Number must be greater than or equal to': '최소값:',
    'Number must be less than or equal to': '최대값:',
    'Invalid': '올바르지 않은',
    'Expected': '예상값:',
    'Received': '입력값:'
  }

  let translatedMessage = message
  Object.entries(translations).forEach(([key, value]) => {
    translatedMessage = translatedMessage.replace(new RegExp(key, 'gi'), value)
  })

  return translatedMessage
}

// 실시간 검증을 위한 디바운스 함수
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 폼 검증 헬퍼
export class FormValidator<T> {
  private schema: z.ZodSchema<T>
  private errors: Record<string, string[]> = {}
  private touched: Record<string, boolean> = {}

  constructor(schema: z.ZodSchema<T>) {
    this.schema = schema
  }

  // 전체 폼 검증
  validateForm(data: unknown): ValidationResult<T> {
    const result = validateSchema(this.schema, data)
    if (!result.success && result.errors) {
      this.errors = result.errors
    } else {
      this.errors = {}
    }
    return result
  }

  // 개별 필드 검증
  validateField(fieldName: string, value: unknown): boolean {
    try {
      // 전체 스키마로 검증 후 해당 필드 오류만 추출
      const testData = { [fieldName]: value }
      this.schema.parse(testData)
      delete this.errors[fieldName]
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.issues
          .filter((err: z.ZodIssue) => err.path.includes(fieldName))
          .map((err: z.ZodIssue) => err.message)
        if (fieldErrors.length > 0) {
          this.errors[fieldName] = fieldErrors
        }
      }
      return false
    }
  }

  // 필드 터치 상태 설정
  setFieldTouched(fieldName: string, touched: boolean = true): void {
    this.touched[fieldName] = touched
  }

  // 필드 오류 가져오기
  getFieldError(fieldName: string): string | undefined {
    if (!this.touched[fieldName]) return undefined
    return this.errors[fieldName]?.[0]
  }

  // 필드가 유효한지 확인
  isFieldValid(fieldName: string): boolean {
    return !this.errors[fieldName] || this.errors[fieldName].length === 0
  }

  // 전체 폼이 유효한지 확인
  isFormValid(): boolean {
    return Object.keys(this.errors).length === 0
  }

  // 모든 오류 가져오기
  getAllErrors(): Record<string, string[]> {
    return this.errors
  }

  // 오류 초기화
  clearErrors(): void {
    this.errors = {}
    this.touched = {}
  }

  // 특정 필드 오류 초기화
  clearFieldError(fieldName: string): void {
    delete this.errors[fieldName]
  }
}

// 커스텀 검증 규칙
export const customValidators = {
  // 한국 주민등록번호 검증 (선택적)
  koreanSSN: (value: string): boolean => {
    const ssnRegex = /^\d{6}-\d{7}$/
    return ssnRegex.test(value)
  },

  // 한국 우편번호 검증
  koreanPostalCode: (value: string): boolean => {
    const postalRegex = /^\d{5}$/
    return postalRegex.test(value)
  },

  // 의료진 면허번호 검증
  medicalLicense: (value: string): boolean => {
    const licenseRegex = /^[A-Z]{2,3}-\d{4}-\d{3,4}$/
    return licenseRegex.test(value)
  },

  // 사업자등록번호 체크섬 검증
  businessNumberChecksum: (value: string): boolean => {
    const numbers = value.replace(/-/g, '')
    if (numbers.length !== 10) return false

    const checkArray = [1, 3, 7, 1, 3, 7, 1, 3, 5]
    let sum = 0

    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * checkArray[i]
    }

    sum += Math.floor((parseInt(numbers[8]) * 5) / 10)
    const remainder = sum % 10
    const checkDigit = remainder === 0 ? 0 : 10 - remainder

    return checkDigit === parseInt(numbers[9])
  },

  // 강력한 비밀번호 검증
  strongPassword: (value: string): boolean => {
    // 최소 8자, 대소문자, 숫자, 특수문자 포함
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    return strongRegex.test(value) && value.length >= 8
  },

  // 나이 검증 (생년월일 기준)
  validAge: (dateOfBirth: string, minAge: number = 0, maxAge: number = 150): boolean => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
      ? age - 1 
      : age

    return actualAge >= minAge && actualAge <= maxAge
  },

  // 미래 날짜 검증
  futureDate: (date: string): boolean => {
    const inputDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return inputDate > today
  },

  // 과거 날짜 검증
  pastDate: (date: string): boolean => {
    const inputDate = new Date(date)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return inputDate < today
  },

  // 영업시간 검증
  businessHours: (time: string): boolean => {
    const [hours, minutes] = time.split(':').map(Number)
    const timeInMinutes = hours * 60 + minutes
    const startTime = 9 * 60 // 09:00
    const endTime = 18 * 60 // 18:00
    return timeInMinutes >= startTime && timeInMinutes <= endTime
  }
}

// 검증 메시지 상수
export const VALIDATION_MESSAGES = {
  REQUIRED: '필수 입력 항목입니다',
  INVALID_EMAIL: '올바른 이메일 형식이 아닙니다',
  INVALID_PHONE: '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)',
  INVALID_BUSINESS_NUMBER: '올바른 사업자등록번호 형식이 아닙니다 (예: 123-45-67890)',
  PASSWORD_TOO_SHORT: '비밀번호는 최소 8자 이상이어야 합니다',
  PASSWORD_MISMATCH: '비밀번호가 일치하지 않습니다',
  INVALID_DATE: '올바른 날짜 형식이 아닙니다',
  INVALID_TIME: '올바른 시간 형식이 아닙니다',
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다',
  TERMS_NOT_AGREED: '이용약관에 동의해주세요',
  PRIVACY_NOT_AGREED: '개인정보처리방침에 동의해주세요'
} as const