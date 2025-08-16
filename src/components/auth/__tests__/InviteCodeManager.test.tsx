import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InviteCodeManager from '../InviteCodeManager'
import { InviteCode } from '@/types/hospital'

// Mock dependencies
jest.mock('@/lib/inviteCodeService', () => ({
  generateInviteCodeForDoctor: jest.fn(),
  getInviteCodesByDoctor: jest.fn(),
  deactivateInviteCode: jest.fn()
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined)
  }
})

const mockGenerateInviteCodeForDoctor = require('@/lib/inviteCodeService').generateInviteCodeForDoctor
const mockGetInviteCodesByDoctor = require('@/lib/inviteCodeService').getInviteCodesByDoctor
const mockDeactivateInviteCode = require('@/lib/inviteCodeService').deactivateInviteCode

const mockInviteCodes: InviteCode[] = [
  {
    id: '1',
    code: 'INV-TEST-001',
    hospitalCode: 'OB-SEOUL-CLINIC-001',
    description: '신규 고객용 가입 코드',
    maxUses: 10,
    usedCount: 3,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    expiresAt: new Date('2024-02-01'),
    lastUsedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    code: 'INV-TEST-002',
    hospitalCode: 'OB-SEOUL-CLINIC-001',
    description: '이벤트용 가입 코드',
    maxUses: 5,
    usedCount: 5,
    isActive: true,
    createdAt: new Date('2024-01-10'),
    expiresAt: new Date('2024-01-20'),
    lastUsedAt: new Date('2024-01-18')
  }
]

describe('InviteCodeManager', () => {
  const defaultProps = {
    doctorId: 'test-doctor-id',
    hospitalCode: 'OB-SEOUL-CLINIC-001',
    hospitalName: '테스트 의원'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetInviteCodesByDoctor.mockResolvedValue(mockInviteCodes)
  })

  it('컴포넌트가 올바르게 렌더링된다', async () => {
    render(<InviteCodeManager {...defaultProps} />)
    
    expect(screen.getByText('고객 가입 코드 관리')).toBeInTheDocument()
    expect(screen.getByText('테스트 의원의 고객 가입 코드를 생성하고 관리하세요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /새 코드 생성/ })).toBeInTheDocument()

    await waitFor(() => {
      expect(mockGetInviteCodesByDoctor).toHaveBeenCalledWith('test-doctor-id')
    })
  })

  it('가입 코드 목록이 올바르게 표시된다', async () => {
    render(<InviteCodeManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('INV-TEST-001')).toBeInTheDocument()
      expect(screen.getByText('INV-TEST-002')).toBeInTheDocument()
      expect(screen.getByText('신규 고객용 가입 코드')).toBeInTheDocument()
      expect(screen.getByText('이벤트용 가입 코드')).toBeInTheDocument()
    })
  })

  it('코드 상태가 올바르게 표시된다', async () => {
    render(<InviteCodeManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('활성')).toBeInTheDocument()
      expect(screen.getByText('사용완료')).toBeInTheDocument()
    })
  })

  it('새 코드 생성 폼이 작동한다', async () => {
    const user = userEvent.setup()
    
    mockGenerateInviteCodeForDoctor.mockResolvedValue({
      success: true,
      inviteCode: {
        id: '3',
        code: 'INV-TEST-003',
        hospitalCode: 'OB-SEOUL-CLINIC-001',
        description: '새로운 테스트 코드',
        maxUses: 20,
        usedCount: 0,
        isActive: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })

    render(<InviteCodeManager {...defaultProps} />)
    
    // 새 코드 생성 버튼 클릭
    const createButton = screen.getByRole('button', { name: /새 코드 생성/ })
    await user.click(createButton)

    // 폼이 표시되는지 확인
    expect(screen.getByText('새 가입 코드 생성')).toBeInTheDocument()
    
    // 폼 입력
    const descriptionInput = screen.getByLabelText(/코드 설명/)
    await user.type(descriptionInput, '새로운 테스트 코드')
    
    const maxUsesInput = screen.getByLabelText(/최대 사용 횟수/)
    await user.clear(maxUsesInput)
    await user.type(maxUsesInput, '20')

    // 코드 생성 버튼 클릭
    const generateButton = screen.getByRole('button', { name: '코드 생성' })
    await user.click(generateButton)

    await waitFor(() => {
      expect(mockGenerateInviteCodeForDoctor).toHaveBeenCalledWith(
        expect.objectContaining({
          hospitalCode: 'OB-SEOUL-CLINIC-001',
          description: '새로운 테스트 코드',
          maxUses: 20,
          isActive: true
        }),
        'test-doctor-id'
      )
    })
  })

  it('코드 복사 기능이 작동한다', async () => {
    const user = userEvent.setup()
    render(<InviteCodeManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('INV-TEST-001')).toBeInTheDocument()
    })

    const copyButtons = screen.getAllByTitle('코드 복사')
    await user.click(copyButtons[0])

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('INV-TEST-001')
  })

  it('코드 비활성화 기능이 작동한다', async () => {
    const user = userEvent.setup()
    
    // confirm 모킹
    window.confirm = jest.fn().mockReturnValue(true)
    
    mockDeactivateInviteCode.mockResolvedValue({ success: true })

    render(<InviteCodeManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('INV-TEST-001')).toBeInTheDocument()
    })

    const deactivateButtons = screen.getAllByTitle('코드 비활성화')
    await user.click(deactivateButtons[0])

    expect(window.confirm).toHaveBeenCalledWith('이 가입 코드를 비활성화하시겠습니까?')
    
    await waitFor(() => {
      expect(mockDeactivateInviteCode).toHaveBeenCalledWith('1', 'test-doctor-id')
    })
  })

  it('코드 공유 모달이 작동한다', async () => {
    const user = userEvent.setup()
    render(<InviteCodeManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('INV-TEST-001')).toBeInTheDocument()
    })

    const shareButtons = screen.getAllByTitle('코드 공유')
    await user.click(shareButtons[0])

    expect(screen.getByText('코드 공유')).toBeInTheDocument()
    expect(screen.getByText('QR 코드')).toBeInTheDocument()
    expect(screen.getByText('링크')).toBeInTheDocument()
    expect(screen.getByText('이메일')).toBeInTheDocument()
  })

  it('사용 내역 모달이 작동한다', async () => {
    const user = userEvent.setup()
    
    // Mock fetch for usage history
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve([
        {
          customerName: '홍길동',
          customerEmail: 'test@example.com',
          usedAt: new Date().toISOString(),
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0'
        }
      ])
    }) as jest.Mock

    render(<InviteCodeManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('INV-TEST-001')).toBeInTheDocument()
    })

    const historyButtons = screen.getAllByTitle('사용 내역 보기')
    await user.click(historyButtons[0])

    await waitFor(() => {
      expect(screen.getByText('코드 사용 내역')).toBeInTheDocument()
    })
  })

  it('알림 기능이 작동한다', async () => {
    const user = userEvent.setup()
    
    // Mock fetch for notifications
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve([
        {
          id: '1',
          type: 'invite_code_used',
          message: '새로운 고객이 가입 코드를 사용했습니다.',
          isRead: false,
          createdAt: new Date().toISOString()
        }
      ])
    }) as jest.Mock

    render(<InviteCodeManager {...defaultProps} />)
    
    await waitFor(() => {
      const notificationButton = screen.getByTitle('알림')
      expect(notificationButton).toBeInTheDocument()
      
      // 읽지 않은 알림 배지 확인
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    const notificationButton = screen.getByTitle('알림')
    await user.click(notificationButton)

    expect(screen.getByText('최근 알림')).toBeInTheDocument()
    expect(screen.getByText('새로운 고객이 가입 코드를 사용했습니다.')).toBeInTheDocument()
  })

  it('빈 목록 상태가 올바르게 표시된다', async () => {
    mockGetInviteCodesByDoctor.mockResolvedValue([])
    
    render(<InviteCodeManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('생성된 가입 코드가 없습니다.')).toBeInTheDocument()
      expect(screen.getByText('새 코드를 생성해보세요.')).toBeInTheDocument()
    })
  })

  it('로딩 상태가 올바르게 표시된다', () => {
    mockGetInviteCodesByDoctor.mockImplementation(() => new Promise(() => {})) // 무한 대기
    
    render(<InviteCodeManager {...defaultProps} />)
    
    expect(screen.getByText('가입 코드를 불러오는 중...')).toBeInTheDocument()
  })

  it('에러 상태가 올바르게 표시된다', async () => {
    mockGetInviteCodesByDoctor.mockRejectedValue(new Error('네트워크 오류'))
    
    render(<InviteCodeManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('오류 발생')).toBeInTheDocument()
      expect(screen.getByText('가입 코드 목록을 불러오는데 실패했습니다.')).toBeInTheDocument()
    })
  })

  it('새로고침 버튼이 작동한다', async () => {
    const user = userEvent.setup()
    render(<InviteCodeManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(mockGetInviteCodesByDoctor).toHaveBeenCalledTimes(1)
    })

    const refreshButton = screen.getByRole('button', { name: /새로고침/ })
    await user.click(refreshButton)

    expect(mockGetInviteCodesByDoctor).toHaveBeenCalledTimes(2)
  })

  it('폼 검증이 작동한다', async () => {
    const user = userEvent.setup()
    render(<InviteCodeManager {...defaultProps} />)
    
    const createButton = screen.getByRole('button', { name: /새 코드 생성/ })
    await user.click(createButton)

    // 빈 설명으로 생성 시도
    const generateButton = screen.getByRole('button', { name: '코드 생성' })
    expect(generateButton).toBeDisabled()
  })

  it('공유 방법 전환이 작동한다', async () => {
    const user = userEvent.setup()
    render(<InviteCodeManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('INV-TEST-001')).toBeInTheDocument()
    })

    const shareButtons = screen.getAllByTitle('코드 공유')
    await user.click(shareButtons[0])

    // 링크 탭 클릭
    const linkTab = screen.getByRole('button', { name: '링크' })
    await user.click(linkTab)

    expect(screen.getByText('가입 링크:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '링크 복사' })).toBeInTheDocument()

    // 이메일 탭 클릭
    const emailTab = screen.getByRole('button', { name: '이메일' })
    await user.click(emailTab)

    expect(screen.getByLabelText('받는 사람 이메일')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이메일 전송' })).toBeInTheDocument()
  })

  it('이메일 전송 기능이 작동한다', async () => {
    const user = userEvent.setup()
    
    // Mock fetch for email sending
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    }) as jest.Mock

    render(<InviteCodeManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('INV-TEST-001')).toBeInTheDocument()
    })

    const shareButtons = screen.getAllByTitle('코드 공유')
    await user.click(shareButtons[0])

    // 이메일 탭으로 전환
    const emailTab = screen.getByRole('button', { name: '이메일' })
    await user.click(emailTab)

    // 이메일 입력
    const emailInput = screen.getByLabelText('받는 사람 이메일')
    await user.type(emailInput, 'customer@example.com')

    // 전송 버튼 클릭
    const sendButton = screen.getByRole('button', { name: '이메일 전송' })
    await user.click(sendButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/invite-codes/share-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeId: '1',
          email: 'customer@example.com',
          hospitalName: '테스트 의원',
          doctorId: 'test-doctor-id'
        })
      })
    })
  })

  it('사용 내역이 없을 때 빈 상태가 표시된다', async () => {
    const user = userEvent.setup()
    
    // Mock empty usage history
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve([])
    }) as jest.Mock

    render(<InviteCodeManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('INV-TEST-001')).toBeInTheDocument()
    })

    const historyButtons = screen.getAllByTitle('사용 내역 보기')
    await user.click(historyButtons[0])

    await waitFor(() => {
      expect(screen.getByText('사용 내역이 없습니다.')).toBeInTheDocument()
    })
  })
})