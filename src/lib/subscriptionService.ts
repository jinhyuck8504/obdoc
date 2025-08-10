import { supabase } from './supabase'
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
    if (isDevelopment && isDummySupabase) {
      console.log('개발 모드: 더미 구독 데이터 사용', filters)
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

    try {
      let query = supabase
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
        .order('created_at', { ascending: false })

      // 필터 적용
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters?.plan && filters.plan !== 'all') {
        query = query.eq('plan_type', filters.plan)
      }

      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        query = query.eq('payment_status', filters.paymentStatus)
      }

      if (filters?.hospitalType) {
        query = query.eq('doctors.hospital_type', filters.hospitalType)
      }

      const { data, error } = await query
      if (error) {
        console.error('Supabase 쿼리 오류:', error)
        throw error
      }

      if (!data) {
        console.log('구독 데이터가 없습니다.')
        return []
      }

      console.log('Supabase에서 가져온 구독 데이터:', data.length, '개')

      const mappedData = data.map((sub: any) => {
        const subscription: Subscription = {
          id: sub.id,
          doctorId: sub.doctor_id,
          doctorName: sub.doctors?.users?.email?.split('@')[0] || '의사',
          hospitalName: sub.doctors?.hospital_name || '알 수 없음',
          hospitalType: sub.doctors?.hospital_type || '기타',
          email: sub.doctors?.users?.email || '',
          plan: sub.plan_type as '1month' | '6months' | '12months',
          status: sub.status || 'pending',
          paymentStatus: sub.payment_status || 'pending',
          amount: Number(sub.amount) || 0,
          startDate: sub.start_date,
          endDate: sub.end_date,
          createdAt: sub.created_at,
          updatedAt: sub.updated_at,
          approvedBy: sub.approved_by,
          approvedAt: sub.approved_at,
          notes: sub.notes
        }
        return subscription
      })

      // 클라이언트 사이드 필터링 (검색)
      let filtered = mappedData
      if (filters?.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter(sub =>
          sub.doctorName.toLowerCase().includes(search) ||
          sub.hospitalName.toLowerCase().includes(search) ||
          sub.email.toLowerCase().includes(search)
        )
      }

      return filtered
    } catch (error) {
      console.error('구독 목록 조회 실패:', error)
      // 에러 발생 시 더미 데이터 반환 (fallback)
      console.log('에러 발생으로 더미 데이터 사용')
      return dummySubscriptions
    }
  },

  // 구독 승인/거절
  async approveSubscription(approvalData: ApprovalData): Promise<Subscription> {
    if (isDevelopment && isDummySupabase) {
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

      console.log('개발 모드: 구독 처리 완료', dummySubscriptions[index])
      return dummySubscriptions[index]
    }

    try {
      const updateData: any = {
        status: approvalData.action === 'approve' ? 'active' : 'cancelled',
        approved_by: approvalData.approvedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: approvalData.notes
      }

      if (approvalData.action === 'approve') {
        updateData.payment_status = 'paid'
        updateData.start_date = approvalData.startDate
        updateData.end_date = approvalData.endDate
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', approvalData.subscriptionId)
        .select(`
          *,
          doctors(
            hospital_name,
            hospital_type,
            users(email)
          )
        `)
        .single()

      if (error) throw error

      return {
        id: data.id,
        doctorId: data.doctor_id,
        doctorName: '의사', // name 필드가 없으므로 기본값 사용
        hospitalName: data.doctors?.hospital_name || '알 수 없음',
        hospitalType: data.doctors?.hospital_type || '기타',
        email: data.doctors?.users?.email || '',
        plan: data.plan,
        status: data.status,
        paymentStatus: data.payment_status,
        amount: data.amount,
        startDate: data.start_date,
        endDate: data.end_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        approvedBy: data.approved_by,
        approvedAt: data.approved_at,
        notes: data.notes
      }
    } catch (error) {
      console.error('구독 승인/거절 실패:', error)
      throw error
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
    if (isDevelopment && isDummySupabase) {
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

    // 실제 데이터베이스 통계 조회
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan_type, amount, payment_status, end_date')

      if (error) throw error

      const subscriptions = data || []
      const total = subscriptions.length
      const active = subscriptions.filter((s: any) => s.status === 'active').length
      const pending = subscriptions.filter((s: any) => s.status === 'pending').length
      const expired = subscriptions.filter((s: any) => s.status === 'expired').length
      const cancelled = subscriptions.filter((s: any) => s.status === 'cancelled').length

      const totalRevenue = subscriptions
        .filter((s: any) => s.payment_status === 'paid')
        .reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0)

      // 플랜별 분포 계산
      const planDistribution = ['1month', '6months', '12months'].map(plan => {
        const planSubs = subscriptions.filter((s: any) => s.plan_type === plan)
        const planRevenue = planSubs
          .filter((s: any) => s.payment_status === 'paid')
          .reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0)

        return {
          plan: plan as '1month' | '6months' | '12months',
          count: planSubs.length,
          revenue: planRevenue,
          percentage: total > 0 ? (planSubs.length / total) * 100 : 0
        }
      })

      // 이번 달 만료 예정 구독 계산
      const now = new Date()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const expiringThisMonth = subscriptions.filter((s: any) => {
        if (!s.end_date || s.status !== 'active') return false
        const endDate = new Date(s.end_date)
        return endDate >= now && endDate <= endOfMonth
      }).length

      return {
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
    } catch (error) {
      console.error('구독 통계 조회 실패:', error)
      // 에러 발생 시 기본값 반환
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        pendingSubscriptions: 0,
        expiredSubscriptions: 0,
        cancelledSubscriptions: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        planDistribution: [
          { plan: '1month', count: 0, revenue: 0, percentage: 0 },
          { plan: '6months', count: 0, revenue: 0, percentage: 0 },
          { plan: '12months', count: 0, revenue: 0, percentage: 0 }
        ],
        expiringThisMonth: 0,
        renewalRate: 0
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
        approvedBy: sub.approved_by,
        approvedAt: sub.approved_at,
        notes: sub.notes
      })) || []
    } catch (error) {
      console.error('만료 예정 구독 조회 실패:', error)
      throw error
    }
  }
}