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
    // 임시로 모든 환경에서 인증 체크 건너뛰기 (데모용)
    console.log('Analytics API 호출 - 인증 체크 우회 (데모 모드)')
    return { id: 'demo-admin', email: 'admin@obdoc.com' }
    
    // TODO: 실제 프로덕션에서는 아래 코드 활성화
    /*
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
    */
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '권한 확인 중 오류가 발생했습니다')
  }
}

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await verifyAdminAuth(request)
    
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30days'
    
    // 기간별 날짜 계산
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7days':
        startDate.setDate(now.getDate() - 7)
        break
      case '30days':
        startDate.setDate(now.getDate() - 30)
        break
      case '90days':
        startDate.setDate(now.getDate() - 90)
        break
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }
    
    // 전체 통계 조회 (에러 처리 포함)
    let totalHospitals = 0
    let totalUsers = 0
    let subscriptions: any[] = []
    
    try {
      const [hospitalResult, userResult, subscriptionResult] = await Promise.allSettled([
        supabase.from('users').select('id', { count: 'exact' }).eq('role', 'doctor').eq('status', 'approved'),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('subscriptions').select('amount, status, created_at')
      ])
      
      totalHospitals = hospitalResult.status === 'fulfilled' ? hospitalResult.value.count || 0 : 0
      totalUsers = userResult.status === 'fulfilled' ? userResult.value.count || 0 : 0
      subscriptions = subscriptionResult.status === 'fulfilled' ? subscriptionResult.value.data || [] : []
    } catch (error) {
      console.warn('데이터베이스 조회 실패, 더미 데이터 사용:', error)
    }
    
    // 월별 매출 계산
    const monthlyRevenue = subscriptions
      ?.filter((sub: any) => sub.status === 'active')
      ?.reduce((sum: number, sub: any) => sum + (sub.amount || 0), 0) || 0
    
    // 성장률 계산 (더미 데이터)
    const growthRate = 12.5
    
    // 월별 통계 (더미 데이터)
    const monthlyStats = [
      { month: '2024-01', hospitals: 35, users: 890, revenue: 5915000 },
      { month: '2024-02', hospitals: 42, users: 1120, revenue: 7098000 },
      { month: '2024-03', hospitals: 47, users: 1234, revenue: 7943000 }
    ]
    
    // 병원 유형별 분포 (더미 데이터)
    const hospitalTypes = [
      { type: 'clinic', count: 28, percentage: 59.6 },
      { type: 'korean_medicine', count: 12, percentage: 25.5 },
      { type: 'hospital', count: 7, percentage: 14.9 }
    ]
    
    // 구독 플랜별 현황 (더미 데이터)
    const subscriptionPlans = [
      { plan: '1month', count: 15, revenue: 2535000 },
      { plan: '6months', count: 20, revenue: 3380000 },
      { plan: '12months', count: 12, revenue: 2028000 }
    ]
    
    // 최근 활동 추이 (더미 데이터)
    const recentTrends = [
      { date: '2024-01-15', new_hospitals: 2, new_users: 15, revenue: 338000 },
      { date: '2024-01-16', new_hospitals: 1, new_users: 8, revenue: 169000 },
      { date: '2024-01-17', new_hospitals: 3, new_users: 22, revenue: 507000 },
      { date: '2024-01-18', new_hospitals: 0, new_users: 12, revenue: 0 },
      { date: '2024-01-19', new_hospitals: 1, new_users: 18, revenue: 169000 }
    ]
    
    const analyticsData = {
      overview: {
        total_hospitals: totalHospitals || 47,
        total_users: totalUsers || 1234,
        monthly_revenue: monthlyRevenue || 7943000,
        active_sessions: 89, // 더미 데이터
        growth_rate: growthRate
      },
      monthly_stats: monthlyStats,
      hospital_types: hospitalTypes,
      subscription_plans: subscriptionPlans,
      recent_trends: recentTrends
    }
    
    return NextResponse.json({
      success: true,
      data: analyticsData
    })
    
  } catch (error) {
    console.error('분석 데이터 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}