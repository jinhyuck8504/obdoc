import { createMocks } from 'node-mocks-http'
import handler from '../auth/invite-codes/validate'

// Mock dependencies
jest.mock('@/lib/inviteCodeService', () => ({
  validateInviteCodeClient: jest.fn()
}))

jest.mock('@/lib/inviteCodeSecurity', () => ({
  createSecurityLog: jest.fn().mockReturnValue({
    action: 'api_call',
    user_id: 'anonymous',
    ip_address: '127.0.0.1',
    user_agent: 'test-agent',
    details: {},
    success: true,
    timestamp: new Date().toISOString()
  })
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}))

const mockValidateInviteCodeClient = require('@/lib/inviteCodeService').validateInviteCodeClient

describe('/api/auth/invite-codes/validate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('유효한 가입 코드 검증이 성공한다', async () => {
    mockValidateInviteCodeClient.mockResolvedValue({
      isValid: true,
      hospitalInfo: {
        hospitalCode: 'OB-SEOUL-CLINIC-001',
        hospitalName: '테스트 의원',
        hospitalType: 'clinic',
        region: 'SEOUL',
        isActive: true,
        createdAt: new Date()
      },
      codeInfo: {
        expiresAt: new Date(Date.now() + 86400000),
        remainingUses: 5
      }
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        code: 'OB-SEOUL-CLINIC-001-202401-ABC12345'
      },
      headers: {
        'user-agent': 'test-agent'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.hospitalInfo).toBeDefined()
    expect(data.codeInfo).toBeDefined()
  })

  it('잘못된 가입 코드 검증이 실패한다', async () => {
    mockValidateInviteCodeClient.mockResolvedValue({
      isValid: false,
      error: '유효하지 않은 가입 코드입니다.',
      errorCode: 'NOT_FOUND'
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        code: 'INVALID-CODE'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error).toBe('유효하지 않은 가입 코드입니다.')
    expect(data.errorCode).toBe('NOT_FOUND')
  })

  it('POST 메소드가 아닌 요청은 거부된다', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error).toBe('Method not allowed')
  })

  it('코드가 없는 요청은 거부된다', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {}
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid request body')
  })

  it('너무 긴 코드는 거부된다', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        code: 'A'.repeat(101) // 100자 초과
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error).toBe('Code too long')
  })

  it('시스템 오류 시 500 에러를 반환한다', async () => {
    mockValidateInviteCodeClient.mockRejectedValue(new Error('Database error'))

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        code: 'OB-SEOUL-CLINIC-001-202401-ABC12345'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
  })

  // Rate limiting 테스트는 실제 환경에서는 더 복잡한 설정이 필요
  it('Rate limiting이 작동한다', async () => {
    // 동일한 IP에서 여러 번 요청
    const requests = Array.from({ length: 6 }, () => 
      createMocks({
        method: 'POST',
        body: { code: 'TEST-CODE' },
        socket: { remoteAddress: '192.168.1.100' }
      })
    )

    // 처음 5개 요청은 처리되어야 함
    for (let i = 0; i < 5; i++) {
      mockValidateInviteCodeClient.mockResolvedValue({
        isValid: false,
        error: 'Test error'
      })
      
      await handler(requests[i].req, requests[i].res)
      expect(requests[i].res._getStatusCode()).toBeLessThan(429)
    }

    // 6번째 요청은 rate limit에 걸려야 함
    await handler(requests[5].req, requests[5].res)
    expect(requests[5].res._getStatusCode()).toBe(429)
  })
})