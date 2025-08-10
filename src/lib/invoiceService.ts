import { supabase } from './supabase'
import { TaxInvoice, BillingInfo, InvoiceTemplate, InvoiceStats, InvoiceFilters, InvoiceAction, PaymentRecord } from '@/types/invoice'

// 개발 환경 체크
const isDevelopment = process.env.NODE_ENV === 'development'
const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy-project') ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase_url_here')

// 더미 세금계산서 데이터
const dummyInvoices: TaxInvoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2024-001',
    subscriptionId: 'sub-001',
    doctorId: 'doctor-1',
    doctorName: '김의사',
    hospitalName: '서울대학교병원',
    businessNumber: '123-45-67890',
    businessAddress: '서울시 종로구 대학로 101',
    contactPerson: '김의사',
    contactPhone: '010-1234-5678',
    contactEmail: 'doctor1@hospital.com',
    issueDate: '2024-01-01',
    dueDate: '2024-01-31',
    paymentDate: '2024-01-15',
    subscriptionPlan: '12months',
    subscriptionPeriod: {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    },
    baseAmount: 1000000,
    vatAmount: 100000,
    totalAmount: 1100000,
    status: 'paid',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    createdBy: 'admin-1',
    notes: '12개월 구독 결제 완료'
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2024-002',
    subscriptionId: 'sub-002',
    doctorId: 'doctor-2',
    doctorName: '이의사',
    hospitalName: '강남세브란스병원',
    businessNumber: '234-56-78901',
    businessAddress: '서울시 강남구 언주로 211',
    contactPerson: '이의사',
    contactPhone: '010-2345-6789',
    contactEmail: 'doctor2@clinic.com',
    issueDate: '2024-01-18',
    dueDate: '2024-02-17',
    subscriptionPlan: '6months',
    subscriptionPeriod: {
      startDate: '2024-01-18',
      endDate: '2024-07-18'
    },
    baseAmount: 600000,
    vatAmount: 60000,
    totalAmount: 660000,
    status: 'issued',
    createdAt: '2024-01-18T11:30:00Z',
    updatedAt: '2024-01-18T11:30:00Z',
    createdBy: 'admin-1',
    notes: '6개월 구독 승인 후 발행'
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2024-003',
    subscriptionId: 'sub-003',
    doctorId: 'doctor-3',
    doctorName: '박의사',
    hospitalName: '삼성서울병원',
    businessNumber: '345-67-89012',
    businessAddress: '서울시 강남구 일원로 81',
    contactPerson: '박의사',
    contactPhone: '010-3456-7890',
    contactEmail: 'doctor3@samsung.com',
    issueDate: '2023-12-15',
    dueDate: '2024-01-14',
    subscriptionPlan: '1month',
    subscriptionPeriod: {
      startDate: '2023-12-15',
      endDate: '2024-01-15'
    },
    baseAmount: 120000,
    vatAmount: 12000,
    totalAmount: 132000,
    status: 'overdue',
    createdAt: '2023-12-15T16:20:00Z',
    updatedAt: '2024-01-16T09:15:00Z',
    createdBy: 'admin-1',
    notes: '1개월 구독 만료, 미결제'
  }
]

// 더미 청구 정보
const dummyBillingInfo: BillingInfo[] = [
  {
    id: 'billing-001',
    doctorId: 'doctor-1',
    businessNumber: '123-45-67890',
    businessName: '서울대학교병원',
    businessAddress: '서울시 종로구 대학로 101',
    businessType: '의료업',
    businessCategory: '종합병원',
    representativeName: '김원장',
    contactPerson: '김의사',
    contactPhone: '010-1234-5678',
    contactEmail: 'doctor1@hospital.com',
    taxInvoiceEmail: 'billing@hospital.com',
    taxInvoiceMethod: 'email',
    bankName: '국민은행',
    accountNumber: '123456-78-901234',
    accountHolder: '김의사',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

// 더미 템플릿
const dummyTemplate: InvoiceTemplate = {
  id: 'template-001',
  name: '기본 세금계산서 템플릿',
  description: 'Obdoc 서비스 기본 세금계산서 템플릿',
  isDefault: true,
  companyInfo: {
    name: '(주)오비닥',
    businessNumber: '000-00-00000',
    address: '서울시 강남구 테헤란로 123',
    phone: '02-1234-5678',
    email: 'billing@obdoc.co.kr',
    representativeName: '대표이사 홍길동'
  },
  headerText: 'Obdoc 의료진 전용 플랫폼 구독 서비스',
  footerText: '감사합니다. 궁금한 사항은 고객센터로 연락주세요.',
  termsAndConditions: '결제 기한: 발행일로부터 30일 이내\n계좌이체 수수료는 고객 부담입니다.',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

export const invoiceService = {
  // 세금계산서 목록 조회
  async getInvoices(filters?: InvoiceFilters): Promise<TaxInvoice[]> {
    if (isDevelopment && isDummySupabase) {
      console.log('개발 모드: 더미 세금계산서 데이터 사용', filters)
      let filtered = [...dummyInvoices]
      
      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter(invoice => invoice.status === filters.status)
      }
      
      if (filters?.plan && filters.plan !== 'all') {
        filtered = filtered.filter(invoice => invoice.subscriptionPlan === filters.plan)
      }
      
      if (filters?.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter(invoice => 
          invoice.doctorName.toLowerCase().includes(search) ||
          invoice.hospitalName.toLowerCase().includes(search) ||
          invoice.invoiceNumber.toLowerCase().includes(search)
        )
      }
      
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    try {
      let query = supabase
        .from('tax_invoices')
        .select(`
          *,
          subscriptions(
            plan,
            start_date,
            end_date
          ),
          doctors(
            name,
            hospital_name,
            business_number
          )
        `)
        .order('created_at', { ascending: false })

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query
      if (error) throw error

      return data?.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        subscriptionId: invoice.subscription_id,
        doctorId: invoice.doctor_id,
        doctorName: invoice.doctors?.name || '',
        hospitalName: invoice.doctors?.hospital_name || '',
        businessNumber: invoice.doctors?.business_number || '',
        businessAddress: invoice.business_address,
        contactPerson: invoice.contact_person,
        contactPhone: invoice.contact_phone,
        contactEmail: invoice.contact_email,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        paymentDate: invoice.payment_date,
        subscriptionPlan: invoice.subscriptions?.plan,
        subscriptionPeriod: {
          startDate: invoice.subscriptions?.start_date,
          endDate: invoice.subscriptions?.end_date
        },
        baseAmount: invoice.base_amount,
        vatAmount: invoice.vat_amount,
        totalAmount: invoice.total_amount,
        status: invoice.status,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        createdBy: invoice.created_by,
        notes: invoice.notes
      })) || []
    } catch (error) {
      console.error('세금계산서 목록 조회 실패:', error)
      throw error
    }
  },

  // 세금계산서 생성
  async createInvoice(subscriptionId: string, adminId: string): Promise<TaxInvoice> {
    if (isDevelopment && isDummySupabase) {
      const newInvoice: TaxInvoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV-2024-${String(dummyInvoices.length + 1).padStart(3, '0')}`,
        subscriptionId,
        doctorId: 'doctor-new',
        doctorName: '신규의사',
        hospitalName: '신규병원',
        businessNumber: '999-99-99999',
        businessAddress: '서울시 강남구 신규로 999',
        contactPerson: '신규의사',
        contactPhone: '010-9999-9999',
        contactEmail: 'new@doctor.com',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subscriptionPlan: '6months',
        subscriptionPeriod: {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        baseAmount: 600000,
        vatAmount: 60000,
        totalAmount: 660000,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: adminId
      }
      
      dummyInvoices.unshift(newInvoice)
      console.log('개발 모드: 세금계산서 생성 완료', newInvoice)
      return newInvoice
    }

    try {
      // 구독 정보 조회
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          doctors(
            name,
            hospital_name,
            business_number,
            business_address,
            contact_phone,
            email
          )
        `)
        .eq('id', subscriptionId)
        .single()

      if (subError) throw subError

      // 금액 계산
      const planPrices = {
        '1month': 199000,
        '6months': 1015000,
        '12months': 1791000
      }
      const baseAmount = planPrices[subscription.plan as keyof typeof planPrices]
      const vatAmount = Math.floor(baseAmount * 0.1)
      const totalAmount = baseAmount + vatAmount

      // 계산서 번호 생성
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

      const invoiceData = {
        invoice_number: invoiceNumber,
        subscription_id: subscriptionId,
        doctor_id: subscription.doctor_id,
        business_address: subscription.doctors?.business_address,
        contact_person: subscription.doctors?.name,
        contact_phone: subscription.doctors?.contact_phone,
        contact_email: subscription.doctors?.email,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        base_amount: baseAmount,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        status: 'draft',
        created_by: adminId
      }

      const { data, error } = await supabase
        .from('tax_invoices')
        .insert(invoiceData)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        invoiceNumber: data.invoice_number,
        subscriptionId: data.subscription_id,
        doctorId: data.doctor_id,
        doctorName: subscription.doctors?.name || '',
        hospitalName: subscription.doctors?.hospital_name || '',
        businessNumber: subscription.doctors?.business_number || '',
        businessAddress: data.business_address,
        contactPerson: data.contact_person,
        contactPhone: data.contact_phone,
        contactEmail: data.contact_email,
        issueDate: data.issue_date,
        dueDate: data.due_date,
        subscriptionPlan: subscription.plan,
        subscriptionPeriod: {
          startDate: subscription.start_date,
          endDate: subscription.end_date
        },
        baseAmount: data.base_amount,
        vatAmount: data.vat_amount,
        totalAmount: data.total_amount,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by
      }
    } catch (error) {
      console.error('세금계산서 생성 실패:', error)
      throw error
    }
  },

  // 세금계산서 발행
  async issueInvoice(invoiceId: string, adminId: string): Promise<TaxInvoice> {
    if (isDevelopment && isDummySupabase) {
      const index = dummyInvoices.findIndex(inv => inv.id === invoiceId)
      if (index === -1) throw new Error('세금계산서를 찾을 수 없습니다')
      
      dummyInvoices[index] = {
        ...dummyInvoices[index],
        status: 'issued',
        updatedAt: new Date().toISOString()
      }
      
      console.log('개발 모드: 세금계산서 발행 완료', dummyInvoices[index])
      return dummyInvoices[index]
    }

    try {
      const { data, error } = await supabase
        .from('tax_invoices')
        .update({
          status: 'issued',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select()
        .single()

      if (error) throw error

      // 액션 로그 저장
      await supabase
        .from('invoice_actions')
        .insert({
          invoice_id: invoiceId,
          admin_id: adminId,
          action: 'issue',
          details: '세금계산서 발행'
        })

      return data as TaxInvoice
    } catch (error) {
      console.error('세금계산서 발행 실패:', error)
      throw error
    }
  },

  // 결제 확인
  async confirmPayment(invoiceId: string, paymentData: Omit<PaymentRecord, 'id' | 'invoiceId'>, adminId: string): Promise<TaxInvoice> {
    if (isDevelopment && isDummySupabase) {
      const index = dummyInvoices.findIndex(inv => inv.id === invoiceId)
      if (index === -1) throw new Error('세금계산서를 찾을 수 없습니다')
      
      dummyInvoices[index] = {
        ...dummyInvoices[index],
        status: 'paid',
        paymentDate: paymentData.paymentDate,
        updatedAt: new Date().toISOString()
      }
      
      console.log('개발 모드: 결제 확인 완료', dummyInvoices[index])
      return dummyInvoices[index]
    }

    try {
      // 결제 기록 저장
      await supabase
        .from('payment_records')
        .insert({
          invoice_id: invoiceId,
          ...paymentData,
          confirmed_by: adminId,
          confirmed_at: new Date().toISOString()
        })

      // 세금계산서 상태 업데이트
      const { data, error } = await supabase
        .from('tax_invoices')
        .update({
          status: 'paid',
          payment_date: paymentData.paymentDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select()
        .single()

      if (error) throw error

      return data as TaxInvoice
    } catch (error) {
      console.error('결제 확인 실패:', error)
      throw error
    }
  },

  // 청구 정보 조회
  async getBillingInfo(doctorId: string): Promise<BillingInfo | null> {
    if (isDevelopment && isDummySupabase) {
      return dummyBillingInfo.find(info => info.doctorId === doctorId) || null
    }

    try {
      const { data, error } = await supabase
        .from('billing_info')
        .select('*')
        .eq('doctor_id', doctorId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (!data) return null

      return {
        id: data.id,
        doctorId: data.doctor_id,
        businessNumber: data.business_number,
        businessName: data.business_name,
        businessAddress: data.business_address,
        businessType: data.business_type,
        businessCategory: data.business_category,
        representativeName: data.representative_name,
        contactPerson: data.contact_person,
        contactPhone: data.contact_phone,
        contactEmail: data.contact_email,
        taxInvoiceEmail: data.tax_invoice_email,
        taxInvoiceMethod: data.tax_invoice_method,
        bankName: data.bank_name,
        accountNumber: data.account_number,
        accountHolder: data.account_holder,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('청구 정보 조회 실패:', error)
      throw error
    }
  },

  // 세금계산서 통계
  async getInvoiceStats(): Promise<InvoiceStats> {
    if (isDevelopment && isDummySupabase) {
      const total = dummyInvoices.length
      const issued = dummyInvoices.filter(inv => inv.status === 'issued').length
      const paid = dummyInvoices.filter(inv => inv.status === 'paid').length
      const overdue = dummyInvoices.filter(inv => inv.status === 'overdue').length
      const totalRevenue = dummyInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0)
      
      return {
        totalInvoices: total,
        issuedInvoices: issued,
        paidInvoices: paid,
        overdueInvoices: overdue,
        totalRevenue,
        monthlyRevenue: totalRevenue,
        averagePaymentDays: 15,
        monthlyStats: [
          {
            month: '2024-01',
            invoiceCount: total,
            revenue: totalRevenue,
            paidCount: paid,
            overdueCount: overdue
          }
        ],
        planStats: [
          {
            plan: '1month',
            count: dummyInvoices.filter(inv => inv.subscriptionPlan === '1month').length,
            revenue: dummyInvoices.filter(inv => inv.subscriptionPlan === '1month' && inv.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0),
            percentage: 20
          },
          {
            plan: '6months',
            count: dummyInvoices.filter(inv => inv.subscriptionPlan === '6months').length,
            revenue: dummyInvoices.filter(inv => inv.subscriptionPlan === '6months' && inv.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0),
            percentage: 40
          },
          {
            plan: '12months',
            count: dummyInvoices.filter(inv => inv.subscriptionPlan === '12months').length,
            revenue: dummyInvoices.filter(inv => inv.subscriptionPlan === '12months' && inv.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0),
            percentage: 40
          }
        ]
      }
    }

    try {
      const { data, error } = await supabase
        .from('tax_invoices')
        .select('status, total_amount, subscription_plan, created_at, payment_date')

      if (error) throw error

      const invoices = data || []
      const total = invoices.length
      const issued = invoices.filter(inv => inv.status === 'issued').length
      const paid = invoices.filter(inv => inv.status === 'paid').length
      const overdue = invoices.filter(inv => inv.status === 'overdue').length
      const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0)

      return {
        totalInvoices: total,
        issuedInvoices: issued,
        paidInvoices: paid,
        overdueInvoices: overdue,
        totalRevenue,
        monthlyRevenue: totalRevenue, // 실제로는 이번 달 매출 계산 필요
        averagePaymentDays: 15, // 실제 계산 필요
        monthlyStats: [], // 실제 월별 통계 계산 필요
        planStats: [] // 실제 플랜별 통계 계산 필요
      }
    } catch (error) {
      console.error('세금계산서 통계 조회 실패:', error)
      throw error
    }
  },

  // 템플릿 조회
  async getInvoiceTemplate(): Promise<InvoiceTemplate> {
    if (isDevelopment && isDummySupabase) {
      return dummyTemplate
    }

    try {
      const { data, error } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('is_default', true)
        .single()

      if (error) throw error

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        isDefault: data.is_default,
        companyInfo: data.company_info,
        logoUrl: data.logo_url,
        headerText: data.header_text,
        footerText: data.footer_text,
        termsAndConditions: data.terms_and_conditions,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('템플릿 조회 실패:', error)
      throw error
    }
  }
}