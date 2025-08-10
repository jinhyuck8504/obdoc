// ObDoc Challenge System Type Definitions

export interface Challenge {
  id: string
  name: string
  type: ChallengeType
  description: string
  durationDays: number
  requiresDoctorApproval: boolean
  difficultyLevel: DifficultyLevel
  targetMetrics: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ChallengeType = 
  | 'water_intake'        // 물 2L 마시기
  | 'colorful_diet'       // 컬러풀 챌린지
  | 'dii_analysis'        // DII 기반 식습관 분석
  | 'intermittent_fasting' // 간헐적 단식

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export type ChallengeStatus = 
  | 'pending'    // 승인 대기
  | 'approved'   // 승인됨
  | 'active'     // 진행 중
  | 'completed'  // 완료
  | 'cancelled'  // 취소
  | 'failed'     // 실패

export interface CustomerChallenge {
  id: string
  customerId: string
  challengeId: string
  doctorId: string
  status: ChallengeStatus
  startDate: string
  endDate: string
  targetValue: number
  currentProgress: number
  completionRate: number
  healthChecklist: HealthChecklist
  doctorNotes?: string
  approvedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  
  // 관계 데이터
  challenge?: Challenge
  customer?: any // Customer 타입은 기존 시스템에서 가져옴
  doctor?: any   // Doctor 타입은 기존 시스템에서 가져옴
}

export interface DailyRecord {
  id: string
  customerChallengeId: string
  recordDate: string
  recordType: RecordType
  recordData: Record<string, any>
  aiAnalysis?: AIAnalysis
  progressValue: number
  notes?: string
  createdAt: string
}

export type RecordType = 
  | 'water_intake'     // 물 섭취 기록
  | 'food_log'         // 식사 기록
  | 'color_checklist'  // 색깔 체크리스트
  | 'fasting_status'   // 단식 상태

export interface AIAnalysis {
  provider: AIProvider
  analysisType: AIAnalysisType
  result: Record<string, any>
  confidence: number
  processingTime: number
  cost: number
}

export type AIProvider = 'openai' | 'claude' | 'google'

export type AIAnalysisType = 
  | 'food_recognition'  // 음식 인식
  | 'dii_calculation'   // DII 점수 계산
  | 'health_assessment' // 건강 상태 평가
  | 'risk_detection'    // 위험 신호 감지

export interface HealthChecklist {
  age: number
  weight: number
  height: number
  medicalConditions: string[]
  medications: string[]
  allergies: string[]
  exerciseLevel: 'low' | 'medium' | 'high'
  dietaryRestrictions: string[]
  previousChallengeExperience: boolean
  additionalNotes?: string
}

export interface ChallengeNotification {
  id: string
  recipientId: string
  recipientType: 'customer' | 'doctor'
  notificationType: NotificationType
  title: string
  message: string
  relatedChallengeId?: string
  isRead: boolean
  priority: NotificationPriority
  createdAt: string
}

export type NotificationType = 
  | 'approval_request'  // 승인 요청
  | 'risk_alert'        // 위험 알림
  | 'progress_update'   // 진행 상황 업데이트
  | 'completion'        // 완료
  | 'reminder'          // 리마인더

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

// 챌린지별 특화 데이터 타입들
export interface WaterIntakeRecord {
  amount: number // ml
  time: string
  totalDaily: number
  remainingTarget: number
}

export interface ColorfulDietRecord {
  colors: {
    red: string[]
    yellow: string[]
    green: string[]
    purple: string[]
    white: string[]
  }
  completedColors: number
  isRainbowAchieved: boolean
}

export interface DIIAnalysisRecord {
  meals: {
    breakfast?: FoodItem[]
    lunch?: FoodItem[]
    dinner?: FoodItem[]
    snacks?: FoodItem[]
  }
  dailyDII: number
  targetDII: number
  recommendations: string[]
}

export interface FastingStatusRecord {
  fastingStartTime: string
  fastingEndTime: string
  fastingDuration: number // hours
  conditionScore: number // 1-10
  symptoms: string[]
  notes?: string
}

export interface FoodItem {
  name: string
  amount: number
  unit: string
  calories?: number
  diiScore?: number
  nutrients?: Record<string, number>
}

// API 응답 타입들
export interface ChallengeProgress {
  customerChallengeId: string
  currentProgress: number
  completionRate: number
  dailyRecords: DailyRecord[]
  weeklyTrend: number[]
  achievements: Achievement[]
  nextMilestone?: Milestone
}

export interface Achievement {
  id: string
  name: string
  description: string
  iconUrl: string
  unlockedAt: string
}

export interface Milestone {
  target: number
  description: string
  reward?: string
}

// 폼 데이터 타입들
export interface ChallengeJoinRequest {
  challengeId: string
  healthChecklist: HealthChecklist
}

export interface DailyRecordSubmission {
  customerChallengeId: string
  recordType: RecordType
  recordData: Record<string, any>
  notes?: string
}

export interface ChallengeApprovalRequest {
  customerChallengeId: string
  approved: boolean
  doctorNotes?: string
}

// 챌린지 상수들
export const CHALLENGE_TYPES: { value: ChallengeType; label: string; icon: string; color: string }[] = [
  { value: 'water_intake', label: '물 2L 마시기', icon: '💧', color: 'bg-blue-100 text-blue-800' },
  { value: 'colorful_diet', label: '컬러풀 챌린지', icon: '🌈', color: 'bg-green-100 text-green-800' },
  { value: 'dii_analysis', label: 'DII 식습관 분석', icon: '🧠', color: 'bg-purple-100 text-purple-800' },
  { value: 'intermittent_fasting', label: '간헐적 단식', icon: '⏰', color: 'bg-orange-100 text-orange-800' }
]

export const DIFFICULTY_LEVELS: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: 'easy', label: '쉬움', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: '보통', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'hard', label: '어려움', color: 'bg-red-100 text-red-800' }
]

export const CHALLENGE_STATUS_LABELS: { [key in ChallengeStatus]: string } = {
  pending: '승인 대기',
  approved: '승인됨',
  active: '진행 중',
  completed: '완료',
  cancelled: '취소',
  failed: '실패'
}

export const NOTIFICATION_TYPE_LABELS: { [key in NotificationType]: string } = {
  approval_request: '승인 요청',
  risk_alert: '위험 알림',
  progress_update: '진행 상황',
  completion: '완료',
  reminder: '리마인더'
}