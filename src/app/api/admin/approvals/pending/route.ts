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
    
    const supabase = createServerClient()
    
    // 승인 대기 중인 사용자 목록 조회
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
      return NextResponse.json(
        { error: '데이터 조회 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }
    
    // 데이터 포맷팅
    const formattedData = pendingUsers.map(user => ({
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
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다' 
      },
      { status: 500 }
    )
  }
}