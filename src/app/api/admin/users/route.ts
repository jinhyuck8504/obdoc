import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // 더미 데이터 반환
    const dummyUsers = [
      {
        id: '1',
        email: 'doctor1@hospital.com',
        name: '김의사',
        role: 'doctor',
        status: 'approved',
        hospital_name: '서울 종합병원',
        created_at: '2024-01-15T09:00:00Z',
        last_login: '2024-01-20T14:30:00Z'
      },
      {
        id: '2',
        email: 'customer1@email.com',
        name: '이고객',
        role: 'customer',
        status: 'active',
        created_at: '2024-01-18T11:20:00Z',
        last_login: '2024-01-20T16:45:00Z'
      },
      {
        id: '3',
        email: 'doctor2@clinic.com',
        name: '박원장',
        role: 'doctor',
        status: 'pending',
        hospital_name: '강남 다이어트 클리닉',
        created_at: '2024-01-19T13:15:00Z'
      }
    ]
    
    return NextResponse.json({
      success: true,
      data: dummyUsers
    })
    
  } catch (error) {
    console.error('사용자 목록 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}