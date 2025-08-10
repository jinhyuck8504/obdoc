// ObDoc Challenge System Constants

import { ChallengeType, DifficultyLevel } from '@/types/challenge'

// 챌린지 기본 설정
export const CHALLENGE_DEFAULTS = {
  DURATION_DAYS: 30,
  MAX_DAILY_RECORDS: 10,
  AI_ANALYSIS_TIMEOUT: 30000, // 30초
  CACHE_DURATION: 3600, // 1시간
  MAX_RETRY_ATTEMPTS: 3
} as const

// 물 섭취 챌린지 설정
export const WATER_INTAKE_CONFIG = {
  DAILY_TARGET: 2000, // ml
  INTERVALS: 8,
  INTERVAL_AMOUNT: 250, // ml
  REMINDER_INTERVALS: [9, 11, 13, 15, 17, 19, 21, 23], // 시간
  MIN_AMOUNT: 50, // ml
  MAX_AMOUNT: 500 // ml
} as const

// 컬러풀 챌린지 설정
export const COLORFUL_DIET_CONFIG = {
  REQUIRED_COLORS: 5,
  COLORS: {
    red: { label: '빨강', examples: ['토마토', '딸기', '사과', '파프리카'] },
    yellow: { label: '노랑', examples: ['바나나', '옥수수', '레몬', '호박'] },
    green: { label: '초록', examples: ['시금치', '브로콜리', '오이', '상추'] },
    purple: { label: '보라', examples: ['가지', '포도', '블루베리', '양배추'] },
    white: { label: '흰색', examples: ['양파', '마늘', '무', '콜리플라워'] }
  },
  BONUS_MULTIPLIER: 1.5 // 무지개 달성 시 보너스
} as const

// DII 분석 챌린지 설정
export const DII_ANALYSIS_CONFIG = {
  TARGET_DII: -2.0, // 목표 DII 점수 (낮을수록 좋음)
  EXCELLENT_THRESHOLD: -3.0,
  GOOD_THRESHOLD: -1.0,
  FAIR_THRESHOLD: 1.0,
  POOR_THRESHOLD: 3.0,
  DAILY_MEALS: ['breakfast', 'lunch', 'dinner', 'snacks'],
  AI_CONFIDENCE_THRESHOLD: 0.7
} as const

// 간헐적 단식 챌린지 설정
export const INTERMITTENT_FASTING_CONFIG = {
  FASTING_HOURS: 16,
  EATING_WINDOW: 8,
  MIN_CONDITION_SCORE: 3, // 1-10 점수에서 최소 허용 점수
  RISK_SYMPTOMS: [
    '심한 어지러움',
    '가슴 두근거림',
    '극심한 피로',
    '집중력 저하',
    '두통',
    '메스꺼움'
  ],
  DAILY_CHECK_REQUIRED: true
} as const

// AI 서비스 설정
export const AI_SERVICE_CONFIG = {
  PROVIDERS: {
    openai: {
      name: 'OpenAI',
      speciality: 'Korean food recognition',
      costPerRequest: 0.002,
      timeout: 10000
    },
    claude: {
      name: 'Claude',
      speciality: 'DII calculation and medical reasoning',
      costPerRequest: 0.003,
      timeout: 15000
    },
    google: {
      name: 'Google AI',
      speciality: 'Cost-effective basic analysis',
      costPerRequest: 0.001,
      timeout: 8000
    }
  },
  FALLBACK_ORDER: ['openai', 'claude', 'google'],
  DAILY_COST_LIMIT: 50.0, // USD
  MONTHLY_COST_LIMIT: 1000.0 // USD
} as const

// 알림 설정
export const NOTIFICATION_CONFIG = {
  REMINDER_TIMES: {
    water_intake: [9, 12, 15, 18, 21], // 시간
    colorful_diet: [12, 18], // 점심, 저녁
    dii_analysis: [20], // 저녁 8시
    intermittent_fasting: [8, 16] // 단식 시작/종료 시간
  },
  RETENTION_DAYS: 30, // 알림 보관 기간
  MAX_UNREAD: 50 // 최대 읽지 않은 알림 수
} as const

// 위험도 평가 기준
export const RISK_ASSESSMENT_CRITERIA = {
  HIGH_RISK_CONDITIONS: [
    '당뇨병',
    '고혈압',
    '심장병',
    '신장병',
    '간질환',
    '섭식장애 병력'
  ],
  HIGH_RISK_MEDICATIONS: [
    '인슐린',
    '혈압약',
    '항응고제',
    '스테로이드'
  ],
  AGE_RISK_THRESHOLDS: {
    YOUNG: 18,
    ELDERLY: 65
  },
  BMI_RISK_THRESHOLDS: {
    UNDERWEIGHT: 18.5,
    OVERWEIGHT: 25,
    OBESE: 30
  }
} as const

// 성취 및 보상 시스템
export const ACHIEVEMENT_CONFIG = {
  MILESTONES: {
    water_intake: [
      { days: 3, name: '첫 걸음', description: '3일 연속 목표 달성' },
      { days: 7, name: '일주일 챔피언', description: '7일 연속 목표 달성' },
      { days: 14, name: '2주 마스터', description: '14일 연속 목표 달성' },
      { days: 30, name: '물 마시기 전문가', description: '30일 완주' }
    ],
    colorful_diet: [
      { days: 5, name: '무지개 초보', description: '5일 연속 5색 달성' },
      { days: 10, name: '컬러 마스터', description: '10일 연속 5색 달성' },
      { days: 21, name: '영양 균형왕', description: '21일 연속 5색 달성' },
      { days: 30, name: '컬러풀 전문가', description: '30일 완주' }
    ]
  },
  BADGES: {
    PERFECT_WEEK: '완벽한 일주일',
    EARLY_BIRD: '얼리버드',
    CONSISTENCY_KING: '꾸준함의 왕',
    IMPROVEMENT_STAR: '개선의 별'
  }
} as const

// 에러 메시지
export const ERROR_MESSAGES = {
  CHALLENGE_NOT_FOUND: '챌린지를 찾을 수 없습니다.',
  ALREADY_PARTICIPATING: '이미 참여 중인 챌린지입니다.',
  DOCTOR_APPROVAL_REQUIRED: '의사의 승인이 필요한 챌린지입니다.',
  HEALTH_RISK_DETECTED: '건강 위험이 감지되었습니다. 의사와 상담하세요.',
  AI_SERVICE_UNAVAILABLE: 'AI 분석 서비스가 일시적으로 사용할 수 없습니다.',
  DAILY_RECORD_EXISTS: '오늘 이미 기록이 존재합니다.',
  INVALID_RECORD_DATA: '올바르지 않은 기록 데이터입니다.',
  INSUFFICIENT_PERMISSIONS: '권한이 부족합니다.',
  CHALLENGE_NOT_ACTIVE: '활성화되지 않은 챌린지입니다.'
} as const

// 성공 메시지
export const SUCCESS_MESSAGES = {
  CHALLENGE_JOINED: '챌린지에 성공적으로 참여했습니다!',
  CHALLENGE_APPROVED: '챌린지가 승인되었습니다!',
  DAILY_RECORD_SAVED: '오늘의 기록이 저장되었습니다!',
  MILESTONE_ACHIEVED: '새로운 성취를 달성했습니다!',
  CHALLENGE_COMPLETED: '챌린지를 완료했습니다! 축하합니다!'
} as const