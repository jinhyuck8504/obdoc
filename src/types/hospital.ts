/**
 * 병원 코드 시스템 관련 타입 정의
 */

// 병원 유형
export type HospitalType = 'clinic' | 'oriental_clinic' | 'hospital'

// 지역 코드
export type RegionCode = 'SEOUL' | 'BUSAN' | 'DAEGU' | 'INCHEON' | 'GWANGJU' | 'DAEJEON' | 'ULSAN' | 'SEJONG' | 'GYEONGGI' | 'GANGWON' | 'CHUNGBUK' | 'CHUNGNAM' | 'JEONBUK' | 'JEONNAM' | 'GYEONGBUK' | 'GYEONGNAM' | 'JEJU'

// 병원 정보
export interface HospitalData {
  hospitalCode: string // 고유 병원 코드 (예: OB-SEOUL-CLINIC-001)
  hospitalName: string
  hospitalType: HospitalType
  region: string
  address?: string
  phoneNumber?: string
  registrationNumber?: string // 사업자등록번호
  medicalLicenseNumber?: string // 의료기관 허가번호
  createdAt: Date
  isActive: boolean
}

// 가입 코드 정보
export interface InviteCode {
  id: string
  code: string // 암호화된 가입 코드
  hospitalCode: string
  createdBy: string // 생성한 의사 ID
  createdAt: Date
  expiresAt: Date
  maxUses?: number // 최대 사용 횟수
  currentUses: number // 현재 사용 횟수
  isActive: boolean
  usageHistory: InviteCodeUsage[]
}

// 가입 코드 사용 내역
export interface InviteCodeUsage {
  id: string
  inviteCodeId: string
  customerId: string
  usedAt: Date
  ipAddress: string
  userAgent: string
}

// 병원 코드 생성 요청
export interface HospitalCodeGenerationRequest {
  hospitalName: string
  hospitalType: HospitalType
  region: string
  address?: string
  phoneNumber?: string
  registrationNumber?: string
  medicalLicenseNumber?: string
}

// 가입 코드 생성 요청
export interface InviteCodeGenerationRequest {
  hospitalCode: string
  expiresIn: number // 시간(시)
  maxUses?: number
  description?: string
}

// 가입 코드 검증 결과
export interface InviteCodeValidationResult {
  isValid: boolean
  hospitalInfo?: HospitalData
  codeInfo?: {
    id: string
    expiresAt: Date
    remainingUses: number | null
    createdBy: string
  }
  error?: string
  errorCode?: InviteCodeError
}

// 실시간 형식 검증 결과
export interface InviteCodeFormatValidation {
  isValid: boolean
  errors: string[]
  suggestions: string[]
}

// 가입 코드 보안 강도 검증 결과
export interface InviteCodeSecurityCheck {
  strength: 'weak' | 'medium' | 'strong'
  score: number
  issues: string[]
  recommendations: string[]
}

// 가입 코드 에러 타입
export enum InviteCodeError {
  INVALID_FORMAT = 'INVITE_CODE_INVALID_FORMAT',
  NOT_FOUND = 'INVITE_CODE_NOT_FOUND',
  EXPIRED = 'INVITE_CODE_EXPIRED',
  MAX_USES_EXCEEDED = 'INVITE_CODE_MAX_USES_EXCEEDED',
  HOSPITAL_INACTIVE = 'INVITE_CODE_HOSPITAL_INACTIVE',
  ALREADY_USED = 'INVITE_CODE_ALREADY_USED',
  RATE_LIMIT_EXCEEDED = 'INVITE_CODE_RATE_LIMIT_EXCEEDED',
  SYSTEM_ERROR = 'INVITE_CODE_SYSTEM_ERROR'
}

// 병원 코드 에러 타입
export enum HospitalCodeError {
  GENERATION_FAILED = 'HOSPITAL_CODE_GENERATION_FAILED',
  DUPLICATE_CODE = 'HOSPITAL_CODE_DUPLICATE',
  INVALID_HOSPITAL_INFO = 'HOSPITAL_CODE_INVALID_INFO',
  RATE_LIMIT_EXCEEDED = 'HOSPITAL_CODE_RATE_LIMIT'
}

// 감사 로그
export interface AuditLog {
  id: string
  action: 'signup' | 'code_generation' | 'code_usage' | 'admin_access' | 'code_validation'
  userId: string
  hospitalCode?: string
  inviteCode?: string
  ipAddress: string
  userAgent: string
  timestamp: Date
  details: Record<string, any>
  success: boolean
}

// 보안 알림
export interface SecurityAlert {
  id: string
  type: 'MULTIPLE_FAILED_CODES' | 'RAPID_SIGNUP_ATTEMPTS' | 'SUSPICIOUS_IP' | 'UNUSUAL_PATTERN'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  hospitalCode?: string
  userId?: string
  details: Record<string, any>
  timestamp: Date
  resolved: boolean
}

// 가입 통계
export interface SignupMetrics {
  totalSignups: number
  doctorSignups: number
  customerSignups: number
  signupsByHospital: Record<string, number>
  inviteCodeUsageRate: number
  averageTimeToSignup: number
  failedSignupAttempts: number
  period: {
    start: Date
    end: Date
  }
}

// 보안 메트릭
export interface SecurityMetrics {
  suspiciousSignupAttempts: number
  invalidCodeAttempts: number
  rateLimitViolations: number
  unusualSignupPatterns: SecurityAlert[]
  period: {
    start: Date
    end: Date
  }
}