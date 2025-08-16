import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import CustomerSignupForm from '../CustomerSignupForm'
import { CustomerFormData } from '@/types/user'
import { HospitalData } from '@/types/hospital'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      admin: {
        deleteUser: jest.fn()
      }
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          limit: jest.fn(() => ({
            then: jest.fn()
          })),
          single: jest.fn(() => ({
            then: jest.fn()
          }))
        }))
      })),
      insert: jest.fn(() => ({
        then: jest.fn()
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          then: jest.fn()
        }))
      }))
    }))
  }
}))

jest.mock('@/lib/inviteCodeService', () => ({
  useInviteCode: jest.fn()
}))

jest.mock('@/lib/inviteCodeSecurity', () => ({
  createSecurityLog: jest.fn()
}))

// Mock fetch for IP address
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ ip: '127.0.0.1' })
  })
) as jest.Mock

const mockPush = jest.fn()
const mockUseInviteCode = require('@/lib/inviteCodeService').useInviteCode
const mockSupabase = require('@/lib/supabase').supabase

const mockHospitalData: HospitalData = {
  hospitalCode: 'OB-SEOUL-CLINIC-001',
  hospitalName: '테스트 의원',
  hospitalType: 'clinic',
  region: 'SEOUL',
  address: '서울시 강남구 테스트로 123',
  isActive: true,
  createdAt: new Date()
}

describe('CustomerSignupForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    })

    // Default successful mocks
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      }),
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })

    mockUseInviteCode.mockResolvedValue({ success: true, error: null })
  })

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onBack: mockOnBack
  }

  describe('기본 렌더링', () => {
    it('1단계(가입 코드 확인)가 기본으로 표시된다', () => {
      render(<CustomerSignupForm {...defaultProps} />)
      
      expect(screen.getByText('고객 회원가입')).toBeInTheDocument()
      expect(screen.getByText('병원에서 제공받은 가입 코드를 입력해주세요.')).toBeInTheDocument()
      expect(screen.getByLabelText(/병원 가입 코드/)).toBeInTheDocument()
    })

    it('진행 상황 표시가 올바르게 렌더링된다', () => {
      render(<CustomerSignupForm {...defaultProps} />)
      
      expect(screen.getByText('1. 가입 코드 확인')).toBeInTheDocument()
      expect(screen.getByText('2. 회원 정보 입력')).toBeInTheDocument()
      
      // 진행률 바가 50%로 설정되어 있는지 확인
      const progressBar = screen.getByRole('progressbar', { hidden: true })
      expect(progressBar).toHaveStyle('width: 50%')
    })
  })

  describe('가입 코드 검증 단계', () => {
    it('유효한 가입 코드 입력 시 2단계로 진행된다', async () => {
      // InviteCodeValidator를 모킹하여 자동으로 성공 콜백 호출
      jest.doMock('../InviteCodeValidator', () => {
        return function MockInviteCodeValidator({ onCodeValidated }: any) {
          React.useEffect(() => {
            // 컴포넌트 마운트 시 자동으로 성공 콜백 호출
            setTimeout(() => {
              onCodeValidated(mockHospitalData, 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5')
            }, 100)
          }, [onCodeValidated])
          
          return <div data-testid="invite-code-validator">Mock InviteCodeValidator</div>
        }
      })

      render(<CustomerSignupForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('회원 정보를 입력해주세요.')).toBeInTheDocument()
        expect(screen.getByLabelText(/이메일/)).toBeInTheDocument()
      })
    })
  })

  describe('회원 정보 입력 단계', () => {
    beforeEach(async () => {
      // InviteCodeValidator를 모킹하여 자동으로 성공 콜백 호출
      jest.doMock('../InviteCodeValidator', () => {
        return function MockInviteCodeValidator({ onCodeValidated }: any) {
          React.useEffect(() => {
            onCodeValidated(mockHospitalData, 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5')
          }, [onCodeValidated])
          
          return <div data-testid="invite-code-validator">Mock InviteCodeValidator</div>
        }
      })

      render(<CustomerSignupForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/이메일/)).toBeInTheDocument()
      })
    })

    it('모든 필수 필드가 표시된다', () => {
      expect(screen.getByLabelText(/이메일/)).toBeInTheDocument()
      expect(screen.getByLabelText(/^비밀번호/)).toBeInTheDocument()
      expect(screen.getByLabelText(/비밀번호 확인/)).toBeInTheDocument()
      expect(screen.getByLabelText(/이름/)).toBeInTheDocument()
      expect(screen.getByLabelText(/전화번호/)).toBeInTheDocument()
    })

    it('약관 동의 체크박스가 표시된다', () => {
      expect(screen.getByText(/서비스 이용약관에 동의합니다/)).toBeInTheDocument()
      expect(screen.getByText(/개인정보 처리방침에 동의합니다/)).toBeInTheDocument()
    })

    it('검증된 병원 정보가 요약으로 표시된다', () => {
      expect(screen.getByText(mockHospitalData.hospitalName)).toBeInTheDocument()
      expect(screen.getByText(/소속으로 가입/)).toBeInTheDocument()
    })
  })

  describe('폼 검증', () => {
    beforeEach(async () => {
      // InviteCodeValidator를 모킹하여 자동으로 성공 콜백 호출
      jest.doMock('../InviteCodeValidator', () => {
        return function MockInviteCodeValidator({ onCodeValidated }: any) {
          React.useEffect(() => {
            onCodeValidated(mockHospitalData, 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5')
          }, [onCodeValidated])
          
          return <div data-testid="invite-code-validator">Mock InviteCodeValidator</div>
        }
      })

      render(<CustomerSignupForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/이메일/)).toBeInTheDocument()
      })
    })

    it('빈 필드로 제출 시 검증 오류가 표시된다', async () => {
      const user = userEvent.setup()
      
      const submitButton = screen.getByRole('button', { name: /회원가입 완료/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/이메일을 입력해주세요/)).toBeInTheDocument()
        expect(screen.getByText(/비밀번호를 입력해주세요/)).toBeInTheDocument()
        expect(screen.getByText(/서비스 이용약관에 동의해주세요/)).toBeInTheDocument()
      })
    })

    it('잘못된 이메일 형식 시 오류 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      
      const emailInput = screen.getByLabelText(/이메일/)
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /회원가입 완료/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/올바른 이메일 형식을 입력해주세요/)).toBeInTheDocument()
      })
    })

    it('약한 비밀번호 시 경고 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      
      const passwordInput = screen.getByLabelText(/^비밀번호/)
      await user.type(passwordInput, '123456')

      await waitFor(() => {
        expect(screen.getByText(/더 강한 비밀번호를 사용해주세요/)).toBeInTheDocument()
      })
    })

    it('비밀번호 불일치 시 오류 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      
      const passwordInput = screen.getByLabelText(/^비밀번호/)
      const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/)
      
      await user.type(passwordInput, 'Password123!')
      await user.type(confirmPasswordInput, 'DifferentPassword123!')

      const submitButton = screen.getByRole('button', { name: /회원가입 완료/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/비밀번호가 일치하지 않습니다/)).toBeInTheDocument()
      })
    })
  })

  describe('비밀번호 강도 표시', () => {
    beforeEach(async () => {
      // InviteCodeValidator를 모킹하여 자동으로 성공 콜백 호출
      jest.doMock('../InviteCodeValidator', () => {
        return function MockInviteCodeValidator({ onCodeValidated }: any) {
          React.useEffect(() => {
            onCodeValidated(mockHospitalData, 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5')
          }, [onCodeValidated])
          
          return <div data-testid="invite-code-validator">Mock InviteCodeValidator</div>
        }
      })

      render(<CustomerSignupForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/이메일/)).toBeInTheDocument()
      })
    })

    it('비밀번호 입력 시 강도가 표시된다', async () => {
      const user = userEvent.setup()
      
      const passwordInput = screen.getByLabelText(/^비밀번호/)
      await user.type(passwordInput, 'WeakPass123!')

      await waitFor(() => {
        expect(screen.getByText(/비밀번호 강도/)).toBeInTheDocument()
        expect(screen.getByText(/8자 이상 ✓/)).toBeInTheDocument()
        expect(screen.getByText(/영문 포함 ✓/)).toBeInTheDocument()
        expect(screen.getByText(/숫자 포함 ✓/)).toBeInTheDocument()
        expect(screen.getByText(/특수문자 포함 ✓/)).toBeInTheDocument()
      })
    })
  })

  describe('이메일 중복 확인', () => {
    beforeEach(async () => {
      // InviteCodeValidator를 모킹하여 자동으로 성공 콜백 호출
      jest.doMock('../InviteCodeValidator', () => {
        return function MockInviteCodeValidator({ onCodeValidated }: any) {
          React.useEffect(() => {
            onCodeValidated(mockHospitalData, 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5')
          }, [onCodeValidated])
          
          return <div data-testid="invite-code-validator">Mock InviteCodeValidator</div>
        }
      })

      render(<CustomerSignupForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/이메일/)).toBeInTheDocument()
      })
    })

    it('사용 가능한 이메일 시 확인 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      
      // 이메일 중복 확인 성공 모킹
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      })

      const emailInput = screen.getByLabelText(/이메일/)
      await user.type(emailInput, 'available@example.com')

      await waitFor(() => {
        expect(screen.getByText(/사용 가능한 이메일입니다/)).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('중복된 이메일 시 오류 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      
      // 이메일 중복 확인 실패 모킹
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ 
              data: [{ email: 'duplicate@example.com' }], 
              error: null 
            })
          })
        })
      })

      const emailInput = screen.getByLabelText(/이메일/)
      await user.type(emailInput, 'duplicate@example.com')

      await waitFor(() => {
        expect(screen.getByText(/이미 사용 중인 이메일입니다/)).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('회원가입 제출', () => {
    beforeEach(async () => {
      // InviteCodeValidator를 모킹하여 자동으로 성공 콜백 호출
      jest.doMock('../InviteCodeValidator', () => {
        return function MockInviteCodeValidator({ onCodeValidated }: any) {
          React.useEffect(() => {
            onCodeValidated(mockHospitalData, 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5')
          }, [onCodeValidated])
          
          return <div data-testid="invite-code-validator">Mock InviteCodeValidator</div>
        }
      })

      render(<CustomerSignupForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/이메일/)).toBeInTheDocument()
      })
    })

    it('유효한 정보로 회원가입이 성공한다', async () => {
      const user = userEvent.setup()
      
      // 폼 입력
      await user.type(screen.getByLabelText(/이메일/), 'test@example.com')
      await user.type(screen.getByLabelText(/^비밀번호/), 'StrongPassword123!')
      await user.type(screen.getByLabelText(/비밀번호 확인/), 'StrongPassword123!')
      await user.type(screen.getByLabelText(/이름/), '홍길동')
      await user.type(screen.getByLabelText(/전화번호/), '010-1234-5678')
      
      // 약관 동의
      await user.click(screen.getByRole('checkbox', { name: /서비스 이용약관/ }))
      await user.click(screen.getByRole('checkbox', { name: /개인정보 처리방침/ }))

      // 제출
      const submitButton = screen.getByRole('button', { name: /회원가입 완료/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          options: {
            data: {
              role: 'customer',
              name: '홍길동',
              phone: '010-1234-5678',
              hospital_code: mockHospitalData.hospitalCode,
              signup_method: 'invite_code'
            }
          }
        })
      })

      expect(mockUseInviteCode).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/dashboard/customer?welcome=true')
    })

    it('onSubmit prop이 제공된 경우 해당 함수가 호출된다', async () => {
      const user = userEvent.setup()
      
      // 폼 입력
      await user.type(screen.getByLabelText(/이메일/), 'test@example.com')
      await user.type(screen.getByLabelText(/^비밀번호/), 'StrongPassword123!')
      await user.type(screen.getByLabelText(/비밀번호 확인/), 'StrongPassword123!')
      
      // 약관 동의
      await user.click(screen.getByRole('checkbox', { name: /서비스 이용약관/ }))
      await user.click(screen.getByRole('checkbox', { name: /개인정보 처리방침/ }))

      // 제출
      const submitButton = screen.getByRole('button', { name: /회원가입 완료/ })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          role: 'customer',
          email: 'test@example.com',
          password: 'StrongPassword123!',
          confirmPassword: 'StrongPassword123!',
          name: '',
          phone: '',
          inviteCode: 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5',
          hospitalCode: mockHospitalData.hospitalCode
        })
      })
    })
  })

  describe('네비게이션', () => {
    it('2단계에서 이전 버튼 클릭 시 1단계로 돌아간다', async () => {
      const user = userEvent.setup()
      
      // InviteCodeValidator를 모킹하여 자동으로 성공 콜백 호출
      jest.doMock('../InviteCodeValidator', () => {
        return function MockInviteCodeValidator({ onCodeValidated }: any) {
          React.useEffect(() => {
            onCodeValidated(mockHospitalData, 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5')
          }, [onCodeValidated])
          
          return <div data-testid="invite-code-validator">Mock InviteCodeValidator</div>
        }
      })

      render(<CustomerSignupForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('회원 정보를 입력해주세요.')).toBeInTheDocument()
      })

      // 이전 버튼 클릭
      const backButton = screen.getByRole('button', { name: /이전/ })
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.getByText('병원에서 제공받은 가입 코드를 입력해주세요.')).toBeInTheDocument()
      })
    })

    it('1단계에서 뒤로 가기 버튼 클릭 시 onBack이 호출된다', async () => {
      const user = userEvent.setup()
      render(<CustomerSignupForm {...defaultProps} />)
      
      const backButton = screen.getByRole('button', { name: /역할 선택으로 돌아가기/ })
      await user.click(backButton)

      expect(mockOnBack).toHaveBeenCalled()
    })
  })

  describe('로딩 상태', () => {
    it('제출 중 로딩 상태가 표시된다', async () => {
      const user = userEvent.setup()
      
      // 느린 응답 시뮬레이션
      mockSupabase.auth.signUp.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          data: { user: { id: 'test-user-id' } },
          error: null
        }), 1000))
      )

      // InviteCodeValidator를 모킹하여 자동으로 성공 콜백 호출
      jest.doMock('../InviteCodeValidator', () => {
        return function MockInviteCodeValidator({ onCodeValidated }: any) {
          React.useEffect(() => {
            onCodeValidated(mockHospitalData, 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5')
          }, [onCodeValidated])
          
          return <div data-testid="invite-code-validator">Mock InviteCodeValidator</div>
        }
      })

      render(<CustomerSignupForm {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/이메일/)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/이메일/), 'test@example.com')
      await user.type(screen.getByLabelText(/^비밀번호/), 'StrongPassword123!')
      await user.type(screen.getByLabelText(/비밀번호 확인/), 'StrongPassword123!')
      await user.click(screen.getByRole('checkbox', { name: /서비스 이용약관/ }))
      await user.click(screen.getByRole('checkbox', { name: /개인정보 처리방침/ }))

      const submitButton = screen.getByRole('button', { name: /회원가입 완료/ })
      await user.click(submitButton)

      expect(screen.getByText(/가입 중.../)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })
})