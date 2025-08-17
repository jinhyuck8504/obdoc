// 병원 가입 코드 검증 API

import { NextRequest, NextResponse } from 'next/server'
import { verifyHospitalCode } from '@/lib/hospitalCodeService'
import { ERROR_MESSAGES } from '@/types/hospitalCode'
// TODO: 보안 모듈 임시 비활성화 (빌드 오류 해결 후 재활성화)
// import { hospitalCodeRateLimiter, globalRateLimiter } from '@/lib/security/rateLimiter'
// import { securityLogger, getClientIp, getUserAgent } from '@/lib/security/securityLogger'

// POST /api/hospital-codes/verify - 코드 검증
export async function POST(request: NextRequest) {
  // TODO: 보안 기능 임시 비활성화 (빌드 오류 해결 후 재활성화)
  // const clientIp = getClientIp(request)
  // const userAgent = getUserAgent(request)

  try {
    // TODO: Rate Limiting 임시 비활성화
    // 1. 전역 Rate Limiting 체크
    // 2. 병원 코드 전용 Rate Limiting 체크

    // 3. 요청 데이터 검증
    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      // TODO: 보안 로깅 임시 비활성화
      // securityLogger.logSuspiciousActivity(...)
      
      return NextResponse.json(
        { 
          error: 'INVALID_FORMAT',
          message: ERROR_MESSAGES.INVALID_FORMAT 
        },
        { status: 400 }
      )
    }

    // 4. 코드 형식 기본 검증 (8자리 영숫자)
    const codePattern = /^[A-Z0-9]{8}$/
    if (!codePattern.test(code)) {
      // TODO: 보안 로깅 임시 비활성화
      // securityLogger.logHospitalCodeFailure(...)
      
      return NextResponse.json(
        {
          error: 'INVALID_FORMAT',
          message: ERROR_MESSAGES.INVALID_FORMAT
        },
        { status: 400 }
      )
    }

    // 5. 코드 검증
    const result = await verifyHospitalCode(code)

    if (!result.success) {
      // TODO: 실패 로깅 임시 비활성화
      // securityLogger.logHospitalCodeFailure(...)
      
      return NextResponse.json(
        {
          error: 'INVALID_CODE',
          message: result.error || '유효하지 않은 병원 코드입니다.'
        },
        { status: 400 }
      )
    }

    // TODO: 성공 로깅 임시 비활성화
    // securityLogger.logHospitalCodeSuccess(...)

    // 성공 시 코드 정보 반환 (민감한 정보 제외)
    return NextResponse.json({
      isValid: true,
      hospitalData: result.hospitalData
    })
  } catch (error) {
    console.error('POST /api/hospital-codes/verify error:', error)
    
    // TODO: 서버 오류 로깅 임시 비활성화
    // securityLogger.logSuspiciousActivity(...)
    
    return NextResponse.json(
      { 
        error: 'SERVER_ERROR',
        message: '서버 오류가 발생했습니다.' 
      },
      { status: 500 }
    )
  }
}