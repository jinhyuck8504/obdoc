/**
 * 보안 강화된 API 엔드포인트 테스트
 * Rate limiting, 인증, 권한 확인 등 보안 기능을 테스트합니다.
 */
import { createMocks } from 'node-mocks-http'
import { NextApiRequest, NextApiResponse } from 'next'
import generateInviteCodeHandler from '../auth/invite-codes/generate'
import validateInviteCodeHandler from '../auth/invite-codes/validate'
import listInviteCodesHandler from '../auth/invite-codes/list'
import deactivateInviteCodeHandler from '../auth/invite-codes/[codeId]/deactivate'
import securityAlertsHandler from '../admin/security/alerts'
import auditLogsHandler from '../admin/audit-logs'
import systemHealthHandler from '../admin/system/health'
import jwt from 'jsonwebtoken'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          range: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }))
    }))
  }
}))

// Mock services
jest.mock('@/lib/inviteCodeService')
jest.mock('@/lib/hospitalCodeService')
jest.mock('@/lib/inviteCodeSecurity')

// JWT 토큰 생성 헬퍼
const createJWTToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' })
}

describe('보안 강화된 API 엔드포인트 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Rate limiter 초기화
    jest.resetModules()
  })

  describe('인증 및 권한 테스트', () => {
    it('인증 토큰 없이 요청 시 401 에러를 반환한다', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          hospitalCode: 'OB-TEST-001',
          description: 'Test code'
        }
      })

      await generateInviteCodeHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Authentication required'
      })
    })

    it('잘못된 토큰으로 요청 시 401 에러를 반환한다', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: 'Bearer invalid-token'
        },
        body: {
          hospitalCode: 'OB-TEST-001',
          description: 'Test code'
        }
      })

      await generateInviteCodeHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Invalid authentication token'
      })
    })

    it('의사가 아닌 사용자의 요청 시 401 에러를 반환한다', async () => {
      const token = createJWTToken({ sub: 'user-1', role: 'customer' })
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`
        },
        body: {
          hospitalCode: 'OB-TEST-001',
          description: 'Test code'
        }
      })

      await generateInviteCodeHandler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Doctor authentication required'
      })
    })

    it('관리자가 아닌 사용자의 관리자 API 요청 시 403 에러를 반환한다', async () => {
      const token = createJWTToken({ sub: 'user-1', role: 'doctor' })
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      await securityAlertsHandler(req, res)

      expect(res._getStatusCode()).toBe(403)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Administrator permission required'
      })
    })
  })

  describe('Rate Limiting 테스트', () => {
    it('Rate limit 초과 시 429 에러를 반환한다', async () => {
      const token = createJWTToken({ sub: 'doctor-1', role: 'doctor' })
      
      // Rate limit을 초과하는 요청들을 보냄
      for (let i = 0; i < 10; i++) {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
            'x-forwarded-for': '192.168.1.100'
          },
          body: {
            hospitalCode: 'OB-TEST-001',
            description: `Test code ${i}`
          }
        })

        await generateInviteCodeHandler(req, res)

        if (i >= 5) { // strictRateLimiter의 기본 제한은 5개
          expect(res._getStatusCode()).toBe(429)
          const responseData = JSON.parse(res._getData())
          expect(responseData.success).toBe(false)
          expect(responseData.error).toContain('Too many requests')
        }
      }
    })

    it('다른 IP에서의 요청은 독립적으로 Rate limit이 적용된다', async () => {
      const token = createJWTToken({ sub: 'doctor-1', role: 'doctor' })
      
      // 첫 번째 IP에서 요청
      const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'x-forwarded-for': '192.168.1.100'
        },
        body: {
          hospitalCode: 'OB-TEST-001',
          description: 'Test code 1'
        }
      })

      // 두 번째 IP에서 요청
      const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'x-forwarded-for': '192.168.1.101'
        },
        body: {
          hospitalCode: 'OB-TEST-001',
          description: 'Test code 2'
        }
      })

      await generateInviteCodeHandler(req1, res1)
      await generateInviteCodeHandler(req2, res2)

      // 두 요청 모두 성공해야 함 (다른 IP이므로)
      expect(res1._getStatusCode()).not.toBe(429)
      expect(res2._getStatusCode()).not.toBe(429)
    })
  })

  describe('입력 검증 테스트', () => {
    it('잘못된 HTTP 메서드 사용 시 405 에러를 반환한다', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'DELETE'
      })

      await generateInviteCodeHandler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Method not allowed'
      })
    })

    it('필수 필드 누락 시 400 에러를 반환한다', async () => {
      const token = createJWTToken({ sub: 'doctor-1', role: 'doctor' })
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`
        },
        body: {
          // hospitalCode 누락
          description: 'Test code'
        }
      })

      await generateInviteCodeHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Hospital code is required'
      })
    })

    it('잘못된 데이터 타입 사용 시 400 에러를 반환한다', async () => {
      const token = createJWTToken({ sub: 'doctor-1', role: 'doctor' })
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`
        },
        body: {
          hospitalCode: 123, // 문자열이어야 함
          description: 'Test code'
        }
      })

      await generateInviteCodeHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Hospital code is required'
      })
    })

    it('너무 긴 입력값 사용 시 400 에러를 반환한다', async () => {
      const token = createJWTToken({ sub: 'doctor-1', role: 'doctor' })
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`
        },
        body: {
          hospitalCode: 'OB-TEST-001',
          description: 'A'.repeat(300) // 200자 제한 초과
        }
      })

      await generateInviteCodeHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Valid description is required (max 200 chars)'
      })
    })
  })

  describe('보안 헤더 테스트', () => {
    it('응답에 보안 헤더가 포함되어야 한다', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { code: 'INV-TEST-001' }
      })

      await validateInviteCodeHandler(req, res)

      expect(res.getHeader('X-Content-Type-Options')).toBe('nosniff')
      expect(res.getHeader('X-Frame-Options')).toBe('DENY')
      expect(res.getHeader('X-XSS-Protection')).toBe('1; mode=block')
    })

    it('Rate limit 헤더가 포함되어야 한다', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { code: 'INV-TEST-001' }
      })

      await validateInviteCodeHandler(req, res)

      expect(res.getHeader('X-RateLimit-Limit')).toBeDefined()
      expect(res.getHeader('X-RateLimit-Remaining')).toBeDefined()
      expect(res.getHeader('X-RateLimit-Reset')).toBeDefined()
    })
  })

  describe('SQL Injection 방어 테스트', () => {
    it('SQL Injection 패턴 감지 시 400 에러를 반환한다', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          code: "'; DROP TABLE users; --"
        }
      })

      await validateInviteCodeHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Invalid input detected'
      })
    })

    it('정상적인 입력은 통과해야 한다', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          code: 'INV-TEST-001'
        }
      })

      await validateInviteCodeHandler(req, res)

      // SQL Injection 검사를 통과해야 함 (다른 이유로 실패할 수 있음)
      expect(res._getStatusCode()).not.toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData.error).not.toBe('Invalid input detected')
    })
  })

  describe('관리자 API 보안 테스트', () => {
    it('관리자 권한 없이 보안 알림 조회 시 403 에러를 반환한다', async () => {
      const token = createJWTToken({ sub: 'user-1', role: 'doctor' })
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      await securityAlertsHandler(req, res)

      expect(res._getStatusCode()).toBe(403)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Administrator permission required'
      })
    })

    it('관리자 권한 없이 감사 로그 조회 시 403 에러를 반환한다', async () => {
      const token = createJWTToken({ sub: 'user-1', role: 'doctor' })
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      await auditLogsHandler(req, res)

      expect(res._getStatusCode()).toBe(403)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Administrator permission required'
      })
    })

    it('관리자 권한 없이 시스템 상태 조회 시 403 에러를 반환한다', async () => {
      const token = createJWTToken({ sub: 'user-1', role: 'doctor' })
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      await systemHealthHandler(req, res)

      expect(res._getStatusCode()).toBe(403)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Administrator permission required'
      })
    })
  })

  describe('쿼리 파라미터 검증 테스트', () => {
    it('잘못된 페이지 번호 사용 시 400 에러를 반환한다', async () => {
      const token = createJWTToken({ sub: 'admin-1', role: 'admin' })
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          page: '-1'
        }
      })

      await auditLogsHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Invalid page number (1-10000)'
      })
    })

    it('잘못된 제한 수 사용 시 400 에러를 반환한다', async () => {
      const token = createJWTToken({ sub: 'admin-1', role: 'admin' })
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          limit: '2000'
        }
      })

      await auditLogsHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Invalid limit (1-1000)'
      })
    })

    it('잘못된 날짜 형식 사용 시 400 에러를 반환한다', async () => {
      const token = createJWTToken({ sub: 'admin-1', role: 'admin' })
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          startDate: 'invalid-date'
        }
      })

      await auditLogsHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Invalid start date format'
      })
    })
  })

  describe('에러 처리 테스트', () => {
    it('예상치 못한 에러 발생 시 500 에러를 반환한다', async () => {
      // Supabase mock을 에러를 던지도록 설정
      const mockSupabase = require('@/lib/supabase')
      mockSupabase.supabase.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { code: 'INV-TEST-001' }
      })

      await validateInviteCodeHandler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Internal server error'
      })
    })
  })

  describe('감사 로그 기록 테스트', () => {
    it('모든 API 호출이 감사 로그에 기록되어야 한다', async () => {
      const mockSupabase = require('@/lib/supabase')
      const insertMock = jest.fn().mockResolvedValue({ data: null, error: null })
      
      mockSupabase.supabase.from.mockReturnValue({
        insert: insertMock,
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { code: 'INV-TEST-001' }
      })

      await validateInviteCodeHandler(req, res)

      // 감사 로그 삽입이 호출되었는지 확인
      expect(insertMock).toHaveBeenCalled()
    })
  })
})