import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth, createServerClient } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  try {
    // 실제 관리자 권한 확인
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
    
    // 실제 데이터베이스에서 통계 조회
    const [
      hospitalCountResult,
      userCountResult,
      subscriptionResult,
      activityResult
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
      
      // 구독 정보
      supabase
        .from('subscriptions')
        .select('plan, amount, status, created_at'),
      
      // 최근 활동
      supabase
        .from('activity_logs')
        .select('created_at, action')
        .gte('created_at', startDate.toISOString())
    ])
    
    // 결과 처리
    const totalHospitals = hospitalCountResult.status === 'fulfilled' 
      ? hospitalCountResult.value.count || 0 
      : 0
    
    const totalUsers = userCountResult.status === 'fulfilled' 
      ? userCountResult.value.count || 0 
      : 0
    
    const subscriptions = subscriptionResult.status === 'fulfilled' 
      ? subscriptionResult.value.data || [] 
      : []
    
    const activities = activityResult.status === 'fulfilled' 
      ? activityResult.value.data || [] 
      : []
    
    // 월별 매출 계산
    const monthlyRevenue = subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => sum + (sub.amount || 0), 0)
    
    // 병원 유형별 분포 계산
    const { data: hospitalTypes } = await supabase
      .from('users')
      .select('hospital_type')
      .eq('role', 'doctor')
      .eq('status', 'approved')
    
    const typeDistribution = hospitalTypes?.reduce((acc, hospital) => {
      const type = hospital.hospital_type || 'clinic'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    const totalTypeCount = Object.values(typeDistribution).reduce((sum, count) => sum + count, 0)
    
    const hospitalTypesData = Object.entries(typeDistribution).map(([type, count]) => ({
      type,
      count,
      percentage: totalTypeCount > 0 ? Math.round((count / totalTypeCount) * 100 * 10) / 10 : 0
    }))
    
    // 구독 플랜별 현황
    const planDistribution = subscriptions.reduce((acc, sub) => {
      const plan = sub.plan || '1month'
      if (!acc[plan]) {
        acc[plan] = { count: 0, revenue: 0 }
      }
      acc[plan].count += 1
      acc[plan].revenue += sub.amount || 0
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)
    
    const subscriptionPlansData = Object.entries(planDistribution).map(([plan, data]) => ({
      plan,
      count: data.count,
      revenue: data.revenue
    }))
    
    // 최근 활동 추이
    const recentTrends = activities
      .slice(-7) // 최근 7일
      .map(activity => ({
        date: activity.created_at.split('T')[0],
        new_hospitals: activities.filter(a => 
          a.action === 'hospital_approve' && 
          a.created_at.split('T')[0] === activity.created_at.split('T')[0]
        ).length,
        new_users: activities.filter(a => 
          a.action === 'user_registration' && 
          a.created_at.split('T')[0] === activity.created_at.split('T')[0]
        ).length,
        revenue: subscriptions.filter(s => 
          s.created_at.split('T')[0] === activity.created_at.split('T')[0]
        ).reduce((sum, s) => sum + (s.amount || 0), 0)
      }))
    
    // 성장률 계산 (지난 달 대비)
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const { count: lastMonthUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .lte('created_at', lastMonth.toISOString())
    
    const growthRate = lastMonthUsers > 0 
      ? Math.round(((totalUsers - lastMonthUsers) / lastMonthUsers) * 100 * 10) / 10
      : 0
    
    // 월별 통계 (최근 3개월)
    const monthlyStats = []
    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date()
      monthDate.setMonth(monthDate.getMonth() - i)
      const monthStr = monthDate.toISOString().substring(0, 7)
      
      const { count: monthHospitals } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'doctor')
        .eq('status', 'approved')
        .lte('created_at', new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString())
      
      const { count: monthUsers } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .lte('created_at', new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString())
      
      const monthRevenue = subscriptions
        .filter(s => s.created_at.startsWith(monthStr))
        .reduce((sum, s) => sum + (s.amount || 0), 0)
      
      monthlyStats.push({
        month: monthStr,
        hospitals: monthHospitals || 0,
        users: monthUsers || 0,
        revenue: monthRevenue
      })
    }
    
    const analyticsData = {
      overview: {
        total_hospitals: totalHospitals,
        total_users: totalUsers,
        monthly_revenue: monthlyRevenue,
        active_sessions: Math.floor(totalUsers * 0.1), // 추정값
        growth_rate: growthRate
      },
      monthly_stats: monthlyStats,
      hospital_types: hospitalTypesData,
      subscription_plans: subscriptionPlansData,
      recent_trends: recentTrends
    }
    
    return NextResponse.json({
      success: true,
      data: analyticsData
    })
    
  } catch (error) {
    console.error('Analytics API 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '분석 데이터 조회 중 오류가 발생했습니다'
    }, { status: 500 })
  }
}