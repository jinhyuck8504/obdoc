/**
 * 사용자 관련 타입 정의 (병원 코드 시스템 포함)
 */

import { HospitalData } from './hospital'

// 사용자 역할
export type UserRole = 'doctor' | 'customer' | 'admin'

// 기본 사용자 정보
export interface User {
  id: string
  email: string
  role: UserRole
  name?: string
  phone?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  emailVerified: boolean
}

// 기본 폼 데이터
export interface BasicFormData {
  email: string
  password: string
  confirmPassword: string
  name?: string
  phone?: string
}

// 고객 폼 데이터 (병원 코드 시스템 포함)
export interface CustomerFormData extends BasicFormData {
  role: 'customer'
  inviteCode: string // 필수 가입 코드
  hospitalCode?: string // 검증된 병원 코드 (자동 설정)
  invitedBy?: string // 초대한 의사 ID (자동 설정)
}

// 의사 폼 데이터 (병원 코드 시스템 포함)
export interface DoctorFormData extends BasicFormData {
  role: 'doctor'
  hospitalName: string
  hospitalType: 'clinic' | 'oriental_clinic' | 'hospital'
  region: string
  address?: string
  hospitalPhone?: string
  registrationNumber?: string // 사업자등록번호
  medicalLicenseNumber?: string // 의료기관 허가번호
  medicalLicense?: string // 의사 면허번호
  specialization?: string
  yearsOfExperience?: number
}

// 구독 데이터
export interface SubscriptionData {
  planId: '1month' | '6months' | '12months'
  planName: string
  price: number
  originalPrice?: number
  discount?: number
  duration: string
  features: string[]
  paymentMethod?: 'card' | 'bank_transfer'
}

// 완성된 의사 가입 데이터
export interface DoctorCompleteData extends DoctorFormData {
  subscription: SubscriptionData
  hospitalCode: string // 생성된 병원 코드
}

// 확장된 고객 정보 (데이터베이스 저장용)
export interface CustomerProfile extends User {
  role: 'customer'
  hospitalCode: string // 소속 병원 코드
  doctorId: string // 담당 의사 ID
  inviteCodeUsed: string // 사용한 가입 코드
  joinedAt: Date
  // 건강 정보
  height?: number
  weight?: number
  birthDate?: Date
  gender?: 'male' | 'female' | 'other'
  medicalHistory?: string[]
  allergies?: string[]
  medications?: string[]
}

// 확장된 의사 정보 (데이터베이스 저장용)
export interface DoctorProfile extends User {
  role: 'doctor'
  hospitalCode: string // 병원 고유 코드
  hospitalData: HospitalData // 병원 정보
  medicalLicense: string
  specialization?: string
  yearsOfExperience?: number
  // 구독 정보
  subscriptionId?: string
  subscriptionStatus: 'active' | 'inactive' | 'expired' | 'cancelled'
  subscriptionExpiresAt?: Date
  // 통계
  totalCustomers: number
  activeCustomers: number
  totalInviteCodes: number
  activeInviteCodes: number
}

// 관리자 정보
export interface AdminProfile extends User {
  role: 'admin'
  permissions: string[]
  lastLoginAt?: Date
  loginCount: number
}

// 가입 플로우 상태
export interface SignupState {
  currentStep: 'role-selection' | 'customer-form' | 'doctor-basic' | 'doctor-subscription' | 'invite-code-validation'
  selectedRole: UserRole | null
  hospitalCode?: string
  inviteCode?: string
  validatedHospitalInfo?: HospitalData
  formData: {
    basic: Partial<BasicFormData>
    customer: Partial<CustomerFormData>
    doctor: Partial<DoctorFormData>
    subscription: Partial<SubscriptionData>
  }
  isSubmitting: boolean
  error: string | null
  validationErrors: Record<string, string>
}

// 가입 에러 타입
export interface SignupError {
  type: 'validation' | 'network' | 'server' | 'auth' | 'invite_code' | 'hospital_code'
  field?: string
  message: string
  code?: string
}

// 사용자 통계
export interface UserStats {
  totalUsers: number
  totalDoctors: number
  totalCustomers: number
  totalAdmins: number
  activeUsers: number
  newUsersThisMonth: number
  usersByRegion: Record<string, number>
  usersByHospitalType: Record<string, number>
}

// 사용자 활동 로그
export interface UserActivityLog {
  id: string
  userId: string
  action: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: Date
}

// 사용자 세션 정보
export interface UserSession {
  id: string
  userId: string
  token: string
  expiresAt: Date
  ipAddress: string
  userAgent: string
  isActive: boolean
  createdAt: Date
  lastAccessedAt: Date
}