export interface Report {
  id: string
  reporterId: string
  reporterName: string
  targetType: 'post' | 'comment'
  targetId: string
  targetContent: string
  targetAuthorId: string
  targetAuthorName: string
  reason: 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'other'
  description?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewerId?: string
  reviewerName?: string
  reviewNote?: string
  action?: 'none' | 'warning' | 'content_removed' | 'user_suspended' | 'user_banned'
  createdAt: string
  updatedAt: string
  reviewedAt?: string
}

export interface UserPenalty {
  id: string
  userId: string
  userName: string
  type: 'warning' | 'suspension' | 'ban'
  reason: string
  description?: string
  duration?: number // 정지 기간 (일)
  isActive: boolean
  issuedBy: string
  issuedByName: string
  createdAt: string
  expiresAt?: string
}

export interface ModerationStats {
  totalReports: number
  pendingReports: number
  resolvedReports: number
  totalPenalties: number
  activePenalties: number
  todayReports: number
  weeklyReports: number
  flaggedContent: number
  blockedContent: number
}

export interface PenaltyFormData {
  userId: string
  type: 'warning' | 'suspension' | 'ban'
  reason: string
  description?: string
  duration?: number
}

export interface ReportFormData {
  targetType: 'post' | 'comment'
  targetId: string
  reason: 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'other'
  description?: string
}

export interface ModerationAction {
  id: string
  reportId: string
  adminId: string
  adminName: string
  action: 'dismiss' | 'warn_user' | 'remove_content' | 'suspend_user'
  notes?: string
  createdAt: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'error'
  priority: 'low' | 'medium' | 'high'
  targetAudience: 'all' | 'customers' | 'doctors'
  isActive: boolean
  publishedAt?: string
  expiresAt?: string
  authorId: string
  authorName: string
  createdAt: string
  updatedAt: string
}

export interface AnnouncementFormData {
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'error'
  priority: 'low' | 'medium' | 'high'
  targetAudience: 'all' | 'customers' | 'doctors'
  expiresAt?: string
}