import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
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
    
    // 전체 통계 조회
    const [
      { count: totalHospitals },
      { count: totalUsers },
      { data: subscriptions }
    ] = await Promise.all([
      supabase.from('hospitals').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('amount, status, created_at')
    ])
    
    // 월별 매출 계산
    const monthlyRevenue = subscriptions
      ?.filter(sub => sub.status === 'active')
      ?.reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0
    
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
    
    // 사용자 활동 (더미 데이터)
    const userActivity = [
      { date: '2024-01-15', active_users: 78, new_signups: 5 },
      { date: '2024-01-16', active_users: 82, new_signups: 3 },
      { date: '2024-01-17', active_users: 89, new_signups: 7 },
      { date: '2024-01-18', active_users: 85, new_signups: 4 },
      { date: '2024-01-19', active_users: 91, new_signups: 6 }
    ]
    
    const analyticsData = {
      overview: {
        total_hospitals: totalHospitals || 0,
        total_users: totalUsers || 0,
        monthly_revenue: monthlyRevenue,
        active_sessions: 89, // 더미 데이터
        growth_rate: growthRate
      },
      monthly_stats: monthlyStats,
      hospital_types: hospitalTypes,
      subscription_plans: subscriptionPlans,
      user_activity: userActivity
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