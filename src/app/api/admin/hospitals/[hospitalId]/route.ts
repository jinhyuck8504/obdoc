import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { hospitalId: string } }
) {
  try {
    const { hospitalId } = params
    const body = await request.json()
    const { status } = body
    
    // 더미 응답 - 실제로는 데이터베이스 업데이트
    console.log(`병원 ${hospitalId}의 상태를 ${status}로 업데이트`)
    
    return NextResponse.json({
      success: true,
      message: '병원 상태가 성공적으로 업데이트되었습니다.'
    })
    
  } catch (error) {
    console.error('병원 상태 업데이트 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { hospitalId: string } }
) {
  try {
    const { hospitalId } = params
    
    // 더미 응답 - 실제로는 데이터베이스에서 삭제
    console.log(`병원 ${hospitalId} 삭제`)
    
    return NextResponse.json({
      success: true,
      message: '병원이 성공적으로 삭제되었습니다.'
    })
    
  } catch (error) {
    console.error('병원 삭제 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}