/**
 * QuickSearch 위젯 테스트
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import QuickSearch from '../QuickSearch'
import dashboardDataService from '@/lib/dashboardDataService'

// 모킹
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('@/lib/dashboardDataService', () => ({
  __esModule: true,
  default: {
    subscribe: jest.fn(),
    searchCustomers: jest.fn(),
    addActivity: jest.fn()
  }
}))

const mockRouter = {
  push: jest.fn()
}

const mockDashboardDataService = dashboardDataService as jest.Mocked<typeof dashboardDataService>

describe('QuickSearch', () => {
  const mockSearchResults = [
    {
      id: '1',
      name: '김철수',
      email: 'kim@test.com',
      phone: '010-1234-5678',
      status: 'active',
      lastActivity: '2024-01-20',
      matchType: 'name' as const
    },
    {
      id: '2',
      name: '이영희',
      email: 'lee@test.com',
      phone: '010-9876-5432',
      status: 'completed',
      lastActivity: '2024-01-19',
      matchType: 'name' as const
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('검색 입력 필드를 렌더링해야 한다', () => {
    mockDashboardDataService.subscribe.mockImplementation(() => jest.fn())
    
    render(<QuickSearch />)
    
    expect(screen.getByPlaceholderText('고객명, 전화번호, 지역으로 검색')).toBeInTheDocument()
    expect(screen.getByText('빠른 고객 검색')).toBeInTheDocument()
  })

  it('검색어 입력 시 검색을 수행해야 한다', async () => {
    mockDashboardDataService.subscribe.mockImplementation(() => jest.fn())
    mockDashboardDataService.searchCustomers.mockReturnValue(mockSearchResults)

    render(<QuickSearch />)

    const searchInput = screen.getByPlaceholderText('고객명, 전화번호, 지역으로 검색')
    fireEvent.change(searchInput, { target: { value: '김철수' } })

    await waitFor(() => {
      expect(mockDashboardDataService.searchCustomers).toHaveBeenCalledWith('김철수')
    }, { timeout: 500 })
  })

  it('검색 결과를 올바르게 표시해야 한다', async () => {
    mockDashboardDataService.subscribe.mockImplementation(() => jest.fn())
    mockDashboardDataService.searchCustomers.mockReturnValue(mockSearchResults)

    render(<QuickSearch />)

    const searchInput = screen.getByPlaceholderText('고객명, 전화번호, 지역으로 검색')
    fireEvent.change(searchInput, { target: { value: '김' } })

    await waitFor(() => {
      expect(screen.getByText('김철수')).toBeInTheDocument()
      expect(screen.getByText('이영희')).toBeInTheDocument()
      expect(screen.getByText('010-1234-5678')).toBeInTheDocument()
      expect(screen.getByText('010-9876-5432')).toBeInTheDocument()
    })
  })

  it('고객 클릭 시 페이지 이동과 활동 추가를 해야 한다', async () => {
    mockDashboardDataService.subscribe.mockImplementation(() => jest.fn())
    mockDashboardDataService.searchCustomers.mockReturnValue(mockSearchResults)

    render(<QuickSearch />)

    const searchInput = screen.getByPlaceholderText('고객명, 전화번호, 지역으로 검색')
    fireEvent.change(searchInput, { target: { value: '김' } })

    await waitFor(() => {
      const customerCard = screen.getByText('김철수').closest('div')
      fireEvent.click(customerCard!)
    })

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/doctor/customers')
    expect(mockDashboardDataService.addActivity).toHaveBeenCalledWith({
      type: 'consultation',
      customerId: 1,
      customerName: '김철수',
      description: '김철수 고객 정보를 조회했습니다',
      isRead: true
    })
  })

  it('검색어 지우기 버튼이 작동해야 한다', async () => {
    mockDashboardDataService.subscribe.mockImplementation(() => jest.fn())
    
    render(<QuickSearch />)

    const searchInput = screen.getByPlaceholderText('고객명, 전화번호, 지역으로 검색')
    fireEvent.change(searchInput, { target: { value: '김철수' } })

    await waitFor(() => {
      const clearButton = screen.getByText('✕')
      fireEvent.click(clearButton)
    })

    expect(searchInput).toHaveValue('')
  })

  it('검색 중 로딩 상태를 표시해야 한다', async () => {
    mockDashboardDataService.subscribe.mockImplementation(() => jest.fn())
    mockDashboardDataService.searchCustomers.mockImplementation(() => {
      // 검색 지연 시뮬레이션
      return new Promise(resolve => setTimeout(() => resolve(mockSearchResults), 100))
    })

    render(<QuickSearch />)

    const searchInput = screen.getByPlaceholderText('고객명, 전화번호, 지역으로 검색')
    fireEvent.change(searchInput, { target: { value: '김' } })

    // 로딩 상태 확인
    expect(screen.getByText('검색 중...')).toBeInTheDocument()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('검색 결과가 없을 때 빈 상태를 표시해야 한다', async () => {
    mockDashboardDataService.subscribe.mockImplementation(() => jest.fn())
    mockDashboardDataService.searchCustomers.mockReturnValue([])

    render(<QuickSearch />)

    const searchInput = screen.getByPlaceholderText('고객명, 전화번호, 지역으로 검색')
    fireEvent.change(searchInput, { target: { value: '존재하지않는고객' } })

    await waitFor(() => {
      expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument()
      expect(screen.getByText('다른 검색어를 시도해보세요')).toBeInTheDocument()
    })
  })

  it('고객 상태에 따른 색상을 올바르게 표시해야 한다', async () => {
    mockDashboardDataService.subscribe.mockImplementation(() => jest.fn())
    mockDashboardDataService.searchCustomers.mockReturnValue(mockSearchResults)

    render(<QuickSearch />)

    const searchInput = screen.getByPlaceholderText('고객명, 전화번호, 지역으로 검색')
    fireEvent.change(searchInput, { target: { value: '김' } })

    await waitFor(() => {
      const activeStatus = screen.getByText('진행중')
      const completedStatus = screen.getByText('완료')
      
      expect(activeStatus).toHaveClass('bg-blue-100', 'text-blue-800')
      expect(completedStatus).toHaveClass('bg-green-100', 'text-green-800')
    })
  })

  it('에러 상태를 올바르게 처리해야 한다', async () => {
    mockDashboardDataService.subscribe.mockImplementation(() => jest.fn())
    mockDashboardDataService.searchCustomers.mockImplementation(() => {
      throw new Error('검색 서비스 오류')
    })

    render(<QuickSearch />)

    const searchInput = screen.getByPlaceholderText('고객명, 전화번호, 지역으로 검색')
    fireEvent.change(searchInput, { target: { value: '김' } })

    await waitFor(() => {
      expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument()
      expect(screen.getByText('검색 서비스 오류')).toBeInTheDocument()
    })
  })

  it('최근 검색 기능이 작동해야 한다', async () => {
    mockDashboardDataService.subscribe.mockImplementation(() => jest.fn())
    mockDashboardDataService.searchCustomers.mockReturnValue(mockSearchResults)

    render(<QuickSearch />)

    // 검색 수행
    const searchInput = screen.getByPlaceholderText('고객명, 전화번호, 지역으로 검색')
    fireEvent.change(searchInput, { target: { value: '김' } })

    await waitFor(() => {
      const customerCard = screen.getByText('김철수').closest('div')
      fireEvent.click(customerCard!)
    })

    // 검색어 지우기
    fireEvent.change(searchInput, { target: { value: '' } })

    await waitFor(() => {
      expect(screen.getByText('최근 검색')).toBeInTheDocument()
      expect(screen.getByText('김철수')).toBeInTheDocument()
    })
  })
})