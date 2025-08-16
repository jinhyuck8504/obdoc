/**
 * 의료진용 고객 관리 시스템 타입 정의
 */

export interface CustomerInfo {
  id: string
  email: string
  name: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  joinedAt: Date
  lastActiveAt?: Date
  status: 'active' | 'inactive' | 'suspended'
  
  // 가입 경로 정보
  inviteCode: string
  inviteCodeUsedAt: Date
  referredBy?: string
  
  // 병원 연결 정보
  hospitalCode: string
  hospitalName: string
  doctorId: string
  doctorName: string
  
  // 서비스 이용 현황
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  lastAppointmentDate?: Date
  nextAppointmentDate?: Date
  
  // 활동 지표
  loginCount: number
  lastLoginAt?: Date
  averageSessionDuration: number // 분 단위
  
  // 개인정보 보호 관련
  consentStatus: {
    dataProcessing: boolean
    marketing: boolean
    thirdParty: boolean
    consentDate: Date
  }
  
  // 알림 및 조치
  flaggedActivities: FlaggedActivity[]
  notes: CustomerNote[]
}

export interface FlaggedActivity {
  id: string
  customerId: string
  type: 'suspicious_login' | 'multiple_accounts' | 'unusual_behavior' | 'policy_violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  detectedAt: Date
  resolvedAt?: Date
  resolvedBy?: string
  status: 'pending' | 'investigating' | 'resolved' | 'false_positive'
  metadata: Record<string, any>
}

export interface CustomerNote {
  id: string
  customerId: string
  doctorId: string
  doctorName: string
  content: string
  type: 'general' | 'medical' | 'administrative' | 'security'
  isPrivate: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface CustomerActivityLog {
  id: string
  customerId: string
  action: string
  description: string
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  newCustomersThisMonth: number
  averageSessionDuration: number
  topActivities: Array<{
    activity: string
    count: number
    percentage: number
  }>
  joinTrends: Array<{
    date: string
    count: number
  }>
  retentionRate: {
    daily: number
    weekly: number
    monthly: number
  }
}

export interface CustomerFilter {
  status?: CustomerInfo['status'][]
  joinedDateRange?: {
    start: Date
    end: Date
  }
  lastActiveDateRange?: {
    start: Date
    end: Date
  }
  hasFlags?: boolean
  searchTerm?: string
  sortBy?: 'name' | 'joinedAt' | 'lastActiveAt' | 'totalAppointments'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface CustomerManagementPermissions {
  canViewCustomers: boolean
  canViewCustomerDetails: boolean
  canAddNotes: boolean
  canViewMedicalNotes: boolean
  canFlagActivities: boolean
  canResolveFlags: boolean
  canSuspendCustomers: boolean
  canExportData: boolean
  canViewAnalytics: boolean
}

// API 응답 타입
export interface CustomersResponse {
  customers: CustomerInfo[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface CustomerDetailsResponse {
  customer: CustomerInfo
  activityLog: CustomerActivityLog[]
  permissions: CustomerManagementPermissions
}

// 알림 및 액션 타입
export interface CustomerAlert {
  id: string
  customerId: string
  customerName: string
  type: 'new_signup' | 'suspicious_activity' | 'policy_violation' | 'system_alert'
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: Date
  isRead: boolean
  actionRequired: boolean
  metadata?: Record<string, any>
}

export interface CustomerAction {
  type: 'suspend' | 'activate' | 'flag' | 'unflag' | 'add_note' | 'send_message'
  customerId: string
  reason?: string
  metadata?: Record<string, any>
}

// 개인정보 보호 관련
export interface DataExportRequest {
  customerId: string
  requestedBy: string
  requestedAt: Date
  purpose: string
  dataTypes: string[]
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  completedAt?: Date
  downloadUrl?: string
  expiresAt?: Date
}

export interface PrivacySettings {
  dataRetentionPeriod: number // 일 단위
  automaticDataDeletion: boolean
  consentRenewalPeriod: number // 월 단위
  anonymizationAfterDeletion: boolean
  auditLogRetention: number // 년 단위
}