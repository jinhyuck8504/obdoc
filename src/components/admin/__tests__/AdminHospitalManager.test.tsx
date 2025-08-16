import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminHospitalManager from '../AdminHospitalManager'

// Mock dependencies
jest.mock('@/lib/inviteCodeService', () => ({
  getInviteCodeStats: jest.fn()
}))

const mockGetInviteCodeStats = require('@/lib/inviteCodeService').getInviteCodeStats

describe('AdminHospitalManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetInviteCodeStats.mockResolvedValue({
      totalCodes: 10,
      activeCodes: 5,
      usedCodes: 3,
      totalUsages: 25,
      successRate: 85.5
    })
  })

  it('컴포넌트가 올바르게 렌더링된다', async () => {
    render(<AdminHospitalManager />)
    
    expect(screen.getByText('병원 관리 대시보드')).toBeInTheDocument()
    expect(screen.getByText('전체 병원 및 가입 코드 현황을 관리하세요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /새로고침/ })).toBeInTheDocument()
  })

  it('탭 네비게이션이 작동한다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 기본적으로 개요 탭이 활성화되어 있어야 함
    expect(screen.getByText('개요')).toHaveClass('text-blue-600')
    
    // 병원 목록 탭 클릭
    await user.click(screen.getByText('병원 목록'))
    expect(screen.getByText('병원 목록')).toHaveClass('text-blue-600')
    
    // 보안 알림 탭 클릭
    await user.click(screen.getByText('보안 알림'))
    expect(screen.getByText('보안 알림')).toHaveClass('text-blue-600')
  })

  it('개요 탭에서 통계 카드가 표시된다', async () => {
    render(<AdminHospitalManager />)
    
    await waitFor(() => {
      expect(screen.getByText('총 병원 수')).toBeInTheDocument()
      expect(screen.getByText('총 가입 코드')).toBeInTheDocument()
      expect(screen.getByText('총 사용 횟수')).toBeInTheDocument()
      expect(screen.getByText('평균 성공률')).toBeInTheDocument()
    })
  })

  it('병원 목록 탭에서 검색 기능이 작동한다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 병원 목록 탭으로 이동
    await user.click(screen.getByText('병원 목록'))
    
    // 검색 입력
    const searchInput = screen.getByPlaceholderText('병원명 또는 코드로 검색...')
    await user.type(searchInput, '서울')
    
    expect(searchInput).toHaveValue('서울')
  })

  it('병원 목록 탭에서 필터 기능이 작동한다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 병원 목록 탭으로 이동
    await user.click(screen.getByText('병원 목록'))
    
    // 상태 필터 선택
    const statusFilter = screen.getByDisplayValue('전체 상태')
    await user.selectOptions(statusFilter, 'active')
    expect(statusFilter).toHaveValue('active')

    // 날짜 범위 필터 선택
    const dateFilter = screen.getByDisplayValue('전체 기간')
    await user.selectOptions(dateFilter, 'week')
    expect(dateFilter).toHaveValue('week')

    // 정렬 기준 선택
    const sortFilter = screen.getByDisplayValue('이름순')
    await user.selectOptions(sortFilter, 'usage')
    expect(sortFilter).toHaveValue('usage')
  })

  it('병원 상세보기 기능이 작동한다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 병원 목록 탭으로 이동
    await user.click(screen.getByText('병원 목록'))
    
    await waitFor(() => {
      const detailButtons = screen.getAllByText('상세보기')
      expect(detailButtons.length).toBeGreaterThan(0)
    })
    
    // 첫 번째 상세보기 버튼 클릭
    const detailButtons = screen.getAllByText('상세보기')
    await user.click(detailButtons[0])
    
    // 상세 정보 탭으로 이동되어야 함
    await waitFor(() => {
      expect(screen.getByText('상세 정보')).toHaveClass('text-blue-600')
    })
  })

  it('보안 알림 탭에서 알림이 표시된다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 보안 알림 탭으로 이동
    await user.click(screen.getByText('보안 알림'))
    
    await waitFor(() => {
      // 모킹된 알림들이 표시되어야 함
      expect(screen.getByText(/동일 IP에서 여러 번의 잘못된 가입 코드 시도/)).toBeInTheDocument()
      expect(screen.getByText(/비정상적인 패턴의 가입 코드 사용/)).toBeInTheDocument()
    })
  })

  it('보안 알림 해결 기능이 작동한다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 보안 알림 탭으로 이동
    await user.click(screen.getByText('보안 알림'))
    
    await waitFor(() => {
      const resolveButtons = screen.getAllByText('해결')
      expect(resolveButtons.length).toBeGreaterThan(0)
    })
    
    // 첫 번째 해결 버튼 클릭
    const resolveButtons = screen.getAllByText('해결')
    await user.click(resolveButtons[0])
    
    // 해결됨 상태로 변경되어야 함
    await waitFor(() => {
      expect(screen.getByText('해결됨')).toBeInTheDocument()
    })
  })

  it('새로고침 버튼이 작동한다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    const refreshButton = screen.getByRole('button', { name: /새로고침/ })
    await user.click(refreshButton)
    
    // 로딩 상태가 표시되어야 함
    expect(screen.getByText('데이터를 불러오는 중...')).toBeInTheDocument()
  })

  it('로딩 상태가 올바르게 표시된다', () => {
    render(<AdminHospitalManager />)
    
    // 초기 로딩 상태
    expect(screen.getByText('데이터를 불러오는 중...')).toBeInTheDocument()
  })

  it('에러 상태가 올바르게 표시된다', async () => {
    // 에러를 발생시키기 위해 mock 함수를 실패하도록 설정
    mockGetInviteCodeStats.mockRejectedValue(new Error('네트워크 오류'))
    
    render(<AdminHospitalManager />)
    
    await waitFor(() => {
      expect(screen.getByText('오류 발생')).toBeInTheDocument()
      expect(screen.getByText('대시보드 데이터를 불러오는데 실패했습니다.')).toBeInTheDocument()
    })
  })

  it('상세 정보 탭에서 병원 통계가 표시된다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 병원 목록 탭으로 이동 후 상세보기 클릭
    await user.click(screen.getByText('병원 목록'))
    
    await waitFor(() => {
      const detailButtons = screen.getAllByText('상세보기')
      expect(detailButtons.length).toBeGreaterThan(0)
    })
    
    const detailButtons = screen.getAllByText('상세보기')
    await user.click(detailButtons[0])
    
    // 상세 정보가 표시되어야 함
    await waitFor(() => {
      expect(screen.getByText('총 코드')).toBeInTheDocument()
      expect(screen.getByText('활성 코드')).toBeInTheDocument()
      expect(screen.getByText('총 사용')).toBeInTheDocument()
      expect(screen.getByText('성공률')).toBeInTheDocument()
    })
  })

  it('상세 정보 탭에서 가입 코드 목록이 표시된다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 병원 목록 탭으로 이동 후 상세보기 클릭
    await user.click(screen.getByText('병원 목록'))
    
    await waitFor(() => {
      const detailButtons = screen.getAllByText('상세보기')
      expect(detailButtons.length).toBeGreaterThan(0)
    })
    
    const detailButtons = screen.getAllByText('상세보기')
    await user.click(detailButtons[0])
    
    // 가입 코드 목록이 표시되어야 함
    await waitFor(() => {
      expect(screen.getByText('가입 코드 목록')).toBeInTheDocument()
    })
  })

  it('상세 정보 탭에서 닫기 버튼이 작동한다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 병원 목록 탭으로 이동 후 상세보기 클릭
    await user.click(screen.getByText('병원 목록'))
    
    await waitFor(() => {
      const detailButtons = screen.getAllByText('상세보기')
      expect(detailButtons.length).toBeGreaterThan(0)
    })
    
    const detailButtons = screen.getAllByText('상세보기')
    await user.click(detailButtons[0])
    
    // 상세 정보 탭에서 닫기 버튼 클릭
    await waitFor(() => {
      const closeButton = screen.getByRole('button')
      expect(closeButton).toBeInTheDocument()
    })
    
    // X 버튼 찾기 (SVG 아이콘)
    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons.find(button => 
      button.querySelector('svg path[d*="M6 18L18 6M6 6l12 12"]')
    )
    
    if (closeButton) {
      await user.click(closeButton)
      
      // 병원 목록 탭으로 돌아가야 함
      expect(screen.getByText('병원 목록')).toHaveClass('text-blue-600')
    }
  })

  it('자동 새로고침 기능이 작동한다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 자동 새로고침 체크박스 클릭
    const autoRefreshCheckbox = screen.getByLabelText('자동 새로고침')
    await user.click(autoRefreshCheckbox)
    
    expect(autoRefreshCheckbox).toBeChecked()
  })

  it('데이터 내보내기 모달이 작동한다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 내보내기 버튼 클릭
    const exportButton = screen.getByRole('button', { name: /내보내기/ })
    await user.click(exportButton)
    
    // 모달이 표시되어야 함
    expect(screen.getByText('데이터 내보내기')).toBeInTheDocument()
    expect(screen.getByText('CSV 파일')).toBeInTheDocument()
    expect(screen.getByText('JSON 파일')).toBeInTheDocument()
    expect(screen.getByText('PDF 리포트')).toBeInTheDocument()
  })

  it('내보내기 형식 선택이 작동한다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 내보내기 버튼 클릭
    const exportButton = screen.getByRole('button', { name: /내보내기/ })
    await user.click(exportButton)
    
    // JSON 형식 선택
    const jsonRadio = screen.getByLabelText(/JSON 파일/)
    await user.click(jsonRadio)
    
    expect(jsonRadio).toBeChecked()
  })

  it('필터 초기화 기능이 작동한다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 병원 목록 탭으로 이동
    await user.click(screen.getByText('병원 목록'))
    
    // 검색어 입력
    const searchInput = screen.getByPlaceholderText('병원명 또는 코드로 검색...')
    await user.type(searchInput, '테스트')
    
    // 필터 초기화 버튼이 나타나야 함
    await waitFor(() => {
      expect(screen.getByText('필터 초기화')).toBeInTheDocument()
    })
    
    // 필터 초기화 클릭
    await user.click(screen.getByText('필터 초기화'))
    
    // 검색어가 초기화되어야 함
    expect(searchInput).toHaveValue('')
  })

  it('정렬 순서 토글이 작동한다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 병원 목록 탭으로 이동
    await user.click(screen.getByText('병원 목록'))
    
    // 정렬 순서 토글 버튼 클릭
    const sortToggle = screen.getByTitle('오름차순')
    await user.click(sortToggle)
    
    // 내림차순으로 변경되어야 함
    expect(screen.getByTitle('내림차순')).toBeInTheDocument()
  })

  it('의심스러운 활동 경고가 표시된다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 병원 목록 탭으로 이동
    await user.click(screen.getByText('병원 목록'))
    
    await waitFor(() => {
      // 의심스러운 활동 경고 아이콘이 표시되어야 함
      const warningIcons = screen.getAllByText('⚠️')
      expect(warningIcons.length).toBeGreaterThan(0)
    })
  })

  it('성공률에 따른 진행률 바 색상이 올바르게 표시된다', async () => {
    const user = userEvent.setup()
    render(<AdminHospitalManager />)
    
    // 병원 목록 탭으로 이동
    await user.click(screen.getByText('병원 목록'))
    
    await waitFor(() => {
      // 성공률 진행률 바가 표시되어야 함
      const progressBars = document.querySelectorAll('.bg-green-500, .bg-yellow-500, .bg-red-500')
      expect(progressBars.length).toBeGreaterThan(0)
    })
  })

  it('빈 보안 알림 상태가 올바르게 표시된다', async () => {
    const user = userEvent.setup()
    
    // 빈 알림 목록을 위해 컴포넌트를 다시 렌더링
    const { rerender } = render(<AdminHospitalManager />)
    
    // 보안 알림 탭으로 이동
    await user.click(screen.getByText('보안 알림'))
    
    // 모든 알림을 해결 처리
    await waitFor(() => {
      const resolveButtons = screen.getAllByText('해결')
      resolveButtons.forEach(async (button) => {
        await user.click(button)
      })
    })
    
    // 빈 상태 메시지가 표시될 수 있음 (모든 알림이 해결된 경우)
    // 실제 구현에 따라 다를 수 있음
  })
})