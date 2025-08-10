export interface AdminStats {
  // 사용자 통계
  totalUsers: number
  totalDoctors: number
  totalPatients: number
  activeUsers: number
  newUsersThisMonth: number
  
  // 구독 통계
  totalSubscriptions: number
  activeSubscriptions: number
  pendingSubscriptions: number
  expiredSubscriptions: number
  subscriptionRevenue: number
  monthlyRevenue: number
  
  // 병원 유형별 통계
  hospitalTypeStats: HospitalTypeStats[]
  
  // 커뮤니티 통계
  totalPosts: number
  totalComments: number
  activeDiscussions: number
  reportedContent: number
  
  // 예약 통계
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  upcomingAppointments: number
  
  // 시스템 통계
  systemHealth: 'healthy' | 'warning' | 'critical'
  lastUpdated: string
}

export interface HospitalTypeStats {
  type: string
  count: number
  activeCount: number
  revenue: number
  percentage: number
}

export interface RevenueData {
  month: string
  revenue: number
  subscriptions: number
  newSubscriptions: number
}

export interface UserActivityData {
  date: string
  activeUsers: number
  newUsers: number
  posts: number
  comments: number
  appointments: number
}

export interface SubscriptionAnalytics {
  planDistribution: {
    plan: '1month' | '6months' | '12months'
    count: number
    revenue: number
    percentage: number
  }[]
  conversionRate: number
  churnRate: number
  averageLifetime: number
}

export interface SystemMetrics {
  responseTime: number
  uptime: number
  errorRate: number
  activeConnections: number
  databaseSize: number
  storageUsed: number
}

export interface AdminFilters {
  dateRange: 'today' | 'week' | 'month' | '3months' | '6months' | 'year' | 'custom'
  hospitalType?: string
  subscriptionStatus?: 'all' | 'active' | 'pending' | 'expired'
  userType?: 'all' | 'doctors' | 'patients'
  startDate?: string
  endDate?: string
}

export interface DashboardWidget {
  id: string
  title: string
  type: 'stat' | 'chart' | 'table' | 'progress'
  size: 'small' | 'medium' | 'large'
  data: any
  loading?: boolean
  error?: string
}