/**
 * 통합된 SignupForm 컴포넌트 테스트
 * 새로운 역할 기반 가입 플로우의 정확성을 검증합니다.
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import SignupForm from '../SignupForm'
import { useNotifications } from '@/hooks/useNotifications'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}))

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: jest.fn()
}))

jest.mock('../DoctorSignupFlow', () => {
  return function MockDoctorSignupFlow({ onSuccess }: { onSuccess: () => void }) {
    return (
      <div data-testid="doctor-signup-flow">
        <h2>의사 가입 플로우</h2>
        <button onClick={onSuccess} data-testid="doctor-signup-success">
          가입 완료
        </button>
      </div>
    )
  }
})

jest.mock('../CustomerSignupForm', () => {
  return function MockCustomerSignupForm({ 
    initialInviteCode, 
    onSuccess 
  }: { 
    initialInviteCode?: string
    onSuccess: () => void 
  }) {
    return (
      <div data-testid="customer-signup-form">
        <h2>고객 가입 폼</h2>
        {initialInviteCode && (
          <p data-testid="initial-invite-code">초기 코드: {initialInviteCode}</p>
        )}
        <button onClick={onSuccess} data-testid="customer-signup-success">
          가입 완료
        </button>
      </div>
    )
  }
})

describe('SignupForm', () => {
  const mockPush = jest.fn()
  const mockSearchParams = {
    get: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    })
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
    ;(useNotifications as jest.Mock).mockReturnValue({
      isConnected: true
    })
  })

  describe('역할 선택 단계', () => {
    it('초기 화면에서 역할 선택 카드들을 표시한다', () => {
      render(<SignupForm />)

      expect(screen.getByText('OBDoc 회원가입')).toBeInTheDocument()
      expect(screen.getByText('어떤 유형으로 가입하시겠습니까?')).toBeInTheDocument()
      
      // 의사 카드
      expect(screen.getByText('의사 / 한의사')).toBeInTheDocument()
      expect(screen.getByText('의료진을 위한 전문 서비스')).toBeInTheDocument()
      expect(screen.getByText('병원 코드 자동 생성')).toBeInTheDocument()
      
      // 고객 카드
      expect(screen.getByText('고객')).toBeInTheDocument()
      expect(screen.getByText('의료 서비스 이용자')).toBeInTheDocument()
      expect(screen.getByText('가입 코드로 간편 가입')).toBeInTheDocument()
    })

    it('의사 역할 선택 시 의사 가입 플로우로 이동한다', async () => {
      const user = userEvent.setup()
      render(<SignupForm />)

      const doctorCard = screen.getByText('의사 / 한의사').closest('div')
      expect(doctorCard).toBeInTheDocument()
      
      await user.click(doctorCard!)

      await waitFor(() => {
        expect(screen.getByText('의사 회원가입')).toBeInTheDocument()
        expect(screen.getByTestId('doctor-signup-flow')).toBeInTheDocument()
      })
    })

    it('고객 역할 선택 시 고객 가입 폼으로 이동한다', async () => {
      const user = userEvent.setup()
      render(<SignupForm />)

      const customerCard = screen.getByText('고객').closest('div')
      expect(customerCard).toBeInTheDocument()
      
      await user.click(customerCard!)

      await waitFor(() => {
        expect(screen.getByText('고객 회원가입')).toBeInTheDocument()
        expect(screen.getByTestId('customer-signup-form')).toBeInTheDocument()
      })
    })
  })

  describe('URL 파라미터 처리', () => {
    it('URL에 role=doctor 파라미터가 있으면 자동으로 의사 가입 플로우로 이동한다', () => {
      mockSearchParams.get.mockImplementation((param: string) => {
        if (param === 'role') return 'doctor'
        return null
      })

      render(<SignupForm />)

      expect(screen.getByText('의사 회원가입')).toBeInTheDocument()
      expect(screen.getByTestId('doctor-signup-flow')).toBeInTheDocument()
    })

    it('URL에 role=customer 파라미터가 있으면 자동으로 고객 가입 폼으로 이동한다', () => {
      mockSearchParams.get.mockImplementation((param: string) => {
        if (param === 'role') return 'customer'
        return null
      })

      render(<SignupForm />)

      expect(screen.getByText('고객 회원가입')).toBeInTheDocument()
      expect(screen.getByTestId('customer-signup-form')).toBeInTheDocument()
    })

    it('URL에 가입 코드가 있으면 고객 역할로 자동 선택하고 코드를 전달한다', () => {
      mockSearchParams.get.mockImplementation((param: string) => {
        if (param === 'code') return 'INV-TEST-001'
        return null
      })

      render(<SignupForm />)

      expect(screen.getByText('고객 회원가입')).toBeInTheDocument()
      expect(screen.getByTestId('customer-signup-form')).toBeInTheDocument()
      expect(screen.getByTestId('initial-invite-code')).toHaveTextContent('초기 코드: INV-TEST-001')
    })
  })

  describe('가입 플로우 네비게이션', () => {
    it('가입 폼에서 "역할 선택으로 돌아가기" 버튼이 작동한다', async () => {
      const user = userEvent.setup()
      render(<SignupForm />)

      // 의사 역할 선택
      const doctorCard = screen.getByText('의사 / 한의사').closest('div')
      await user.click(doctorCard!)

      // 돌아가기 버튼 클릭
      const backButton = screen.getByText('역할 선택으로 돌아가기')
      await user.click(backButton)

      // 역할 선택 화면으로 돌아감
      expect(screen.getByText('OBDoc 회원가입')).toBeInTheDocument()
      expect(screen.getByText('어떤 유형으로 가입하시겠습니까?')).toBeInTheDocument()
    })
  })

  describe('가입 성공 처리', () => {
    it('의사 가입 성공 시 성공 화면을 표시하고 의사 대시보드로 리디렉트한다', async () => {
      const user = userEvent.setup()
      render(<SignupForm />)

      // 의사 역할 선택
      const doctorCard = screen.getByText('의사 / 한의사').closest('div')
      await user.click(doctorCard!)

      // 가입 완료 버튼 클릭
      const successButton = screen.getByTestId('doctor-signup-success')
      await user.click(successButton)

      // 성공 화면 표시
      expect(screen.getByText('회원가입 완료!')).toBeInTheDocument()
      expect(screen.getByText('의사 대시보드로 이동합니다...')).toBeInTheDocument()

      // 리디렉트 확인 (2초 후)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/doctor')
      }, { timeout: 3000 })
    })

    it('고객 가입 성공 시 성공 화면을 표시하고 고객 대시보드로 리디렉트한다', async () => {
      const user = userEvent.setup()
      render(<SignupForm />)

      // 고객 역할 선택
      const customerCard = screen.getByText('고객').closest('div')
      await user.click(customerCard!)

      // 가입 완료 버튼 클릭
      const successButton = screen.getByTestId('customer-signup-success')
      await user.click(successButton)

      // 성공 화면 표시
      expect(screen.getByText('회원가입 완료!')).toBeInTheDocument()
      expect(screen.getByText('고객 대시보드로 이동합니다...')).toBeInTheDocument()

      // 리디렉트 확인 (2초 후)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/customer')
      }, { timeout: 3000 })
    })
  })

  describe('보안 기능', () => {
    it('보안 강화 메시지를 표시한다', () => {
      render(<SignupForm />)

      expect(screen.getByText('보안 강화된 역할 기반 가입 시스템')).toBeInTheDocument()
      expect(screen.getByText('각 역할에 맞는 보안 정책과 검증 절차가 적용됩니다')).toBeInTheDocument()
    })

    it('성공 화면에서 보안 강화 메시지를 표시한다', async () => {
      const user = userEvent.setup()
      render(<SignupForm />)

      // 의사 역할 선택 및 가입 완료
      const doctorCard = screen.getByText('의사 / 한의사').closest('div')
      await user.click(doctorCard!)
      
      const successButton = screen.getByTestId('doctor-signup-success')
      await user.click(successButton)

      expect(screen.getByText('보안 강화된 가입 플로우로 안전하게 가입되었습니다')).toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('역할 선택 카드들이 키보드로 접근 가능하다', async () => {
      const user = userEvent.setup()
      render(<SignupForm />)

      const doctorCard = screen.getByText('의사 / 한의사').closest('div')
      const customerCard = screen.getByText('고객').closest('div')

      // Tab 키로 포커스 이동 가능
      await user.tab()
      expect(doctorCard).toHaveFocus()

      await user.tab()
      expect(customerCard).toHaveFocus()

      // Enter 키로 선택 가능
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('고객 회원가입')).toBeInTheDocument()
      })
    })

    it('적절한 ARIA 레이블과 역할이 설정되어 있다', () => {
      render(<SignupForm />)

      const doctorCard = screen.getByText('의사 / 한의사').closest('div')
      const customerCard = screen.getByText('고객').closest('div')

      expect(doctorCard).toHaveAttribute('role', 'button')
      expect(customerCard).toHaveAttribute('role', 'button')
    })
  })

  describe('에러 처리', () => {
    it('알림 서비스 연결 실패 시에도 정상 작동한다', () => {
      ;(useNotifications as jest.Mock).mockReturnValue({
        isConnected: false
      })

      render(<SignupForm />)

      expect(screen.getByText('OBDoc 회원가입')).toBeInTheDocument()
      expect(screen.getByText('의사 / 한의사')).toBeInTheDocument()
      expect(screen.getByText('고객')).toBeInTheDocument()
    })

    it('잘못된 URL 파라미터는 무시한다', () => {
      mockSearchParams.get.mockImplementation((param: string) => {
        if (param === 'role') return 'invalid-role'
        return null
      })

      render(<SignupForm />)

      // 기본 역할 선택 화면이 표시되어야 함
      expect(screen.getByText('OBDoc 회원가입')).toBeInTheDocument()
      expect(screen.getByText('어떤 유형으로 가입하시겠습니까?')).toBeInTheDocument()
    })
  })

  describe('반응형 디자인', () => {
    it('모바일 화면에서도 역할 선택 카드가 적절히 표시된다', () => {
      // 모바일 뷰포트 시뮬레이션
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<SignupForm />)

      const doctorCard = screen.getByText('의사 / 한의사').closest('div')
      const customerCard = screen.getByText('고객').closest('div')

      expect(doctorCard).toBeInTheDocument()
      expect(customerCard).toBeInTheDocument()
    })
  })
})