import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { subscriptionId: string } }
) {
  try {
    const { subscriptionId } = params
    
    // 더미 응답 - 실제로는 데이터베이스 업데이트
    console.log(`구독 ${subscriptionId} 취소`)
    
    return NextResponse.json({
      success: true,
      message: '구독이 성공적으로 취소되었습니다.'
    })
    
  } catch (error) {
    console.error('구독 취소 API 오료:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}