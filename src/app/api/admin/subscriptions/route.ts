import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // 더미 데이터 반환
    const dummySubscriptions = [
      {
        id: '1',
        hospital_id: 'h1',
        hospital_name: '서울 종합병원',
        owner_name: '김의사',
        email: 'kim@hospital.com',
        plan: '12months',
        status: 'active',
        start_date: '2024-01-15T00:00:00Z',
        end_date: '2025-01-15T00:00:00Z',
        amount: 2028000,
        payment_method: '신용카드',
        auto_renewal: true,
        created_at: '2024-01-15T09:00:00Z',
        last_payment_date: '2024-01-15T09:00:00Z',
        next_payment_date: '2025-01-15T09:00:00Z'
      },
      {
        id: '2',
        hospital_id: 'h2',
        hospital_name: '강남 다이어트 클리닉',
        owner_name: '박원장',
        email: 'park@clinic.com',
        plan: '6months',
        status: 'active',
        start_date: '2024-01-18T00:00:00Z',
        end_date: '2024-07-18T00:00:00Z',
        amount: 1014000,
        payment_method: '계좌이체',
        auto_renewal: false,
        created_at: '2024-01-18T11:20:00Z',
        last_payment_date: '2024-01-18T11:20:00Z',
        next_payment_date: '2024-07-18T11:20:00Z'
      },
      {
        id: '3',
        hospital_id: 'h3',
        hospital_name: '부산 한의원',
        owner_name: '이한의사',
        email: 'lee@hanui.com',
        plan: '1month',
        status: 'expired',
        start_date: '2023-12-19T00:00:00Z',
        end_date: '2024-01-19T00:00:00Z',
        amount: 169000,
        payment_method: '신용카드',
        auto_renewal: true,
        created_at: '2023-12-19T13:15:00Z',
        last_payment_date: '2023-12-19T13:15:00Z'
      }
    ]
    
    return NextResponse.json({
      success: true,
      data: dummySubscriptions
    })
    
  } catch (error) {
    console.error('구독 목록 API 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}