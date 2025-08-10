// 병원 가입 코드 시스템 타입 정의

export interface HospitalCode {
  id: string
  code: string
  doctorId: string
  name?: string
  maxUses?: number
  currentUses: number
  isActive: boolean
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface HospitalCodeUsage {
  id: string
  codeId: string
  customerId: string
  customerName?: string
  customerEmail?: string
  usedAt: string
}

export interface CodeVerificationResult {
  isValid: boolean
  code?: HospitalCode
  error?: CodeVerificationError
}

export type CodeVerificationError = 
  | 'INVALID_FORMAT'
  | 'CODE_NOT_FOUND'
  | 'CODE_INACTIVE'
  | 'CODE_EXPIRED'
  | 'CODE_USAGE_EXCEEDED'

export interface CreateCodeRequest {
  name?: string
  maxUses?: number
  expiresAt?: string
}

export interface CreateCodeResponse {
  id: string
  code: string
  name?: string
  isActive: boolean
  currentUses: number
  createdAt: string
}

export interface CodeListResponse {
  codes: HospitalCode[]
  total: number
}

export interface CodeCustomersResponse {
  customers: Array<{
    id: string
    name: string
    email: string
    usedAt: string
  }>
  total: number
}

export const ERROR_MESSAGES: Record<CodeVerificationError, string> = {
  INVALID_FORMAT: '코드는 영문 3자리 + 숫자 5자리 형식이어야 합니다 (예: ABC12345)',
  CODE_NOT_FOUND: '존재하지 않는 코드입니다. 병원에서 받은 코드를 다시 확인해주세요',
  CODE_INACTIVE: '비활성화된 코드입니다. 병원에 문의해주세요',
  CODE_EXPIRED: '만료된 코드입니다. 병원에서 새로운 코드를 요청해주세요',
  CODE_USAGE_EXCEEDED: '사용 한도를 초과한 코드입니다. 병원에서 새로운 코드를 요청해주세요'
}