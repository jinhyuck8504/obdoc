export interface TaxInvoice {
  id: string
  invoiceNumber: string
  subscriptionId: string
  doctorId: string
  doctorName: string
  hospitalName: string
  businessNumber: string
  businessAddress: string
  contactPerson: string
  contactPhone: string
  contactEmail: string
  
  // 청구 정보
  issueDate: string
  dueDate: string
  paymentDate?: string
  
  // 상품 정보
  subscriptionPlan: '1month' | '6months' | '12months'
  subscriptionPeriod: {
    startDate: string
    endDate: string
  }
  
  // 금액 정보
  baseAmount: number
  vatAmount: number
  totalAmount: number
  
  // 상태
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'
  
  // 메타데이터
  createdAt: string
  updatedAt: string
  createdBy: string
  notes?: string
}

export interface BillingInfo {
  id: string
  doctorId: string
  businessNumber: string
  businessName: string
  businessAddress: string
  businessType: string
  businessCategory: string
  representativeName: string
  contactPerson: string
  contactPhone: string
  contactEmail: string
  
  // 세금계산서 발행 정보
  taxInvoiceEmail: string
  taxInvoiceMethod: 'email' | 'post' | 'fax'
  
  // 은행 정보 (환불용)
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  
  createdAt: string
  updatedAt: string
}

export interface InvoiceTemplate {
  id: string
  name: string
  description: string
  isDefault: boolean
  
  // 회사 정보
  companyInfo: {
    name: string
    businessNumber: string
    address: string
    phone: string
    email: string
    representativeName: string
  }
  
  // 템플릿 설정
  logoUrl?: string
  headerText?: string
  footerText?: string
  termsAndConditions?: string
  
  createdAt: string
  updatedAt: string
}

export interface InvoiceStats {
  totalInvoices: number
  issuedInvoices: number
  paidInvoices: number
  overdueInvoices: number
  totalRevenue: number
  monthlyRevenue: number
  averagePaymentDays: number
  
  // 월별 통계
  monthlyStats: {
    month: string
    invoiceCount: number
    revenue: number
    paidCount: number
    overdueCount: number
  }[]
  
  // 구독 플랜별 통계
  planStats: {
    plan: '1month' | '6months' | '12months'
    count: number
    revenue: number
    percentage: number
  }[]
}

export interface InvoiceFilters {
  status?: 'all' | 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'
  plan?: 'all' | '1month' | '6months' | '12months'
  dateRange?: 'all' | 'today' | 'week' | 'month' | '3months' | 'custom'
  startDate?: string
  endDate?: string
  search?: string
  hospitalType?: string
}

export interface InvoiceAction {
  id: string
  invoiceId: string
  adminId: string
  adminName: string
  action: 'create' | 'issue' | 'pay' | 'cancel' | 'resend' | 'update'
  details?: string
  createdAt: string
}

export interface PaymentRecord {
  id: string
  invoiceId: string
  amount: number
  paymentMethod: 'bank_transfer' | 'card' | 'cash' | 'other'
  paymentDate: string
  confirmationNumber?: string
  notes?: string
  confirmedBy: string
  confirmedAt: string
}