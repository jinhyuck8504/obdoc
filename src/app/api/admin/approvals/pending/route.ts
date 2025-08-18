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
    console.log('Approvals API 호출 - 인증 체크 우회 (데모 모드)')
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
    console.log('Approvals API 호출됨 - 데모 모드')
    
    // 더미 데이터로 즉시 응답
    const formattedData = [
      {
        id: '1',
        hospital_name: '서울 다이어트 클리닉',
        owner_name: '김의사',
        email: 'kim@example.com',
        hospital_type: 'clinic',
        subscription_plan: '6months',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      },
      {
        id: '2',
        hospital_name: '강남 한의원',
        owner_name: '이한의',
        email: 'lee@example.com',
        hospital_type: 'korean_medicine',
        subscription_plan: '12months',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      },
      {
        id: '3',
        hospital_name: '부산 종합병원',
        owner_name: '박원장',
        email: 'park@example.com',
        hospital_type: 'hospital',
        subscription_plan: '1month',
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      }
    ]
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      count: formattedData.length
    })
    
  } catch (error) {
    console.error('Approvals API 오류:', error)
    
    // 오류가 발생해도 빈 배열 반환
    return NextResponse.json({
      success: true,
      data: [],
      count: 0
    })
  }
}