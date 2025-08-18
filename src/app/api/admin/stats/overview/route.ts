import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth, createServerClient } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  try {
    // 실제 관리자 권한 확인
    await verifyAdminAuth(request)
    
    const supabase = createServerClient()
    
    // 실제 데이터베이스에서 통계 조회
    const [
      hospitalCountResult,
      userCountResult,
      pendingApprovalsResult,
      recentActivityResult,
      subscriptionResult
    ] = await Promise.allSettled([
      // 승인된 병원 수
      supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'doctor')
        .eq('status', 'approved'),
      
      // 전체 사용자 수
      supabase
        .from('users')
        .select('id', { count: 'exact' }),
      
      // 승인 대기 수
      supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')
        .eq('role', 'doctor'),
      
      // 최근 24시간 활동
      supabase
        .from('activity_logs')
        .select('id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      
      // 활성 구독
      supabase
        .from('subscriptions')
        .select('amount')
        .eq('status', 'active')
    ])
    
    // 결과 처리
    const totalHospitals = hospitalCountResult.status === 'fulfilled' 
      ? hospitalCountResult.value.count || 0 
      : 0
    
    const totalUsers = userCountResult.status === 'fulfilled' 
      ? userCountResult.value.count || 0 
      : 0
    
    const pendingApprovals = pendingApprovalsResult.status === 'fulfilled' 
      ? pendingApprovalsResult.value.count || 0 
      : 0
    
    const recentActivity = recentActivityResult.status === 'fulfilled' 
      ? recentActivityResult.value.count || 0 
      : 0
    
    const subscriptions = subscriptionResult.status === 'fulfilled' 
      ? subscriptionResult.value.data || [] 
      : []
    
    // 월 매출 계산
    const monthlyRevenue = subscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0)
    
    // 활성 세션 추정 (전체 사용자의 10% 정도)
    const activeSessions = Math.floor(totalUsers * 0.1)
    
    const stats = {
      total_hospitals: totalHospitals,
      total_users: totalUsers,
      monthly_revenue: monthlyRevenue,
      active_sessions: activeSessions,
      pending_approvals: pendingApprovals,
      recent_activity: recentActivity,
      last_updated: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: stats
    })
    
  } catch (error) {
    console.error('통계 데이터 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '통계 데이터 조회 중 오류가 발생했습니다'
    }, { status: 500 })
  }
}