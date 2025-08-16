import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InviteCodeValidator from '../InviteCodeValidator'
import { HospitalData } from '@/types/hospital'

// Mock the invite code service
jest.mock('@/lib/inviteCodeService', () => ({
  validateInviteCodeRealtime: jest.fn(),
  validateInviteCodeFormatRealtime: jest.fn(),
  checkInviteCodeSecurity: jest.fn()
}))

const mockValidateInviteCodeRealtime = require('@/lib/inviteCodeService').validateInviteCodeRealtime
const mockValidateInviteCodeFormatRealtime = require('@/lib/inviteCodeService').validateInviteCodeFormatRealtime
const mockCheckInviteCodeSecurity = require('@/lib/inviteCodeService').checkInviteCodeSecurity

// Mock fetch for IP address
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ ip: '127.0.0.1' })
  })
) as jest.Mock

const mockHospitalData: HospitalData = {
  hospitalCode: 'OB-SEOUL-CLINIC-001',
  hospitalName: '테스트 의원',
  hospitalType: 'clinic',
  region: 'SEOUL',
  address: '서울시 강남구 테스트로 123',
  isActive: true,
  createdAt: new Date()
}

describe('InviteCodeValidator', () => {
  const mockOnCodeValidated = jest.fn()
  const mockOnValidationError = jest.fn()
  const mockOnCodeChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockValidateInviteCodeFormatRealtime.mockReturnValue({
      isValid: true,
      errors: [],
      suggestions: []
    })
    
    mockCheckInviteCodeSecurity.mockReturnValue({
      strength: 'strong',
      score: 85,
      issues: [],
      recommendations: []
    })
    
    mockValidateInviteCodeRealtime.mockResolvedValue({
      isValid: true,
      hospitalInfo: mockHospitalData
    })
  })

  const defaultProps = {
    onCodeValidated: mockOnCodeValidated,
    onValidationError: mockOnValidationError,
    onCodeChange: mockOnCodeChange
  }

  describe('기본 렌더링', () => {
    it('기본 요소들이 올바르게 렌더링된다', () => {
      render(<InviteCodeValidator {...defaultProps} />)
      
      expect(screen.getByLabelText(/병원 가입 코드/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/OB-SEOUL-CLINIC-001-202401-A7B9X2K5/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /가입 코드 확인/ })).toBeInTheDocument()
    })

    it('도움말 텍스트가 표시된다', () => {
      render(<InviteCodeValidator {...defaultProps} showHelpText={true} />)
      
      expect(screen.getByText(/가입 코드는 병원에서 제공받으실 수 있습니다/)).toBeInTheDocument()
    })

    it('도움말 텍스트를 숨길 수 있다', () => {
      render(<InviteCodeValidator {...defaultProps} showHelpText={false} />)
      
      expect(screen.queryByText(/가입 코드는 병원에서 제공받으실 수 있습니다/)).not.toBeInTheDocument()
    })
  })

  describe('코드 입력 처리', () => {
    it('코드 입력 시 대문자로 변환되고 특수문자가 제거된다', async () => {
      const user = userEvent.setup()
      render(<InviteCodeValidator {...defaultProps} />)
      
      const input = screen.getByLabelText(/병원 가입 코드/)
      await user.type(input, 'ob-seoul-clinic-001@#$')
      
      expect(input).toHaveValue('OB-SEOUL-CLINIC-001')
    })

    it('코드 변경 시 onCodeChange 콜백이 호출된다', async () => {
      const user = userEvent.setup()
      render(<InviteCodeValidator {...defaultProps} />)
      
      const input = screen.getByLabelText(/병원 가입 코드/)
      await user.type(input, 'OB-SEOUL')
      
      await waitFor(() => {
        expect(mockOnCodeChange).toHaveBeenCalledWith('OB-SEOUL', true)
      })
    })

    it('Enter 키 입력 시 검증이 실행된다', async () => {
      const user = userEvent.setup()
      render(<InviteCodeValidator {...defaultProps} />)
      
      const input = screen.getByLabelText(/병원 가입 코드/)
      await user.type(input, 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockValidateInviteCodeRealtime).toHaveBeenCalled()
      })
    })
  })

  describe('실시간 형식 검증', () => {
    it('잘못된 형식 입력 시 오류 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      
      mockValidateInviteCodeFormatRealtime.mockReturnValue({
        isValid: false,
        errors: ['가입 코드 형식이 올바르지 않습니다.'],
        suggestions: ['형식: OB-지역-병원유형-순번-년월-코드']
      })
      
      render(<InviteCodeValidator {...defaultProps} />)
      
      const input = screen.getByLabelText(/병원 가입 코드/)
      await user.type(input, 'INVALID-CODE')
      
      await waitFor(() => {
        expect(screen.getByText(/가입 코드 형식이 올바르지 않습니다/)).toBeInTheDocument()
        expect(screen.getByText(/형식: OB-지역-병원유형-순번-년월-코드/)).toBeInTheDocument()
      })
    })

    it('올바른 형식 입력 시 체크 아이콘이 표시된다', async () => {
      const user = userEvent.setup()
      render(<InviteCodeValidator {...defaultProps} />)
      
      const input = screen.getByLabelText(/병원 가입 코드/)
      await user.type(input, 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5')
      
      await waitFor(() => {
        const checkIcon = screen.getByRole('img', { hidden: true })
        expect(checkIcon).toBeInTheDocument()
      })
    })
  })

  describe('보안 강도 표시', () => {
    it('보안 강도가 표시된다', async () => {
      const user = userEvent.setup()
      
      mockCheckInviteCodeSecurity.mockReturnValue({
        strength: 'medium',
        score: 65,
        issues: ['코드가 예측 가능합니다'],
        recommendations: ['더 복잡한 코드를 사용하세요']
      })
      
      render(<InviteCodeValidator {...defaultProps} />)
      
      const input = screen.getByLabelText(/병원 가입 코드/)
      await user.type(input, 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5')
      
      await waitFor(() => {
        expect(screen.getByText(/보안 강도: 보통/)).toBeInTheDocument()
        expect(screen.getByText(/65\/100/)).toBeInTheDocument()
      })
    })
  })

  describe('코드 검증', () => {
    it('유효한 코드 검증 성공 시 병원 정보가 표시된다', async () => {
      const user = userEvent.setup()
      render(<InviteCodeValidator {...defaultProps} />)
      
      const input = screen.getByLabelText(/병원 가입 코드/)
      await user.type(input, 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5')
      
      const validateButton = screen.getByRole('button', { name: /가입 코드 확인/ })
      await user.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/가입 코드가 확인되었습니다/)).toBeInTheDocument()
        expect(screen.getByText(mockHospitalData.hospitalName)).toBeInTheDocument()
        expect(screen.getByText(/의원/)).toBeInTheDocument()
      })
      
      expect(mockOnCodeValidated).toHaveBeenCalledWith(
        mockHospitalData,
        'OB-SEOUL-CLINIC-001-202401-A7B9X2K5'
      )
    })

    it('검증 실패 시 오류 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      
      mockValidateInviteCodeRealtime.mockResolvedValue({
        isValid: false,
        error: '유효하지 않은 가입 코드입니다.'
      })
      
      render(<InviteCodeValidator {...defaultProps} />)
      
      const input = screen.getByLabelText(/병원 가입 코드/)
      await user.type(input, 'OB-SEOUL-CLINIC-001-202401-INVALID')
      
      const validateButton = screen.getByRole('button', { name: /가입 코드 확인/ })
      await user.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/유효하지 않은 가입 코드입니다/)).toBeInTheDocument()
      })
      
      expect(mockOnValidationError).toHaveBeenCalledWith('유효하지 않은 가입 코드입니다.')
    })

    it('빈 코드로 검증 시도 시 오류 메시지가 표시된다', async () => {
      const user = userEvent.setup()
      render(<InviteCodeValidator {...defaultProps} />)
      
      const validateButton = screen.getByRole('button', { name: /가입 코드 확인/ })
      await user.click(validateButton)
      
      await waitFor(() => {
        expect(screen.getByText(/가입 코드를 입력해주세요/)).toBeInTheDocument()
      })
    })
  })

  describe('고급 옵션', () => {
    it('고급 옵션 토글이 작동한다', async () => {
      const user = userEvent.setup()
      render(<InviteCodeValidator {...defaultProps} />)
      
      const toggleButton = screen.getByRole('button', { name: /고급 옵션/ })
      await user.click(toggleButton)
      
      expect(screen.getByText(/빠른 작업/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /붙여넣기/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /초기화/ })).toBeInTheDocument()
    })

    it('초기화 버튼이 작동한다', async () => {
      const user = userEvent.setup()
      render(<InviteCodeValidator {...defaultProps} />)
      
      const input = screen.getByLabelText(/병원 가입 코드/)
      await user.type(input, 'TEST-CODE')
      
      const toggleButton = screen.getByRole('button', { name: /고급 옵션/ })
      await user.click(toggleButton)
      
      const resetButton = screen.getByRole('button', { name: /초기화/ })
      await user.click(resetButton)
      
      expect(input).toHaveValue('')
    })
  })

  describe('접근성', () => {
    it('적절한 ARIA 속성이 설정되어 있다', () => {
      render(<InviteCodeValidator {...defaultProps} />)
      
      const input = screen.getByLabelText(/병원 가입 코드/)
      expect(input).toHaveAttribute('aria-describedby')
      expect(input).toHaveAttribute('aria-invalid', 'false')
    })

    it('오류 상태에서 aria-invalid가 true로 설정된다', async () => {
      const user = userEvent.setup()
      
      mockValidateInviteCodeFormatRealtime.mockReturnValue({
        isValid: false,
        errors: ['형식 오류'],
        suggestions: []
      })
      
      render(<InviteCodeValidator {...defaultProps} />)
      
      const input = screen.getByLabelText(/병원 가입 코드/)
      await user.type(input, 'INVALID')
      
      // 오류 상태가 설정될 때까지 기다림
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('오류 메시지에 role="alert"가 설정되어 있다', async () => {
      const user = userEvent.setup()
      render(<InviteCodeValidator {...defaultProps} />)
      
      const validateButton = screen.getByRole('button', { name: /가입 코드 확인/ })
      await user.click(validateButton)
      
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert')
        expect(errorMessage).toBeInTheDocument()
      })
    })
  })

  describe('로딩 상태', () => {
    it('검증 중 로딩 상태가 표시된다', async () => {
      const user = userEvent.setup()
      
      // 검증이 오래 걸리도록 Promise를 지연시킴
      mockValidateInviteCodeRealtime.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          isValid: true,
          hospitalInfo: mockHospitalData
        }), 1000))
      )
      
      render(<InviteCodeValidator {...defaultProps} />)
      
      const input = screen.getByLabelText(/병원 가입 코드/)
      await user.type(input, 'OB-SEOUL-CLINIC-001-202401-A7B9X2K5')
      
      const validateButton = screen.getByRole('button', { name: /가입 코드 확인/ })
      await user.click(validateButton)
      
      expect(screen.getByText(/검증 중.../)).toBeInTheDocument()
      expect(validateButton).toBeDisabled()
    })
  })

  describe('Props 처리', () => {
    it('autoFocus prop이 작동한다', () => {
      render(<InviteCodeValidator {...defaultProps} autoFocus={true} />)
      
      const input = screen.getByLabelText(/병원 가입 코드/)
      expect(input).toHaveFocus()
    })

    it('allowManualValidation={false}일 때 검증 버튼이 숨겨진다', () => {
      render(<InviteCodeValidator {...defaultProps} allowManualValidation={false} />)
      
      expect(screen.queryByRole('button', { name: /가입 코드 확인/ })).not.toBeInTheDocument()
      expect(screen.getByText(/입력하시면 자동으로 검증됩니다/)).toBeInTheDocument()
    })

    it('isValidating prop이 작동한다', () => {
      render(<InviteCodeValidator {...defaultProps} isValidating={true} />)
      
      const input = screen.getByLabelText(/병원 가입 코드/)
      expect(input).toBeDisabled()
    })
  })
})