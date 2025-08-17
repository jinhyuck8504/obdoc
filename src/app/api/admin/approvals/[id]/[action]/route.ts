import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getConfig, isSuperAdmin } from '@/lib/config'

// 관리자 권한 확인 함수
async function verifyAdminAuth(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      // 쿠키에서 세션 확인 (개발 환경)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        throw new Error('인증이 필요합니다')
      }
      
      // 관리자 권한 확인
      if (!isSuperAdmin(session.user.email)) {
        throw new Error('관리자 권한이 필요합니다')
      }
      
      return session.user
    }
    
    // 토큰으로 사용자 확인
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      throw new Error('유효하지 않은 토큰입니다')
    }
    
    // 관리자 권한 확인
    if (!isSuperAdmin(user.email)) {
      throw new Error('관리자 권한이 필요합니다')
    }
    
    return user
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '권한 확인 중 오류가 발생했습니다')
  }
}

// 활동 로그 기록 함수
async function logAdminActivity(activity: {
  action: string
  description: string
  admin_id: string
  admin_email: string
  metadata?: any
}) {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        action: activity.action,
        description: activity.description,
        admin_id: activity.admin_id,
        admin_email: activity.admin_email,
        metadata: activity.metadata,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('활동 로그 기록 실패:', error)
    }
  } catch (error) {
    console.error('활동 로그 기록 중 오류:', error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  try {
    const { id, action } = params
    
    // 액션 유효성 검사
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: '유효하지 않은 액션입니다' },
        { status: 400 }
      )
    }
    
    // 관리자 권한 확인
    const adminUser = await verifyAdminAuth(request)
    
    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    // 이미 처리된 경우 확인
    if (user.status !== 'pending') {
      return NextResponse.json(
        { error: '이미 처리된 신청입니다' },
        { status: 400 }
      )
    }
    
    // 승인/거절 처리
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const { error: updateError } = await supabase
      .from('users')
      .update({
        status: newStatus,
        approved_at: new Date().toISOString(),
        approved_by: adminUser.id
      })
      .eq('id', id)
    
    if (updateError) {
      console.error('사용자 상태 업데이트 실패:', updateError)
      return NextResponse.json(
        { error: '처리 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }
    
    // 활동 로그 기록
    await logAdminActivity({
      action: `hospital_${action}`,
      description: `병원 ${action === 'approve' ? '승인' : '거절'}: ${user.hospital_name || user.name}`,
      admin_id: adminUser.id,
      admin_email: adminUser.email || '',
      metadata: {
        hospital_id: id,
        hospital_name: user.hospital_name,
        owner_name: user.name,
        email: user.email
      }
    })
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      message: `병원 ${action === 'approve' ? '승인' : '거절'}이 완료되었습니다`,
      data: {
        id: user.id,
        name: user.name,
        hospital_name: user.hospital_name,
        status: newStatus
      }
    })
    
  } catch (error) {
    console.error('승인/거절 처리 오류:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다' 
      },
      { status: 500 }
    )
  }
}