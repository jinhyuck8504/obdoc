import { supabase } from './supabase'
import { withDataTimeout, withSaveTimeout, getErrorMessage } from './timeoutUtils'
import {
  Subscription,
  SubscriptionPlan,
  PaymentInfo,
  SubscriptionStats,
  SubscriptionFilters,
  ApprovalData
} from '@/types/subscription'

// 개발 환경 체크
const isDevelopment = process.env.NODE_ENV === 'development'
const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy-project') ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase_url_here')

// 구독 플랜 정의
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: '1month',
    name: '1개월 플랜',
    duration: 1,
    price: 199000,
    features: [
      '고객 관리 시스템',
      '예약 관리',
      '커뮤니티 접근',
      '기본 통계',
      '이메일 지원'
    ],
    description: '단기간 체험용으로 적합한 플랜'
  },
  {
    id: '6months',
    name: '6개월 플랜',
    duration: 6,
    price: 1015000,
    originalPrice: 1194000,
    discount: 15,
    popular: true,
    features: [
      '고객 관리 시스템',
      '예약 관리',
      '커뮤니티 접근',
      '고급 통계 및 분석',
      '우선 지원',
      '데이터 백업'
    ],
    description: '가장 인기 있는 플랜으로 15% 할인 혜택'
  },
  {
    id: '12months',
    name: '12개월 플랜',
    duration: 12,
    price: 1791000,
    originalPrice: 2388000,
    discount: 25,
    features: [
      '고객 관리 시스템',
      '예약 관리',
      '커뮤니티 접근',
      '프리미엄 통계 및 분석',
      '24/7 전화 지원',
      '데이터 백업',
      '맞춤형 리포트',
      'API 접근'
    ],
    description: '최대 할인 혜택과 모든 프리미엄 기능 포함'
  }
]

// 더미 구독 데이터
const dummySubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    doctorId: 'dummy-1',
    doctorName: '김의사',
    hospitalName: '서울대학교병원',
    hospitalType: '종합병원',
    email: 'doctor1@hospital.com',
    plan: '12months',
    status: 'pending',
    paymentStatus: 'pending',
    amount: 799000,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    notes: '은행 송금으로 결제 예정'
  },
  {
    id: 'sub-2',
    doctorId: 'dummy-2',
    doctorName: '이의사',
    hospitalName: '강남세브란스병원',
    hospitalType: '종합병원',
    email: 'doctor2@hospital.com',
    plan: '6months',
    status: 'active',
    paymentStatus: 'paid',
    amount: 528000,
    startDate: '2024-01-01',
    endDate: '2024-07-01',
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2024-01-01T14:30:00Z',
    approvedBy: 'admin-1',
    approvedAt: '2024-01-01T14:30:00Z'
  },
  {
    id: 'sub-3',
    doctorId: 'dummy-3',
    doctorName: '박의사',
    hospitalName: '삼성서울병원',
    hospitalType: '종합병원',
    email: 'doctor3@samsung.com',
    plan: '1month',
    status: 'pending',
    paymentStatus: 'pending',
    amount: 110000,
    createdAt: '2024-01-20T15:45:00Z',
    updatedAt: '2024-01-20T15:45:00Z'
  },
  {
    id: 'sub-4',
    doctorId: 'dummy-4',
    doctorName: '최의사',
    hospitalName: '김내과의원',
    hospitalType: '내과',
    email: 'kim@clinic.com',
    plan: '6months',
    status: 'expired',
    paymentStatus: 'paid',
    amount: 528000,
    startDate: '2023-07-01',
    endDate: '2024-01-01',
    createdAt: '2023-07-01T10:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    approvedBy: 'admin-1',
    approvedAt: '2023-07-01T11:00:00Z'
  }
]

// 더미 결제 정보
const dummyPayments: PaymentInfo[] = [
  {
    id: 'pay-1',
    subscriptionId: 'sub-1',
    method: 'bank_transfer',
    amount: 799000,
    status: 'pending',
    bankName: '국민은행',
    accountNumber: '123-456-789',
    depositorName: '김의사',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'pay-2',
    subscriptionId: 'sub-2',
    method: 'bank_transfer',
    amount: 528000,
    status: 'completed',
    bankName: '신한은행',
    accountNumber: '987-654-321',
    depositorName: '이의사',
    paymentDate: '2024-01-01T13:00:00Z',
    confirmationDate: '2024-01-01T14:30:00Z',
    confirmedBy: 'admin-1',
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2024-01-01T14:30:00Z'
  }
]

export const subscriptionService = {
  // 구독 플랜 조회
  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS
  },

  // 구독 목록 조회
  async getSubscriptions(filters?: SubscriptionFilters): Promise<Subscription[]> {
    try {
      console.log('🔍 구독 목록 조회 시작...', filters)

      // doctors 테이블에서 구독 정보와 함께 조회
      let query = supabase
        .from('doctors')
        .select(`
          id,
          hospital_name,
          hospital_type,
          subscription_status,
          subscription_plan,
          subscription_start,
          subscription_end,
          created_at,
          updated_at,
          users!inner(
            id,
            email
          ),
          subscriptions(
            id,
            plan_type,
            amount,
            payment_status,
            start_date,
            end_date,
            notes,
            approved_by,
            approved_at,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false })

      // 필터 적용
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('subscription_status', filters.status)
      }

      if (filters?.plan && filters.plan !== 'all') {
        query = query.eq('subscription_plan', filters.plan)
      }

      if (filters?.hospitalType) {
        query = query.eq('hospital_type', filters.hospitalType)
      }

      const { data, error } = await withDataTimeout(query)
      if (error) {
        console.error('❌ Supabase 쿼리 오류:', error)
        throw error
      }

      if (!data || data.length === 0) {
        console.log('📭 구독 데이터가 없습니다.')
        return []
      }

      console.log('📊 Supabase에서 가져온 의사 데이터:', data.length, '개')

      // 데이터 매핑
      const mappedData: Subscription[] = data.map((doctor: any) => {
        // 구독 정보가 있으면 사용, 없으면 의사 테이블의 정보 사용
        const subscription = doctor.subscriptions?.[0]
        
        const mappedSubscription: Subscription = {
          id: subscription?.id || `doctor-${doctor.id}`,
          doctorId: doctor.id,
          doctorName: doctor.users?.email?.split('@')[0] || '의사',
          hospitalName: doctor.hospital_name || '알 수 없음',
          hospitalType: doctor.hospital_type || '기타',
          email: doctor.users?.email || '',
          plan: (subscription?.plan_type || doctor.subscription_plan || '1month') as '1month' | '6months' | '12months',
          status: doctor.subscription_status || 'pending',
          paymentStatus: subscription?.payment_status || 'pending',
          amount: Number(subscription?.amount) || this.getPlanPrice(doctor.subscription_plan || '1month'),
          startDate: subscription?.start_date || doctor.subscription_start,
          endDate: subscription?.end_date || doctor.subscription_end,
          createdAt: subscription?.created_at || doctor.created_at,
          updatedAt: subscription?.updated_at || doctor.updated_at,
          approvedBy: subscription?.approved_by || null,
          approvedAt: subscription?.approved_at || null,
          notes: subscription?.notes
        }
        return mappedSubscription
      })

      // 클라이언트 사이드 필터링
      let filtered = mappedData

      // 결제 상태 필터
      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        filtered = filtered.filter(sub => sub.paymentStatus === filters.paymentStatus)
      }

      // 검색 필터
      if (filters?.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter(sub =>
          sub.doctorName.toLowerCase().includes(search) ||
          sub.hospitalName.toLowerCase().includes(search) ||
          sub.email.toLowerCase().includes(search)
        )
      }

      console.log('✅ 구독 목록 조회 완료:', filtered.length, '개')
      return filtered

    } catch (error) {
      console.error('❌ 구독 목록 조회 실패:', error)
      
      // 에러 발생 시 더미 데이터 반환 (fallback)
      console.log('🔄 에러 발생으로 더미 데이터 사용')
      let filtered = [...dummySubscriptions]

      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter(sub => sub.status === filters.status)
      }

      if (filters?.plan && filters.plan !== 'all') {
        filtered = filtered.filter(sub => sub.plan === filters.plan)
      }

      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        filtered = filtered.filter(sub => sub.paymentStatus === filters.paymentStatus)
      }

      if (filters?.hospitalType) {
        filtered = filtered.filter(sub => sub.hospitalType === filters.hospitalType)
      }

      if (filters?.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter(sub =>
          sub.doctorName.toLowerCase().includes(search) ||
          sub.hospitalName.toLowerCase().includes(search) ||
          sub.email.toLowerCase().includes(search)
        )
      }

      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
  },

  // 플랜 가격 조회 헬퍼 함수
  getPlanPrice(planId: string): number {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
    return plan?.price || 0
  },

  // 구독 승인/거절
  async approveSubscription(approvalData: ApprovalData): Promise<Subscription> {
    try {
      console.log('🔍 구독 승인/거절 처리 시작...', approvalData)

      const now = new Date().toISOString()
      
      // 먼저 해당 구독이 doctors 테이블에서 관리되는지 확인
      const doctorId = approvalData.subscriptionId.startsWith('doctor-') 
        ? approvalData.subscriptionId.replace('doctor-', '')
        : null

      if (doctorId) {
        // doctors 테이블에서 구독 상태 업데이트
        const doctorUpdateData: any = {
          subscription_status: approvalData.action === 'approve' ? 'active' : 'cancelled',
          updated_at: now
        }

        if (approvalData.action === 'approve') {
          doctorUpdateData.subscription_start = approvalData.startDate
          doctorUpdateData.subscription_end = approvalData.endDate
          doctorUpdateData.is_approved = true
        }

        const { data: doctorData, error: doctorError } = await withSaveTimeout(supabase
          .from('doctors')
          .update(doctorUpdateData)
          .eq('id', doctorId)
          .select(`
            id,
            hospital_name,
            hospital_type,
            subscription_status,
            subscription_plan,
            subscription_start,
            subscription_end,
            created_at,
            updated_at,
            users!inner(email)
          `)
          .single())

        if (doctorError) {
          console.error('❌ 의사 테이블 업데이트 실패:', doctorError)
          throw doctorError
        }

        // subscriptions 테이블에도 레코드 생성/업데이트
        const subscriptionData = {
          doctor_id: doctorId,
          plan_type: doctorData.subscription_plan || '1month',
          amount: this.getPlanPrice(doctorData.subscription_plan || '1month'),
          payment_status: approvalData.action === 'approve' ? 'paid' : 'pending',
          start_date: approvalData.startDate,
          end_date: approvalData.endDate,
          notes: approvalData.notes,
          approved_by: approvalData.approvedBy,
          approved_at: approvalData.action === 'approve' ? now : null,
          created_at: now,
          updated_at: now
        }

        // 기존 구독 레코드가 있는지 확인
        const { data: existingSubscription } = await withDataTimeout(supabase
          .from('subscriptions')
          .select('id')
          .eq('doctor_id', doctorId)
          .single())

        if (existingSubscription) {
          // 기존 레코드 업데이트
          await supabase
            .from('subscriptions')
            .update(subscriptionData)
            .eq('id', existingSubscription.id)
        } else {
          // 새 레코드 생성
          await supabase
            .from('subscriptions')
            .insert(subscriptionData)
        }

        console.log('✅ 구독 승인/거절 처리 완료 (doctors 테이블)')

        return {
          id: `doctor-${doctorId}`,
          doctorId: doctorId,
          doctorName: doctorData.users?.email?.split('@')[0] || '의사',
          hospitalName: doctorData.hospital_name || '알 수 없음',
          hospitalType: doctorData.hospital_type || '기타',
          email: doctorData.users?.email || '',
          plan: (doctorData.subscription_plan || '1month') as '1month' | '6months' | '12months',
          status: doctorData.subscription_status || 'pending',
          paymentStatus: approvalData.action === 'approve' ? 'paid' : 'pending',
          amount: this.getPlanPrice(doctorData.subscription_plan || '1month'),
          startDate: doctorData.subscription_start,
          endDate: doctorData.subscription_end,
          createdAt: doctorData.created_at,
          updatedAt: doctorData.updated_at,
          approvedBy: approvalData.approvedBy,
          approvedAt: approvalData.action === 'approve' ? now : undefined,
          notes: approvalData.notes
        }
      } else {
        // subscriptions 테이블에서 직접 업데이트
        const updateData: any = {
          payment_status: approvalData.action === 'approve' ? 'paid' : 'pending',
          approved_by: approvalData.approvedBy,
          approved_at: approvalData.action === 'approve' ? now : null,
          updated_at: now,
          notes: approvalData.notes
        }

        if (approvalData.action === 'approve') {
          updateData.start_date = approvalData.startDate
          updateData.end_date = approvalData.endDate
        }

        const { data, error } = await withSaveTimeout(supabase
          .from('subscriptions')
          .update(updateData)
          .eq('id', approvalData.subscriptionId)
          .select(`
            *,
            doctors!inner(
              hospital_name,
              hospital_type,
              users!inner(email)
            )
          `)
          .single())

        if (error) {
          console.error('❌ 구독 테이블 업데이트 실패:', error)
          throw error
        }

        // doctors 테이블의 상태도 동기화
        await supabase
          .from('doctors')
          .update({
            subscription_status: approvalData.action === 'approve' ? 'active' : 'cancelled',
            subscription_start: approvalData.startDate,
            subscription_end: approvalData.endDate,
            is_approved: approvalData.action === 'approve',
            updated_at: now
          })
          .eq('id', data.doctor_id)

        console.log('✅ 구독 승인/거절 처리 완료 (subscriptions 테이블)')

        return {
          id: data.id,
          doctorId: data.doctor_id,
          doctorName: data.doctors?.users?.email?.split('@')[0] || '의사',
          hospitalName: data.doctors?.hospital_name || '알 수 없음',
          hospitalType: data.doctors?.hospital_type || '기타',
          email: data.doctors?.users?.email || '',
          plan: data.plan_type as '1month' | '6months' | '12months',
          status: approvalData.action === 'approve' ? 'active' : 'cancelled',
          paymentStatus: data.payment_status,
          amount: Number(data.amount) || 0,
          startDate: data.start_date,
          endDate: data.end_date,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          approvedBy: data.approved_by || null,
          approvedAt: data.approved_at || null,
          notes: data.notes
        }
      }
    } catch (error) {
      console.error('❌ 구독 승인/거절 실패:', error)
      
      // 에러 발생 시 더미 데이터로 fallback
      console.log('🔄 에러 발생으로 더미 데이터 처리 사용')
      const index = dummySubscriptions.findIndex(sub => sub.id === approvalData.subscriptionId)
      if (index === -1) {
        throw new Error('구독을 찾을 수 없습니다')
      }

      const now = new Date().toISOString()

      if (approvalData.action === 'approve') {
        const startDate = approvalData.startDate || new Date().toISOString().split('T')[0]
        const endDate = approvalData.endDate || (() => {
          const end = new Date(startDate)
          const plan = dummySubscriptions[index].plan
          switch (plan) {
            case '1month':
              end.setMonth(end.getMonth() + 1)
              break
            case '6months':
              end.setMonth(end.getMonth() + 6)
              break
            case '12months':
              end.setFullYear(end.getFullYear() + 1)
              break
          }
          return end.toISOString().split('T')[0]
        })()

        dummySubscriptions[index] = {
          ...dummySubscriptions[index],
          status: 'active',
          paymentStatus: 'paid',
          startDate,
          endDate,
          approvedBy: approvalData.approvedBy,
          approvedAt: now,
          updatedAt: now,
          notes: approvalData.notes
        }
      } else {
        dummySubscriptions[index] = {
          ...dummySubscriptions[index],
          status: 'cancelled',
          approvedBy: approvalData.approvedBy,
          approvedAt: now,
          updatedAt: now,
          notes: approvalData.notes
        }
      }

      return dummySubscriptions[index]
    }
  },

  // 결제 정보 조회
  async getPaymentInfo(subscriptionId: string): Promise<PaymentInfo | null> {
    if (isDevelopment && isDummySupabase) {
      return dummyPayments.find(pay => pay.subscriptionId === subscriptionId) || null
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .single()

      if (error) throw error

      return {
        id: data.id,
        subscriptionId: data.subscription_id,
        method: data.method,
        amount: data.amount,
        status: data.status,
        transactionId: data.transaction_id,
        bankName: data.bank_name,
        accountNumber: data.account_number,
        depositorName: data.depositor_name,
        paymentDate: data.payment_date,
        confirmationDate: data.confirmation_date,
        confirmedBy: data.confirmed_by,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('결제 정보 조회 실패:', error)
      return null
    }
  },

  // 구독 통계
  async getSubscriptionStats(): Promise<SubscriptionStats> {
    try {
      console.log('🔍 구독 통계 조회 시작...')

      // doctors 테이블에서 구독 상태 조회
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('subscription_status, subscription_plan, subscription_end')

      if (doctorsError) {
        console.error('❌ 의사 데이터 조회 실패:', doctorsError)
        throw doctorsError
      }

      // subscriptions 테이블에서 결제 정보 조회
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('plan_type, amount, payment_status, end_date')

      if (subscriptionsError) {
        console.error('❌ 구독 데이터 조회 실패:', subscriptionsError)
        throw subscriptionsError
      }

      console.log('📊 조회된 데이터:', {
        doctors: doctorsData?.length || 0,
        subscriptions: subscriptionsData?.length || 0
      })

      const doctors = doctorsData || []
      const subscriptions = subscriptionsData || []

      // 의사 테이블 기준 통계 계산
      const total = doctors.length
      const active = doctors.filter((d: any) => d.subscription_status === 'active').length
      const pending = doctors.filter((d: any) => d.subscription_status === 'pending').length
      const expired = doctors.filter((d: any) => d.subscription_status === 'expired').length
      const cancelled = doctors.filter((d: any) => d.subscription_status === 'cancelled').length

      // 수익 계산 (subscriptions 테이블 기준)
      const totalRevenue = subscriptions
        .filter((s: any) => s.payment_status === 'paid')
        .reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0)

      // 플랜별 분포 계산 (의사 테이블 기준)
      const planDistribution = ['1month', '6months', '12months'].map(plan => {
        const planDoctors = doctors.filter((d: any) => d.subscription_plan === plan)
        const planSubscriptions = subscriptions.filter((s: any) => s.plan_type === plan)
        const planRevenue = planSubscriptions
          .filter((s: any) => s.payment_status === 'paid')
          .reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0)

        return {
          plan: plan as '1month' | '6months' | '12months',
          count: planDoctors.length,
          revenue: planRevenue,
          percentage: total > 0 ? (planDoctors.length / total) * 100 : 0
        }
      })

      // 이번 달 만료 예정 구독 계산
      const now = new Date()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const expiringThisMonth = doctors.filter((d: any) => {
        if (!d.subscription_end || d.subscription_status !== 'active') return false
        const endDate = new Date(d.subscription_end)
        return endDate >= now && endDate <= endOfMonth
      }).length

      const stats = {
        totalSubscriptions: total,
        activeSubscriptions: active,
        pendingSubscriptions: pending,
        expiredSubscriptions: expired,
        cancelledSubscriptions: cancelled,
        totalRevenue,
        monthlyRevenue: Math.round(totalRevenue / 12),
        planDistribution,
        expiringThisMonth,
        renewalRate: total > 0 ? (active / total) * 100 : 0
      }

      console.log('✅ 구독 통계 계산 완료:', {
        total: stats.totalSubscriptions,
        active: stats.activeSubscriptions,
        revenue: stats.totalRevenue
      })

      return stats

    } catch (error) {
      console.error('❌ 구독 통계 조회 실패:', error)
      
      // 에러 발생 시 더미 데이터 반환
      console.log('🔄 에러 발생으로 더미 통계 사용')
      const total = dummySubscriptions.length
      const active = dummySubscriptions.filter((s: Subscription) => s.status === 'active').length
      const pending = dummySubscriptions.filter((s: Subscription) => s.status === 'pending').length
      const expired = dummySubscriptions.filter((s: Subscription) => s.status === 'expired').length
      const cancelled = dummySubscriptions.filter((s: Subscription) => s.status === 'cancelled').length

      const totalRevenue = dummySubscriptions
        .filter((s: Subscription) => s.paymentStatus === 'paid')
        .reduce((sum: number, s: Subscription) => sum + s.amount, 0)

      const planCounts = {
        '1month': dummySubscriptions.filter((s: Subscription) => s.plan === '1month').length,
        '6months': dummySubscriptions.filter((s: Subscription) => s.plan === '6months').length,
        '12months': dummySubscriptions.filter((s: Subscription) => s.plan === '12months').length
      }

      const planRevenue = {
        '1month': dummySubscriptions.filter((s: Subscription) => s.plan === '1month' && s.paymentStatus === 'paid').reduce((sum: number, s: Subscription) => sum + s.amount, 0),
        '6months': dummySubscriptions.filter((s: Subscription) => s.plan === '6months' && s.paymentStatus === 'paid').reduce((sum: number, s: Subscription) => sum + s.amount, 0),
        '12months': dummySubscriptions.filter((s: Subscription) => s.plan === '12months' && s.paymentStatus === 'paid').reduce((sum: number, s: Subscription) => sum + s.amount, 0)
      }

      return {
        totalSubscriptions: total,
        activeSubscriptions: active,
        pendingSubscriptions: pending,
        expiredSubscriptions: expired,
        cancelledSubscriptions: cancelled,
        totalRevenue,
        monthlyRevenue: Math.round(totalRevenue / 12),
        planDistribution: [
          {
            plan: '1month',
            count: planCounts['1month'],
            revenue: planRevenue['1month'],
            percentage: total > 0 ? (planCounts['1month'] / total) * 100 : 0
          },
          {
            plan: '6months',
            count: planCounts['6months'],
            revenue: planRevenue['6months'],
            percentage: total > 0 ? (planCounts['6months'] / total) * 100 : 0
          },
          {
            plan: '12months',
            count: planCounts['12months'],
            revenue: planRevenue['12months'],
            percentage: total > 0 ? (planCounts['12months'] / total) * 100 : 0
          }
        ],
        expiringThisMonth: 2,
        renewalRate: 75.5
      }
    }
  },

  // 만료 예정 구독 조회
  async getExpiringSubscriptions(days: number = 30): Promise<Subscription[]> {
    if (isDevelopment && isDummySupabase) {
      const now = new Date()
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

      return dummySubscriptions.filter(sub => {
        if (!sub.endDate || sub.status !== 'active') return false
        const endDate = new Date(sub.endDate)
        return endDate >= now && endDate <= futureDate
      })
    }

    try {
      const now = new Date().toISOString()
      const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          doctors!inner(
            id,
            hospital_name,
            hospital_type,
            users!inner(
              id,
              email
            )
          )
        `)
        .eq('status', 'active')
        .gte('end_date', now)
        .lte('end_date', futureDate)
        .order('end_date', { ascending: true })

      if (error) throw error

      return data?.map((sub: any) => ({
        id: sub.id,
        doctorId: sub.doctor_id,
        doctorName: sub.doctors?.users?.email?.split('@')[0] || '의사',
        hospitalName: sub.doctors?.hospital_name || '알 수 없음',
        hospitalType: sub.doctors?.hospital_type || '기타',
        email: sub.doctors?.users?.email || '',
        plan: sub.plan_type as '1month' | '6months' | '12months',
        status: sub.status,
        paymentStatus: sub.payment_status,
        amount: Number(sub.amount) || 0,
        startDate: sub.start_date,
        endDate: sub.end_date,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at,
        approvedBy: sub.approved_by || null,
        approvedAt: sub.approved_at || null,
        notes: sub.notes
      })) || []
    } catch (error) {
      console.error('만료 예정 구독 조회 실패:', error)
      throw error
    }
  }
}