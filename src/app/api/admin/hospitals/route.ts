import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // 더미 데이터 반환
    const dummyHospitals = [
      {
        id: '1',
        hospital_code: 'H001',
        name: '서울 종합병원',
        owner_name: '김의사',
        email: 'kim@hospital.com',
        phone: '02-1234-5678',
        address: '서울시 강남구 테헤란로 123',
        hospital_type: 'hospital',
        subscription_plan: '12months',
        status: 'approved',
        created_at: '2024-01-15T09:00:00Z',
        approved_at: '2024-01-16T10:30:00Z',
        subscription_expires_at: '2025-01-15T09:00:00Z'
      },
      {
        id: '2',
        hospital_code: 'C001',
        name: '강남 다이어트 클리닉',
        owner_name: '박원장',
        email: 'park@clinic.com',
        phone: '02-9876-5432',
        address: '서울시 강남구 역삼동 456',
        hospital_type: 'clinic',
        subscription_plan: '6months',
        status: 'approved',
        created_at: '2024-01-18T11:20:00Z',
        approved_at: '2024-01-19T14:15:00Z',
        subscription_expires_at: '2024-07-18T11:20:00Z'
      },
      {
        id: '3',
        hospital_code: 'K001',
        name: '부산 한의원',
        owner_name: '이한의사',
        email: 'lee@hanui.com',
        phone: '051-1111-2222',
        address: '부산시 해운대구 센텀로 789',
        hospital_type: 'korean_medicine',
        subscription_plan: '1month',
        status: 'pending',
        created_at: '2024-01-19T13:15:00Z'
      }
    ]
    
    return NextResponse.json({
      success: true,
      data: dummyHospitals
    })
    
  } catch (error) {
    console.error('병원 목록 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}