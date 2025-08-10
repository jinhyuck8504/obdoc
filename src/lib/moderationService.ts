import { supabase } from './supabase'
import { Report, UserPenalty, ModerationAction, ReportFormData, PenaltyFormData, ModerationStats } from '@/types/moderation'

// 개발 환경 체크
const isDevelopment = process.env.NODE_ENV === 'development'
const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy-project') ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase_url_here')

// 더미 신고 데이터
const dummyReports: Report[] = [
  {
    id: 'report-1',
    reporterId: 'user-1',
    reporterName: '김신고',
    targetType: 'post',
    targetId: 'post-1',
    targetContent: '부적절한 내용이 포함된 게시글입니다...',
    targetAuthorId: 'user-2',
    targetAuthorName: '이작성자',
    reason: 'inappropriate',
    description: '건강과 관련 없는 부적절한 내용이 포함되어 있습니다.',
    status: 'pending',
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T10:30:00Z'
  },
  {
    id: 'report-2',
    reporterId: 'user-3',
    reporterName: '박모니터',
    targetType: 'comment',
    targetId: 'comment-1',
    targetContent: '스팸성 댓글 내용...',
    targetAuthorId: 'user-4',
    targetAuthorName: '최스팸',
    reason: 'spam',
    description: '광고성 댓글을 반복적으로 작성하고 있습니다.',
    status: 'reviewed',
    reviewerId: 'admin-1',
    reviewerName: '관리자',
    reviewNote: '스팸으로 확인되어 댓글을 삭제했습니다.',
    action: 'content_removed',
    createdAt: '2024-01-19T14:20:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
    reviewedAt: '2024-01-19T16:45:00Z'
  },
  {
    id: 'report-3',
    reporterId: 'user-5',
    reporterName: '정감시',
    targetType: 'post',
    targetId: 'post-2',
    targetContent: '허위 정보가 포함된 게시글...',
    targetAuthorId: 'user-6',
    targetAuthorName: '한허위',
    reason: 'misinformation',
    description: '의학적으로 검증되지 않은 잘못된 정보를 퍼뜨리고 있습니다.',
    status: 'resolved',
    reviewerId: 'admin-1',
    reviewerName: '관리자',
    reviewNote: '허위 정보로 확인되어 게시글을 삭제하고 사용자에게 경고를 발송했습니다.',
    action: 'warning',
    createdAt: '2024-01-18T09:15:00Z',
    updatedAt: '2024-01-18T11:30:00Z',
    reviewedAt: '2024-01-18T11:30:00Z'
  }
]

// 더미 제재 데이터
const dummyPenalties: UserPenalty[] = [
  {
    id: 'penalty-1',
    userId: 'user-6',
    userName: '한허위',
    type: 'warning',
    reason: '허위 정보 유포',
    description: '의학적으로 검증되지 않은 잘못된 정보를 게시했습니다.',
    isActive: true,
    issuedBy: 'admin-1',
    issuedByName: '관리자',
    createdAt: '2024-01-18T11:30:00Z'
  },
  {
    id: 'penalty-2',
    userId: 'user-4',
    userName: '최스팸',
    type: 'suspension',
    reason: '스팸 행위',
    description: '반복적인 광고성 댓글 작성으로 인한 3일 정지',
    duration: 3,
    isActive: true,
    issuedBy: 'admin-1',
    issuedByName: '관리자',
    createdAt: '2024-01-19T16:45:00Z',
    expiresAt: '2024-01-22T16:45:00Z'
  }
]

export const moderationService = {
  // 신고 생성
  async createReport(reportData: ReportFormData & { reporterId: string, reporterName: string }): Promise<Report> {
    if (isDevelopment && isDummySupabase) {
      // 개발 모드에서는 더미 데이터에 추가
      const newReport: Report = {
        id: `report-${Date.now()}`,
        ...reportData,
        targetContent: '신고된 콘텐츠 내용...',
        targetAuthorId: 'target-user',
        targetAuthorName: '대상 사용자',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      dummyReports.unshift(newReport)
      console.log('개발 모드: 신고 생성 완료', newReport)
      return newReport
    }

    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([{
          reporter_id: reportData.reporterId,
          reporter_name: reportData.reporterName,
          target_type: reportData.targetType,
          target_id: reportData.targetId,
          reason: reportData.reason,
          description: reportData.description,
          status: 'pending'
        }])
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        reporterId: data.reporter_id,
        reporterName: data.reporter_name,
        targetType: data.target_type,
        targetId: data.target_id,
        targetContent: data.target_content,
        targetAuthorId: data.target_author_id,
        targetAuthorName: data.target_author_name,
        reason: data.reason,
        description: data.description,
        status: data.status,
        reviewerId: data.reviewer_id,
        reviewerName: data.reviewer_name,
        reviewNote: data.review_note,
        action: data.action,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        reviewedAt: data.reviewed_at
      }
    } catch (error) {
      console.error('신고 생성 실패:', error)
      throw error
    }
  },

  // 신고 목록 조회
  async getReports(status?: string): Promise<Report[]> {
    if (isDevelopment && isDummySupabase) {
      console.log('개발 모드: 더미 신고 데이터 사용')
      let filtered = [...dummyReports]
      if (status && status !== 'all') {
        filtered = filtered.filter(report => report.status === status)
      }
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    try {
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query
      if (error) throw error

      return data || []
    } catch (error) {
      console.error('신고 목록 조회 실패:', error)
      throw error
    }
  },

  // 신고 처리
  async reviewReport(reportId: string, reviewData: {
    reviewerId: string
    reviewerName: string
    reviewNote: string
    action: 'none' | 'warning' | 'content_removed' | 'user_suspended' | 'user_banned'
    status: 'reviewed' | 'resolved' | 'dismissed'
  }): Promise<Report> {
    if (isDevelopment && isDummySupabase) {
      const index = dummyReports.findIndex(r => r.id === reportId)
      if (index === -1) {
        throw new Error('신고를 찾을 수 없습니다')
      }
      dummyReports[index] = {
        ...dummyReports[index],
        ...reviewData,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      console.log('개발 모드: 신고 처리 완료', dummyReports[index])
      return dummyReports[index]
    }

    try {
      const { data, error } = await supabase
        .from('reports')
        .update({
          reviewer_id: reviewData.reviewerId,
          reviewer_name: reviewData.reviewerName,
          review_note: reviewData.reviewNote,
          action: reviewData.action,
          status: reviewData.status,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        reporterId: data.reporter_id,
        reporterName: data.reporter_name,
        targetType: data.target_type,
        targetId: data.target_id,
        targetContent: data.target_content,
        targetAuthorId: data.target_author_id,
        targetAuthorName: data.target_author_name,
        reason: data.reason,
        description: data.description,
        status: data.status,
        reviewerId: data.reviewer_id,
        reviewerName: data.reviewer_name,
        reviewNote: data.review_note,
        action: data.action,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        reviewedAt: data.reviewed_at
      }
    } catch (error) {
      console.error('신고 처리 실패:', error)
      throw error
    }
  },

  // 사용자 제재 목록 조회
  async getPenalties(userId?: string): Promise<UserPenalty[]> {
    if (isDevelopment && isDummySupabase) {
      let filtered = [...dummyPenalties]
      if (userId) {
        filtered = filtered.filter(penalty => penalty.userId === userId)
      }
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    try {
      let query = supabase
        .from('user_penalties')
        .select('*')
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query
      if (error) throw error

      return data?.map(penalty => ({
        id: penalty.id,
        userId: penalty.user_id,
        userName: penalty.user_name,
        type: penalty.type,
        reason: penalty.reason,
        description: penalty.description,
        duration: penalty.duration,
        isActive: penalty.is_active,
        issuedBy: penalty.issued_by,
        issuedByName: penalty.issued_by_name,
        createdAt: penalty.created_at,
        expiresAt: penalty.expires_at
      })) || []
    } catch (error) {
      console.error('제재 목록 조회 실패:', error)
      throw error
    }
  },

  // 사용자 제재 생성
  async createPenalty(penaltyData: PenaltyFormData & { issuedBy: string, issuedByName: string }): Promise<UserPenalty> {
    if (isDevelopment && isDummySupabase) {
      const expiresAt = penaltyData.duration ? 
        new Date(Date.now() + penaltyData.duration * 24 * 60 * 60 * 1000).toISOString() : 
        undefined

      const newPenalty: UserPenalty = {
        id: `penalty-${Date.now()}`,
        userId: penaltyData.userId,
        userName: '사용자',
        type: penaltyData.type,
        reason: penaltyData.reason,
        description: penaltyData.description,
        duration: penaltyData.duration,
        isActive: true,
        issuedBy: penaltyData.issuedBy,
        issuedByName: penaltyData.issuedByName,
        createdAt: new Date().toISOString(),
        expiresAt
      }
      dummyPenalties.unshift(newPenalty)
      console.log('개발 모드: 제재 생성 완료', newPenalty)
      return newPenalty
    }

    try {
      const expiresAt = penaltyData.duration ? 
        new Date(Date.now() + penaltyData.duration * 24 * 60 * 60 * 1000).toISOString() : 
        null

      const { data, error } = await supabase
        .from('user_penalties')
        .insert([{
          user_id: penaltyData.userId,
          type: penaltyData.type,
          reason: penaltyData.reason,
          description: penaltyData.description,
          duration: penaltyData.duration,
          is_active: true,
          issued_by: penaltyData.issuedBy,
          issued_by_name: penaltyData.issuedByName,
          expires_at: expiresAt
        }])
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        userId: data.user_id,
        userName: data.user_name,
        type: data.type,
        reason: data.reason,
        description: data.description,
        duration: data.duration,
        isActive: data.is_active,
        issuedBy: data.issued_by,
        issuedByName: data.issued_by_name,
        createdAt: data.created_at,
        expiresAt: data.expires_at
      }
    } catch (error) {
      console.error('제재 생성 실패:', error)
      throw error
    }
  },

  // 신고 처리 (ModerationDashboard용)
  async processReport(
    reportId: string,
    adminId: string,
    adminName: string,
    action: 'dismiss' | 'warn_user' | 'remove_content' | 'suspend_user',
    notes?: string
  ): Promise<Report> {
    // action을 reviewReport에서 사용하는 형식으로 변환
    const actionMap = {
      'dismiss': 'none' as const,
      'warn_user': 'warning' as const,
      'remove_content': 'content_removed' as const,
      'suspend_user': 'user_suspended' as const
    }

    const statusMap = {
      'dismiss': 'dismissed' as const,
      'warn_user': 'resolved' as const,
      'remove_content': 'resolved' as const,
      'suspend_user': 'resolved' as const
    }

    return this.reviewReport(reportId, {
      reviewerId: adminId,
      reviewerName: adminName,
      reviewNote: notes || '',
      action: actionMap[action],
      status: statusMap[action]
    })
  },

  // 모더레이션 통계
  async getModerationStats(): Promise<ModerationStats> {
    if (isDevelopment && isDummySupabase) {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      return {
        totalReports: dummyReports.length,
        pendingReports: dummyReports.filter(r => r.status === 'pending').length,
        resolvedReports: dummyReports.filter(r => r.status === 'resolved').length,
        totalPenalties: dummyPenalties.length,
        activePenalties: dummyPenalties.filter(p => p.isActive).length,
        todayReports: dummyReports.filter(r => r.createdAt.startsWith(today)).length,
        weeklyReports: dummyReports.filter(r => r.createdAt >= weekAgo).length,
        flaggedContent: 5,
        blockedContent: 2
      }
    }

    // 실제 데이터베이스에서 통계 조회
    try {
      const [reportsData, penaltiesData] = await Promise.all([
        supabase.from('reports').select('status, created_at'),
        supabase.from('user_penalties').select('is_active, created_at')
      ])

      const reports = reportsData.data || []
      const penalties = penaltiesData.data || []

      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      return {
        totalReports: reports.length,
        pendingReports: reports.filter(r => r.status === 'pending').length,
        resolvedReports: reports.filter(r => r.status === 'resolved').length,
        totalPenalties: penalties.length,
        activePenalties: penalties.filter(p => p.is_active).length,
        todayReports: reports.filter(r => r.created_at.startsWith(today)).length,
        weeklyReports: reports.filter(r => r.created_at >= weekAgo).length,
        flaggedContent: 0, // 실제 구현 필요
        blockedContent: 0  // 실제 구현 필요
      }
    } catch (error) {
      console.error('모더레이션 통계 조회 실패:', error)
      throw error
    }
  }
}