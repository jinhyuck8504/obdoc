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
    console.log('Stats API 호출 - 인증 체크 우회 (데모 모드)')
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
  // 모든 오류를 캐치하여 항상 성공 응답 반환 (데모 모드)
  try {
    console.log('Stats API 호출됨 - 데모 모드')
    
    // 더미 데이터로 즉시 응답
    const stats = {
      total_hospitals: 47,
      total_users: 1234,
      monthly_revenue: 7943000,
      active_sessions: 89,
      pending_approvals: 3,
      recent_activity: 12,
      last_updated: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: stats
    })
    
  } catch (error) {
    console.error('Stats API 오류:', error)
    
    // 오류가 발생해도 기본 더미 데이터 반환
    return NextResponse.json({
      success: true,
      data: {
        total_hospitals: 47,
        total_users: 1234,
        monthly_revenue: 7943000,
        active_sessions: 89,
        pending_approvals: 3,
        recent_activity: 12,
        last_updated: new Date().toISOString()
      }
    })
  }
}