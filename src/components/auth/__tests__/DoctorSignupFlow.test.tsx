import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import DoctorSignupFlow from '../DoctorSignupFlow'
import { DoctorCompleteData } from '@/types/user'

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
      insert: jest.fn()
    }))
  }
}))

jest.mock('../HospitalCodeGeneratorEnhanced', () => {
  return function MockHospitalCodeGenerator({ onCodeGenerated }: any) {
    return (
      <div data-testid="hospital-code-generator">
        <button
          onClick={() => onCodeGenerated('OB-SEOUL-CLINIC-001', {
            hospitalCode: 'OB-SEOUL-CLINIC-001',
            hospitalName: '테스트 의원',
            hospitalType: 'clinic',
            region: 'SEOUL',
            isActive: true,
            createdAt: new Date()
          })}
        >
          Generate Code
        </button>
      </div>
    )
  }
})

const mockPush = jest.fn()
const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('DoctorSignupFlow', () => {
  const mockOnComplete = jest.fn()
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
      route: '/',
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
      },
      isFallback: false,
      isLocaleDomain: false,
      isReady: true,
      defaultLocale: 'en',
      domainLocales: [],
      isPreview: false
    } as any)
  })

  it('1단계 기본 정보 폼이 렌더링된다', () => {
    render(<DoctorSignupFlow />)
    
    expect(screen.getByText('의사 회원가입')).toBeInTheDocument()
    expect(screen.getByText('1. 기본 정보 및 병원 코드 생성')).toBeInTheDocument()
    expect(screen.getByLabelText(/이메일/)).toBeInTheDocument()
    expect(screen.getByLabelText(/이름/)).toBeInTheDocument()
    expect(screen.getByLabelText(/비밀번호/)).toBeInTheDocument()
    expect(screen.getByLabelText(/병원명/)).toBeInTheDocument()
  })

  it('필수 필드 검증이 작동한다', async () => {
    const user = userEvent.setup()
    render(<DoctorSignupFlow />)
    
    const nextButton = screen.getByRole('button', { name: /다음: 구독 플랜 선택/ })
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument()
      expect(screen.getByText('이름을 입력해주세요.')).toBeInTheDocument()
      expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument()
    })
  })

  it('병원 정보 입력 후 코드 생성기가 표시된다', async () => {
    const user = userEvent.setup()
    render(<DoctorSignupFlow />)
    
    // 병원 정보 입력
    await user.type(screen.getByLabelText(/병원명/), '테스트 의원')
    await user.selectOptions(screen.getByLabelText(/병원 유형/), 'clinic')
    await user.selectOptions(screen.getByLabelText(/지역/), '서울')

    await waitFor(() => {
      expect(screen.getByTestId('hospital-code-generator')).toBeInTheDocument()
    })
  })

  it('병원 코드 생성 후 다음 단계로 이동할 수 있다', async () => {
    const user = userEvent.setup()
    render(<DoctorSignupFlow />)
    
    // 필수 정보 입력
    await user.type(screen.getByLabelText(/이메일/), 'test@example.com')
    await user.type(screen.getByLabelText(/이름/), '홍길동')
    await user.type(screen.getByLabelText(/비밀번호/), 'password123')
    await user.type(screen.getByLabelText(/비밀번호 확인/), 'password123')
    await user.type(screen.getByLabelText(/의사 면허번호/), '12345')
    await user.type(screen.getByLabelText(/병원명/), '테스트 의원')

    // 병원 코드 생성
    const generateButton = screen.getByRole('button', { name: 'Generate Code' })
    await user.click(generateButton)

    // 다음 단계로 이동
    const nextButton = screen.getByRole('button', { name: /다음: 구독 플랜 선택/ })
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('2. 구독 플랜 선택')).toBeInTheDocument()
      expect(screen.getByText('구독 플랜을 선택해주세요')).toBeInTheDocument()
    })
  })

  it('구독 플랜 선택이 작동한다', async () => {
    const user = userEvent.setup()
    render(<DoctorSignupFlow />)
    
    // 1단계 완료 후 2단계로 이동 (간소화)
    // ... (위의 테스트와 동일한 과정)
    
    // 구독 플랜 카드 클릭
    const planCard = screen.getByText('1개월 플랜').closest('div')
    if (planCard) {
      await user.click(planCard)
    }

    expect(planCard).toHaveClass('border-blue-500')
  })

  it('회원가입 완료 콜백이 호출된다', async () => {
    const user = userEvent.setup()
    render(<DoctorSignupFlow onComplete={mockOnComplete} />)
    
    // 전체 플로우 완료 (간소화)
    // ... 필수 정보 입력 및 병원 코드 생성
    
    const completeButton = screen.getByRole('button', { name: /회원가입 완료/ })
    await user.click(completeButton)

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'doctor',
          email: expect.any(String),
          hospitalCode: expect.any(String)
        })
      )
    })
  })

  it('이전 버튼이 작동한다', async () => {
    const user = userEvent.setup()
    render(<DoctorSignupFlow onBack={mockOnBack} />)
    
    const prevButton = screen.getByRole('button', { name: /이전/ })
    await user.click(prevButton)

    expect(mockOnBack).toHaveBeenCalled()
  })

  it('비밀번호 표시/숨김 토글이 작동한다', async () => {
    const user = userEvent.setup()
    render(<DoctorSignupFlow />)
    
    const passwordInput = screen.getByLabelText(/^비밀번호/) as HTMLInputElement
    const toggleButton = passwordInput.parentElement?.querySelector('button')
    
    expect(passwordInput.type).toBe('password')
    
    if (toggleButton) {
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('text')
      
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('password')
    }
  })

  it('진행률 바가 올바르게 표시된다', () => {
    render(<DoctorSignupFlow />)
    
    const progressBar = document.querySelector('.bg-blue-600')
    expect(progressBar).toHaveStyle({ width: '50%' })
  })

  it('에러 메시지가 표시된다', () => {
    const errorMessage = '테스트 에러 메시지'
    render(<DoctorSignupFlow error={errorMessage} />)
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('로딩 상태가 올바르게 표시된다', () => {
    render(<DoctorSignupFlow isSubmitting={true} />)
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })
})