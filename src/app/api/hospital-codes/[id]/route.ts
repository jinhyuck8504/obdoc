// 병원 가입 코드 개별 관리 API

import { NextRequest, NextResponse } from 'next/server'
import { toggleHospitalCodeStatus } from '@/lib/hospitalCodeService'
import { supabase } from '@/lib/supabase'

// PUT /api/hospital-codes/[id] - 코드 상태 토글
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: codeId } = await params

    // 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사용자 정보 조회
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // 의사 정보 조회
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (doctorError || !doctor) {
      return NextResponse.json(
        { error: '의사 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    // 코드 상태 토글
    const updatedCode = await toggleHospitalCodeStatus(codeId, doctor.id)

    return NextResponse.json(updatedCode)
  } catch (error) {
    console.error('PUT /api/hospital-codes/[id] error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}