import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isSuperAdmin, getConfig } from '@/lib/config'
import { cookies } from 'next/headers'

// 서버 사이드 Supabase 클라이언트 생성
function createServerClient() {
  const config = getConfig()
  return createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// 관리자 권한 확인 함수
async function verifyAdminAuth(request: NextRequest) {
  try {
    // 개발 환경에서는 인증 체크 건너뛰기
    if (process.env.NODE_ENV === 'development') {
      return { id: 'dev-admin', email: 'admin@obdoc.com' }
    }
    
    // 쿠키에서 세션 토큰 가져오기
    const cookieStore = cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    
    if (!accessToken) {
      throw new Error('인증이 필요합니다')
    }
    
    const supabase = createServerClient()
    
    // 토큰으로 사용자 정보 가져오기
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      throw new Error('인증이 필요합니다')
    }
    
    if (!isSuperAdmin(user.email)) {
      throw new Error('관리자 권한이 필요합니다')
    }
    
    return user
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '권한 확인 중 오류가 발생했습니다')
  }
}

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await verifyAdminAuth(request)
    
    // 병행으로 여러 통계 데이터 조회
    const supabase = createServerClient()
    
    const [
      hospitalCountResult,
      userCountResult,
      pendingApprovalsResult,
      recentActivityResult
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
      
      // 최근 활동 (활동 로그 테이블이 있다면)
      supabase
        .from('activity_logs')
        .select('id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ])
    
    // 결과 처리
    const hospitalCount = hospitalCountResult.status === 'fulfilled' 
      ? hospitalCountResult.value.count || 0 
      : 0
    
    const userCount = userCountResult.status === 'fulfilled' 
      ? userCountResult.value.count || 0 
      : 0
    
    const pendingApprovals = pendingApprovalsResult.status === 'fulfilled' 
      ? pendingApprovalsResult.value.count || 0 
      : 0
    
    const recentActivity = recentActivityResult.status === 'fulfilled' 
      ? recentActivityResult.value.count || 0 
      : 0
    
    // 월 매출 계산 (임시로 병원 수 기반 계산)
    const monthlyRevenue = hospitalCount * 169000 // 평균 월 구독료
    
    // 활성 세션 (임시로 사용자 수의 10% 정도로 계산)
    const activeSessions = Math.floor(userCount * 0.1)
    
    const stats = {
      total_hospitals: hospitalCount,
      total_users: userCount,
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
    
    // 오류 발생 시 기본값 반환
    const fallbackStats = {
      total_hospitals: 0,
      total_users: 0,
      monthly_revenue: 0,
      active_sessions: 0,
      pending_approvals: 0,
      recent_activity: 0,
      last_updated: new Date().toISOString(),
      error: error instanceof Error ? error.message : '데이터 조회 중 오류가 발생했습니다'
    }
    
    return NextResponse.json({
      success: false,
      data: fallbackStats,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다'
    }, { status: 500 })
  }
}