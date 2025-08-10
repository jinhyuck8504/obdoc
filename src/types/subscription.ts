export interface Subscription {
  id: string
  doctorId: string
  doctorName: string
  hospitalName: string
  hospitalType: string
  email: string
  plan: '1month' | '6months' | '12months'
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'suspended'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  amount: number
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
}

export interface SubscriptionPlan {
  id: '1month' | '6months' | '12months'
  name: string
  duration: number // 개월 수
  price: number
  originalPrice?: number
  discount?: number
  features: string[]
  popular?: boolean
  description: string
}

export interface PaymentInfo {
  id: string
  subscriptionId: string
  method: 'bank_transfer' | 'card' | 'virtual_account'
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  transactionId?: string
  bankName?: string
  accountNumber?: string
  depositorName?: string
  paymentDate?: string
  confirmationDate?: string
  confirmedBy?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface SubscriptionNotification {
  id: string
  subscriptionId: string
  doctorId: string
  type: 'expiry_warning' | 'expired' | 'payment_reminder' | 'approved' | 'rejected'
  title: string
  message: string
  isRead: boolean
  sentAt: string
  scheduledFor?: string
}

export interface SubscriptionStats {
  totalSubscriptions: number
  activeSubscriptions: number
  pendingSubscriptions: number
  expiredSubscriptions: number
  cancelledSubscriptions: number
  totalRevenue: number
  monthlyRevenue: number
  planDistribution: {
    plan: '1month' | '6months' | '12months'
    count: number
    revenue: number
    percentage: number
  }[]
  expiringThisMonth: number
  renewalRate: number
}

export interface SubscriptionFilters {
  status?: 'all' | 'pending' | 'active' | 'expired' | 'cancelled' | 'suspended'
  plan?: 'all' | '1month' | '6months' | '12months'
  paymentStatus?: 'all' | 'pending' | 'paid' | 'failed' | 'refunded'
  hospitalType?: string
  dateRange?: 'all' | 'today' | 'week' | 'month' | '3months' | 'custom'
  startDate?: string
  endDate?: string
  search?: string
}

export interface SubscriptionFormData {
  doctorId: string
  plan: '1month' | '6months' | '12months'
  paymentMethod: 'bank_transfer' | 'card' | 'virtual_account'
  notes?: string
}

export interface ApprovalData {
  subscriptionId: string
  action: 'approve' | 'reject'
  startDate?: string
  endDate?: string
  notes?: string
  approvedBy: string
}