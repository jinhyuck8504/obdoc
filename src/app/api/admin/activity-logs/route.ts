import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth, createServerClient } from '@/lib/server-auth'

// GET: 활동 로그 조회
export async function GET(request: NextRequest) {
  try {
    // 실제 관리자 권한 확인
    await verifyAdminAuth(request)
    
    // URL 파라미터 추출
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const supabase = createServerClient()
    
    // 실제 데이터베이스에서 활동 로그 조회
    const { data: activityLogs, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) {
      console.error('활동 로그 조회 실패:', error)
      return NextResponse.json({
        success: false,
        error: '활동 로그 조회 중 오류가 발생했습니다'
      }, { status: 500 })
    }
    
    // 데이터 포맷팅
    const formattedLogs = (activityLogs || []).map(log => ({
      id: log.id,
      action: log.action,
      description: log.description,
      admin_email: log.admin_email || 'system@obdoc.com',
      created_at: log.created_at,
      metadata: log.metadata || {},
      time_ago: getTimeAgo(new Date(log.created_at))
    }))
    
    return NextResponse.json({
      success: true,
      data: formattedLogs,
      pagination: {
        limit,
        offset,
        total: formattedLogs.length
      }
    })
    
  } catch (error) {
    console.error('활동 로그 조회 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// POST: 새 활동 로그 생성
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const adminUser = await verifyAdminAuth(request)
    
    // 요청 본문 파싱
    const body = await request.json()
    const { action, description, metadata } = body
    
    if (!action || !description) {
      return NextResponse.json(
        { error: 'action과 description은 필수입니다' },
        { status: 400 }
      )
    }
    
    const supabase = createServerClient()
    
    // 활동 로그 생성
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          action,
          description,
          admin_id: adminUser.id,
          admin_email: adminUser.email,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      return NextResponse.json({
        success: true,
        data: data
      })
      
    } catch (dbError) {
      console.warn('activity_logs 테이블에 삽입 실패:', dbError)
      
      // 테이블이 없는 경우에도 성공으로 처리 (로그는 콘솔에만)
      console.log('Activity Log:', { action, description, admin: adminUser.email, metadata })
      
      return NextResponse.json({
        success: true,
        message: '활동이 기록되었습니다 (로컬 로그)',
        data: {
          id: Date.now().toString(),
          action,
          description,
          admin_email: adminUser.email,
          created_at: new Date().toISOString(),
          metadata
        }
      })
    }
    
  } catch (error) {
    console.error('활동 로그 생성 API 오류:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다' 
      },
      { status: 500 }
    )
  }
}

// 시간 차이 계산 함수
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}초 전`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}분 전`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}시간 전`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}일 전`
  }
}