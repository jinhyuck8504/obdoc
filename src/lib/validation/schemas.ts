import { z } from 'zod'

// 한국 전화번호 정규식
const KOREAN_PHONE_REGEX = /^01[0-9]-\d{3,4}-\d{4}$/
// 사업자등록번호 정규식 (000-00-00000)
const BUSINESS_NUMBER_REGEX = /^\d{3}-\d{2}-\d{5}$/
// 의료진 면허번호 정규식
const LICENSE_NUMBER_REGEX = /^[A-Z]{2,3}-\d{4}-\d{3,4}$/

// 공통 검증 스키마
export const commonSchemas = {
  // 이메일 검증
  email: z.string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다')
    .max(100, '이메일은 100자 이하로 입력해주세요'),

  // 한국 휴대폰 번호 검증
  phoneNumber: z.string()
    .min(1, '전화번호를 입력해주세요')
    .regex(KOREAN_PHONE_REGEX, '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'),

  // 일반 전화번호 검증 (지역번호 포함)
  generalPhoneNumber: z.string()
    .min(1, '전화번호를 입력해주세요')
    .regex(/^0\d{1,2}-\d{3,4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다 (예: 02-1234-5678, 031-123-4567)'),

  // 사업자등록번호 검증
  businessNumber: z.string()
    .min(1, '사업자등록번호를 입력해주세요')
    .regex(BUSINESS_NUMBER_REGEX, '올바른 사업자등록번호 형식이 아닙니다 (예: 123-45-67890)'),

  // 비밀번호 검증
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .max(50, '비밀번호는 50자 이하로 입력해주세요')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '비밀번호는 영문과 숫자를 포함해야 합니다'),

  // 이름 검증
  name: z.string()
    .min(2, '이름은 최소 2자 이상이어야 합니다')
    .max(20, '이름은 20자 이하로 입력해주세요')
    .regex(/^[가-힣a-zA-Z\s]+$/, '이름은 한글, 영문만 입력 가능합니다'),

  // 주소 검증
  address: z.string()
    .min(5, '주소는 최소 5자 이상이어야 합니다')
    .max(200, '주소는 200자 이하로 입력해주세요'),

  // 날짜 검증
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)'),

  // 시간 검증
  time: z.string()
    .regex(/^\d{2}:\d{2}$/, '올바른 시간 형식이 아닙니다 (HH:MM)'),

  // URL 검증
  url: z.string().url('올바른 URL 형식이 아닙니다').optional(),

  // 금액 검증
  amount: z.number()
    .min(0, '금액은 0 이상이어야 합니다')
    .max(100000000, '금액이 너무 큽니다'),

  // 체중 검증 (kg)
  weight: z.number()
    .min(20, '체중은 20kg 이상이어야 합니다')
    .max(300, '체중은 300kg 이하로 입력해주세요'),

  // 신장 검증 (cm)
  height: z.number()
    .min(100, '신장은 100cm 이상이어야 합니다')
    .max(250, '신장은 250cm 이하로 입력해주세요'),

  // 혈압 검증
  bloodPressure: z.object({
    systolic: z.number().min(50).max(300),
    diastolic: z.number().min(30).max(200)
  })
}

// 사용자 인증 관련 스키마
export const authSchemas = {
  // 로그인
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, '비밀번호를 입력해주세요')
  }),

  // 회원가입 (의사) - 개선된 버전
  doctorSignup: z.object({
    // 기본 계정 정보
    email: commonSchemas.email,
    password: commonSchemas.password,
    confirmPassword: z.string(),
    name: commonSchemas.name,
    
    // 연락처 정보 (개선됨)
    personalPhone: commonSchemas.phoneNumber, // 개인 휴대폰 (필수 - SMS/카톡용)
    hospitalPhone: z.string()
      .min(1, '병원 대표번호를 입력해주세요')
      .regex(/^0\d{1,2}-\d{3,4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다 (예: 02-1234-5678, 031-123-4567)'),
    
    // 병원 정보
    hospitalName: z.string()
      .min(2, '병원명은 최소 2자 이상이어야 합니다')
      .max(50, '병원명은 50자 이하로 입력해주세요'),
    hospitalType: z.enum(['종합병원', '병원', '의원', '치과병원', '치과의원', '한방병원', '한의원', '기타'], {
      message: '병원 유형을 선택해주세요'
    }),
    hospitalAddress: commonSchemas.address,
    businessNumber: commonSchemas.businessNumber,
    
    // 의료진 정보
    licenseNumber: z.string()
      .min(1, '의료진 면허번호를 입력해주세요')
      .regex(LICENSE_NUMBER_REGEX, '올바른 면허번호 형식이 아닙니다 (예: DOC-2024-001)'),
    specialization: z.string()
      .min(2, '전문과목을 입력해주세요')
      .max(30, '전문과목은 30자 이하로 입력해주세요'),
    
    // 구독 정보
    subscriptionPlan: z.enum(['1month', '6months', '12months'], {
      message: '구독 플랜을 선택해주세요'
    }),
    
    // 필수 동의 항목
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: '이용약관에 동의해주세요'
    }),
    agreeToPrivacy: z.boolean().refine(val => val === true, {
      message: '개인정보처리방침에 동의해주세요'
    }),
    agreeToMedicalInfo: z.boolean().refine(val => val === true, {
      message: '의료정보 수집·이용에 동의해주세요'
    }),
    
    // 선택 동의 항목
    agreeToMarketing: z.boolean().default(false), // 마케팅 정보 수신 동의 (선택)
    agreeToSms: z.boolean().default(true), // SMS 알림 수신 동의 (기본 true)
    agreeToEmail: z.boolean().default(true), // 이메일 알림 수신 동의 (기본 true)
    agreeToKakao: z.boolean().default(false), // 카카오톡 알림 수신 동의 (선택)
    
    // 추가 정보 (선택)
    position: z.string()
      .max(30, '직책은 30자 이하로 입력해주세요')
      .optional(), // 원장, 과장, 전문의 등
    experience: z.number()
      .min(0, '경력은 0년 이상이어야 합니다')
      .max(50, '경력은 50년 이하로 입력해주세요')
      .optional(), // 임상 경력 (년)
    introduction: z.string()
      .max(500, '소개는 500자 이하로 입력해주세요')
      .optional() // 의사 소개
  }).refine(data => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword']
  }),

  // 고객 회원가입 - 개선된 버전
  patientSignup: z.object({
    // 기본 계정 정보
    email: commonSchemas.email,
    password: commonSchemas.password,
    confirmPassword: z.string(),
    name: commonSchemas.name,
    
    // 연락처 정보 (필수 - 알림용)
    phone: commonSchemas.phoneNumber, // 휴대폰 번호 (SMS/카톡 알림용)
    
    // 기본 개인정보
    dateOfBirth: commonSchemas.date,
    gender: z.enum(['male', 'female', 'other'], {
      message: '성별을 선택해주세요'
    }),
    
    // 필수 동의 항목
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: '이용약관에 동의해주세요'
    }),
    agreeToPrivacy: z.boolean().refine(val => val === true, {
      message: '개인정보처리방침에 동의해주세요'
    }),
    agreeToMedicalInfo: z.boolean().refine(val => val === true, {
      message: '의료정보 수집·이용에 동의해주세요'
    }),
    
    // 선택 동의 항목
    agreeToMarketing: z.boolean().default(false), // 마케팅 정보 수신 동의 (선택)
    agreeToSms: z.boolean().default(true), // SMS 알림 수신 동의 (기본 true - 예약 알림용)
    agreeToEmail: z.boolean().default(true), // 이메일 알림 수신 동의 (기본 true)
    agreeToKakao: z.boolean().default(false), // 카카오톡 알림 수신 동의 (선택)
    agreeToHealthData: z.boolean().default(false), // 건강데이터 활용 동의 (선택)
    
    // 추가 정보 (선택)
    address: commonSchemas.address.optional(), // 주소 (응급상황용)
    emergencyContact: z.object({
      name: commonSchemas.name,
      phone: commonSchemas.phoneNumber,
      relationship: z.string().min(1, '관계를 입력해주세요')
    }).optional(), // 비상연락처
    
    // 건강 정보 (선택)
    height: commonSchemas.height.optional(),
    weight: commonSchemas.weight.optional(),
    bloodType: z.enum(['A', 'B', 'AB', 'O', 'unknown']).optional(),
    allergies: z.array(z.string()).optional(), // 알레르기
    medications: z.array(z.string()).optional(), // 복용 중인 약물
    medicalHistory: z.string().max(1000, '병력은 1000자 이하로 입력해주세요').optional()
  }).refine(data => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword']
  }),

  // 비밀번호 재설정
  passwordReset: z.object({
    email: commonSchemas.email
  }),

  // 비밀번호 변경
  passwordChange: z.object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
    newPassword: commonSchemas.password,
    confirmPassword: z.string()
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: '새 비밀번호가 일치하지 않습니다',
    path: ['confirmPassword']
  })
}

// 고객 관리 관련 스키마
export const patientSchemas = {
  // 고객 등록
  patientRegistration: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    phone: commonSchemas.phoneNumber,
    dateOfBirth: commonSchemas.date,
    gender: z.enum(['male', 'female', 'other']),
    height: commonSchemas.height.optional(),
    weight: commonSchemas.weight.optional(),
    bloodType: z.enum(['A', 'B', 'AB', 'O', 'unknown']).optional(),
    allergies: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    medicalHistory: z.string().max(1000, '병력은 1000자 이하로 입력해주세요').optional(),
    emergencyContact: z.object({
      name: commonSchemas.name,
      phone: commonSchemas.phoneNumber,
      relationship: z.string().min(1, '관계를 입력해주세요')
    }).optional()
  }),

  // 건강 데이터 입력
  healthDataInput: z.object({
    weight: commonSchemas.weight.optional(),
    bloodPressure: commonSchemas.bloodPressure.optional(),
    bloodSugar: z.number().min(50).max(500).optional(),
    heartRate: z.number().min(40).max(200).optional(),
    temperature: z.number().min(35).max(42).optional(),
    notes: z.string().max(500, '메모는 500자 이하로 입력해주세요').optional(),
    recordedAt: commonSchemas.date
  }),

  // 목표 설정
  goalSetting: z.object({
    type: z.enum(['weight_loss', 'weight_gain', 'blood_pressure', 'blood_sugar', 'exercise']),
    targetValue: z.number().min(0),
    currentValue: z.number().min(0),
    targetDate: commonSchemas.date,
    description: z.string().max(200, '목표 설명은 200자 이하로 입력해주세요').optional()
  })
}

// 예약 관리 관련 스키마
export const appointmentSchemas = {
  // 예약 생성
  appointmentCreate: z.object({
    patientId: z.string().min(1, '고객을 선택해주세요'),
    doctorId: z.string().min(1, '의사를 선택해주세요'),
    appointmentDate: commonSchemas.date,
    appointmentTime: commonSchemas.time,
    duration: z.number().min(15).max(180).default(30),
    type: z.enum(['consultation', 'checkup', 'follow_up', 'emergency']),
    notes: z.string().max(500, '메모는 500자 이하로 입력해주세요').optional(),
    symptoms: z.string().max(1000, '증상은 1000자 이하로 입력해주세요').optional()
  }),

  // 예약 업데이트
  appointmentUpdate: z.object({
    appointmentDate: commonSchemas.date.optional(),
    appointmentTime: commonSchemas.time.optional(),
    status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
    notes: z.string().max(500, '메모는 500자 이하로 입력해주세요').optional(),
    diagnosis: z.string().max(1000, '진단은 1000자 이하로 입력해주세요').optional(),
    prescription: z.string().max(1000, '처방은 1000자 이하로 입력해주세요').optional(),
    followUpDate: commonSchemas.date.optional()
  })
}

// 커뮤니티 관련 스키마
export const communitySchemas = {
  // 게시글 작성
  postCreate: z.object({
    title: z.string()
      .min(5, '제목은 최소 5자 이상이어야 합니다')
      .max(100, '제목은 100자 이하로 입력해주세요'),
    content: z.string()
      .min(10, '내용은 최소 10자 이상이어야 합니다')
      .max(5000, '내용은 5000자 이하로 입력해주세요'),
    category: z.enum(['general', 'question', 'experience', 'tip', 'support']),
    tags: z.array(z.string().max(20)).max(5, '태그는 최대 5개까지 가능합니다').optional(),
    isAnonymous: z.boolean().default(false),
    images: z.array(z.string().url()).max(5, '이미지는 최대 5개까지 업로드 가능합니다').optional()
  }),

  // 댓글 작성
  commentCreate: z.object({
    postId: z.string().min(1, '게시글 ID가 필요합니다'),
    content: z.string()
      .min(1, '댓글 내용을 입력해주세요')
      .max(1000, '댓글은 1000자 이하로 입력해주세요'),
    parentCommentId: z.string().optional(),
    isAnonymous: z.boolean().default(false)
  }),

  // 신고
  reportCreate: z.object({
    targetType: z.enum(['post', 'comment']),
    targetId: z.string().min(1, '신고 대상 ID가 필요합니다'),
    reason: z.enum(['spam', 'inappropriate', 'harassment', 'misinformation', 'other']),
    description: z.string()
      .min(10, '신고 사유를 최소 10자 이상 입력해주세요')
      .max(500, '신고 사유는 500자 이하로 입력해주세요')
  })
}

// 관리자 관련 스키마
export const adminSchemas = {
  // 구독 승인
  subscriptionApproval: z.object({
    doctorId: z.string().min(1, '의사 ID가 필요합니다'),
    plan: z.enum(['1month', '6months', '12months']),
    approvalNotes: z.string().max(500, '승인 메모는 500자 이하로 입력해주세요').optional()
  }),

  // 사용자 상태 변경
  userStatusChange: z.object({
    userId: z.string().min(1, '사용자 ID가 필요합니다'),
    status: z.enum(['active', 'inactive', 'suspended']),
    reason: z.string()
      .min(5, '변경 사유를 최소 5자 이상 입력해주세요')
      .max(500, '변경 사유는 500자 이하로 입력해주세요')
  }),

  // 세금계산서 생성
  invoiceCreate: z.object({
    subscriptionId: z.string().min(1, '구독 ID가 필요합니다'),
    businessNumber: commonSchemas.businessNumber,
    businessName: z.string().min(1, '사업자명을 입력해주세요'),
    businessAddress: commonSchemas.address,
    contactPerson: commonSchemas.name,
    contactPhone: commonSchemas.phoneNumber,
    contactEmail: commonSchemas.email,
    baseAmount: commonSchemas.amount,
    vatAmount: commonSchemas.amount,
    totalAmount: commonSchemas.amount,
    dueDate: commonSchemas.date,
    notes: z.string().max(500, '메모는 500자 이하로 입력해주세요').optional()
  }),

  // 결제 확인
  paymentConfirmation: z.object({
    invoiceId: z.string().min(1, '계산서 ID가 필요합니다'),
    amount: commonSchemas.amount,
    paymentMethod: z.enum(['bank_transfer', 'card', 'cash', 'other']),
    paymentDate: commonSchemas.date,
    confirmationNumber: z.string()
      .min(1, '확인번호를 입력해주세요')
      .max(50, '확인번호는 50자 이하로 입력해주세요'),
    notes: z.string().max(500, '메모는 500자 이하로 입력해주세요').optional()
  })
}

// 청구 정보 관련 스키마
export const billingSchemas = {
  // 청구 정보 등록/수정
  billingInfoUpdate: z.object({
    businessNumber: commonSchemas.businessNumber,
    businessName: z.string()
      .min(2, '사업자명은 최소 2자 이상이어야 합니다')
      .max(50, '사업자명은 50자 이하로 입력해주세요'),
    businessAddress: commonSchemas.address,
    businessType: z.enum(['의료업', '의료법인', '개인사업자']),
    businessCategory: z.string()
      .min(2, '업태를 입력해주세요')
      .max(30, '업태는 30자 이하로 입력해주세요'),
    representativeName: commonSchemas.name,
    contactPerson: commonSchemas.name,
    contactPhone: commonSchemas.phoneNumber,
    contactEmail: commonSchemas.email,
    taxInvoiceEmail: commonSchemas.email,
    taxInvoiceMethod: z.enum(['email', 'post', 'fax']),
    bankName: z.string().max(20, '은행명은 20자 이하로 입력해주세요').optional(),
    accountNumber: z.string()
      .regex(/^\d{3,6}-\d{2,3}-\d{6,7}$/, '올바른 계좌번호 형식이 아닙니다')
      .optional(),
    accountHolder: commonSchemas.name.optional()
  })
}

// 검색 및 필터 관련 스키마
export const searchSchemas = {
  // 일반 검색
  search: z.object({
    query: z.string().max(100, '검색어는 100자 이하로 입력해주세요').optional(),
    category: z.string().optional(),
    sortBy: z.enum(['created_at', 'updated_at', 'name', 'date']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20)
  }),

  // 날짜 범위 검색
  dateRangeSearch: z.object({
    startDate: commonSchemas.date.optional(),
    endDate: commonSchemas.date.optional(),
    dateField: z.string().default('created_at')
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate)
    }
    return true
  }, {
    message: '시작일은 종료일보다 이전이어야 합니다',
    path: ['startDate']
  })
}

// 파일 업로드 관련 스키마
export const fileSchemas = {
  // 이미지 업로드
  imageUpload: z.object({
    file: z.instanceof(File)
      .refine(file => file.size <= 5 * 1024 * 1024, '파일 크기는 5MB 이하여야 합니다')
      .refine(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), 
        '지원하는 이미지 형식: JPEG, PNG, WebP'),
    alt: z.string().max(100, '대체 텍스트는 100자 이하로 입력해주세요').optional()
  }),

  // 문서 업로드
  documentUpload: z.object({
    file: z.instanceof(File)
      .refine(file => file.size <= 10 * 1024 * 1024, '파일 크기는 10MB 이하여야 합니다')
      .refine(file => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type), 
        '지원하는 문서 형식: PDF, DOC, DOCX'),
    description: z.string().max(200, '파일 설명은 200자 이하로 입력해주세요').optional()
  })
}

// 설정 관련 스키마
export const settingsSchemas = {
  // 프로필 업데이트
  profileUpdate: z.object({
    name: commonSchemas.name.optional(),
    phone: commonSchemas.phoneNumber.optional(),
    bio: z.string().max(500, '자기소개는 500자 이하로 입력해주세요').optional()
  }),

  // 알림 설정
  notificationSettings: z.object({
    emailNotifications: z.boolean().default(true),
    smsNotifications: z.boolean().default(false),
    pushNotifications: z.boolean().default(true),
    appointmentReminders: z.boolean().default(true),
    communityUpdates: z.boolean().default(true),
    systemUpdates: z.boolean().default(true)
  }),

  // 개인정보 설정
  privacySettings: z.object({
    profileVisibility: z.enum(['public', 'private']).default('private'),
    showEmail: z.boolean().default(false),
    showPhone: z.boolean().default(false),
    allowMessages: z.boolean().default(true)
  })
}

// 모든 스키마를 하나의 객체로 내보내기
export const validationSchemas = {
  common: commonSchemas,
  auth: authSchemas,
  customer: patientSchemas,
  appointment: appointmentSchemas,
  community: communitySchemas,
  admin: adminSchemas,
  billing: billingSchemas,
  search: searchSchemas,
  file: fileSchemas,
  settings: settingsSchemas
}

// 타입 추론을 위한 타입 정의
export type LoginSchema = z.infer<typeof authSchemas.login>
export type DoctorSignupSchema = z.infer<typeof authSchemas.doctorSignup>
export type PatientSignupSchema = z.infer<typeof authSchemas.patientSignup>
export type PatientRegistrationSchema = z.infer<typeof patientSchemas.patientRegistration>
export type AppointmentCreateSchema = z.infer<typeof appointmentSchemas.appointmentCreate>
export type PostCreateSchema = z.infer<typeof communitySchemas.postCreate>
export type CommentCreateSchema = z.infer<typeof communitySchemas.commentCreate>
export type BillingInfoUpdateSchema = z.infer<typeof billingSchemas.billingInfoUpdate>
export type InvoiceCreateSchema = z.infer<typeof adminSchemas.invoiceCreate>
export type PaymentConfirmationSchema = z.infer<typeof adminSchemas.paymentConfirmation>