import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HospitalCodeGenerator from '../HospitalCodeGenerator'
import { HospitalData } from '@/types/hospital'

// Mock dependencies
jest.mock('@/lib/hospitalCodeService', () => ({
  generateHospitalCodeForDoctor: jest.fn()
}))

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ ip: '127.0.0.1' })
  })
) as jest.Mock

const mockGenerateHospitalCodeForDoctor = require('@/lib/hospitalCodeService').generateHospitalCodeForDoctor

const mockHospitalData: HospitalData = {
  hospitalCode: 'OB-SEOUL-CLINIC-001',
  hospitalName: '테스트 의원',
  hospitalType: 'clinic',
  region: 'SEOUL',
  address: '서울시 강남구 테스트로 123',
  isActive: true,
  createdAt: new Date()
}

describe('HospitalCodeGenerator', () => {
  const mockOnCodeGenerated = jest.fn()
  const mockOnGenerationError = jest.fn()

  const defaultProps = {
    doctorId: 'test-doctor-id',
    hospitalName: '테스트 의원',
    hospitalType: 'clinic' as const,
    region: '서울',
    address: '서울시 강남구 테스트로 123',
    onCodeGenerated: mockOnCodeGenerated,
    onGenerationError: mockOnGenerationError
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGenerateHospitalCodeForDoctor.mockResolvedValue({
      success: true,
      hospitalCode: 'OB-SEOUL-CLINIC-001',
      hospitalData: mockHospitalData
    })
  })

  it('병원 정보 요약이 올바르게 표시된다', () => {
    render(<HospitalCodeGenerator {...defaultProps} />)
    
    expect(screen.getByText('병원 코드 생성 정보')).toBeInTheDocument()
    expect(screen.getByText('테스트 의원')).toBeInTheDocument()
    expect(screen.getByText('의원')).toBeInTheDocument()
    expect(screen.getByText('서울')).toBeInTheDocument()
  })

  it('미리보기 코드가 생성된다', () => {
    render(<HospitalCodeGenerator {...defaultProps} />)
    
    expect(screen.getByText('예상 코드 형식:')).toBeInTheDocument()
    expect(screen.getByText('OB-SEOUL-CLINIC-???')).toBeInTheDocument()
  })

  it('병원 코드 생성이 성공한다', async () => {
    const user = userEvent.setup()
    render(<HospitalCodeGenerator {...defaultProps} />)
    
    const generateButton = screen.getByRole('button', { name: /병원 코드 생성/ })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('병원 코드가 생성되었습니다')).toBeInTheDocument()
      expect(screen.getByText('OB-SEOUL-CLINIC-001')).toBeInTheDocument()
    })

    expect(mockOnCodeGenerated).toHaveBeenCalledWith('OB-SEOUL-CLINIC-001', mockHospitalData)
  })

  it('필수 정보가 없으면 생성 버튼이 비활성화된다', () => {
    render(
      <HospitalCodeGenerator 
        {...defaultProps} 
        hospitalName="" 
      />
    )
    
    const generateButton = screen.getByRole('button', { name: /병원 코드 생성/ })
    expect(generateButton).toBeDisabled()
  })

  it('생성 실패 시 오류 메시지가 표시된다', async () => {
    const user = userEvent.setup()
    
    mockGenerateHospitalCodeForDoctor.mockResolvedValue({
      success: false,
      error: '코드 생성에 실패했습니다.'
    })

    render(<HospitalCodeGenerator {...defaultProps} />)
    
    const generateButton = screen.getByRole('button', { name: /병원 코드 생성/ })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('코드 생성에 실패했습니다.')).toBeInTheDocument()
    })

    expect(mockOnGenerationError).toHaveBeenCalledWith('코드 생성에 실패했습니다.')
  })

  it('복사 버튼이 작동한다', async () => {
    const user = userEvent.setup()
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    })

    render(<HospitalCodeGenerator {...defaultProps} />)
    
    const generateButton = screen.getByRole('button', { name: /병원 코드 생성/ })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('병원 코드가 생성되었습니다')).toBeInTheDocument()
    })

    const copyButton = screen.getByTitle('코드 복사')
    await user.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('OB-SEOUL-CLINIC-001')
  })

  it('고급 정보 토글이 작동한다', async () => {
    const user = userEvent.setup()
    render(<HospitalCodeGenerator {...defaultProps} />)
    
    const toggleButton = screen.getByRole('button', { name: /고급 정보 및 도움말/ })
    await user.click(toggleButton)

    expect(screen.getByText('기본 정보')).toBeInTheDocument()
    expect(screen.getByText('보안 및 개인정보')).toBeInTheDocument()
    expect(screen.getByText('기술 정보')).toBeInTheDocument()

    await user.click(toggleButton)
    expect(screen.queryByText('기본 정보')).not.toBeInTheDocument()
  })

  it('생성 진행 상황이 표시된다', async () => {
    const user = userEvent.setup()
    
    // 느린 응답 시뮬레이션
    mockGenerateHospitalCodeForDoctor.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        success: true,
        hospitalCode: 'OB-SEOUL-CLINIC-001',
        hospitalData: mockHospitalData
      }), 1000))
    )

    render(<HospitalCodeGenerator {...defaultProps} />)
    
    const generateButton = screen.getByRole('button', { name: /병원 코드 생성/ })
    await user.click(generateButton)

    expect(screen.getByText('병원 코드 생성 중')).toBeInTheDocument()
    expect(screen.getByText('병원 정보 검증 중...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('병원 코드가 생성되었습니다')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('코드 충돌 시 자동 재시도한다', async () => {
    const user = userEvent.setup()
    
    // 첫 번째 시도는 충돌, 두 번째 시도는 성공
    mockGenerateHospitalCodeForDoctor
      .mockResolvedValueOnce({
        success: false,
        error: '코드 중복이 발생했습니다.',
        conflictCode: 'OB-SEOUL-CLINIC-001'
      })
      .mockResolvedValueOnce({
        success: true,
        hospitalCode: 'OB-SEOUL-CLINIC-002',
        hospitalData: { ...mockHospitalData, hospitalCode: 'OB-SEOUL-CLINIC-002' }
      })

    render(<HospitalCodeGenerator {...defaultProps} />)
    
    const generateButton = screen.getByRole('button', { name: /병원 코드 생성/ })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText(/코드 충돌이 발생했습니다/)).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('OB-SEOUL-CLINIC-002')).toBeInTheDocument()
    }, { timeout: 2000 })

    expect(mockGenerateHospitalCodeForDoctor).toHaveBeenCalledTimes(2)
  })

  it('최대 시도 횟수 초과 시 에러가 표시된다', async () => {
    const user = userEvent.setup()
    
    render(<HospitalCodeGenerator {...defaultProps} />)
    
    // 3번 시도하여 최대 횟수 초과
    for (let i = 0; i < 3; i++) {
      const generateButton = screen.getByRole('button', { name: /병원 코드 생성|다시 생성/ })
      await user.click(generateButton)
      
      if (i < 2) {
        const regenerateButton = await screen.findByRole('button', { name: /다시 생성/ })
        await user.click(regenerateButton)
      }
    }

    const generateButton = screen.getByRole('button', { name: /병원 코드 생성/ })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText(/최대 생성 시도 횟수.*를 초과했습니다/)).toBeInTheDocument()
    })
  })
})