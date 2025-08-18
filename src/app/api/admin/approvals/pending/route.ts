import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth, createServerClient } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  try {
    // 실제 관리자 권한 확인
    await verifyAdminAuth(request)
    
    const supabase = createServerClient()
    
    // 실제 데이터베이스에서 승인 대기 중인 사용자 목록 조회
    const { data: pendingUsers, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        hospital_name,
        hospital_type,
        subscription_plan,
        created_at,
        status
      `)
      .eq('status', 'pending')
      .eq('role', 'doctor')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('승인 대기 목록 조회 실패:', error)
      return NextResponse.json({
        success: false,
        error: '데이터 조회 중 오류가 발생했습니다'
      }, { status: 500 })
    }
    
    // 데이터 포맷팅
    const formattedData = (pendingUsers || []).map(user => ({
      id: user.id,
      hospital_name: user.hospital_name || '병원명 미입력',
      owner_name: user.name || '이름 미입력',
      email: user.email,
      hospital_type: user.hospital_type || 'clinic',
      subscription_plan: user.subscription_plan || '1month',
      created_at: user.created_at,
      status: user.status
    }))
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      count: formattedData.length
    })
    
  } catch (error) {
    console.error('승인 대기 목록 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다'
    }, { status: 500 })
  }
}