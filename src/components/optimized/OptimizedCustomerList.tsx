'use client'
import React, { memo, useMemo, useCallback } from 'react'
import { Customer } from '@/types/customer'
import { usePagination, useVirtualizedList } from '@/components/common/Pagination'
import Pagination from '@/components/common/Pagination'
import { LazyImage, ViewportLazy } from '@/components/common/LazyWrapper'
import { useCache } from '@/lib/cache'
import { performanceMonitor } from '@/lib/performance'
import { Search, Filter, User, Phone, Calendar } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface OptimizedCustomerListProps {
  customers: Customer[]
  onCustomerSelect?: (customer: Customer) => void
  onCustomerEdit?: (customer: Customer) => void
  searchable?: boolean
  filterable?: boolean
  virtualizeThreshold?: number
}

// 개별 고객 카드 컴포넌트 (메모화)
const CustomerCard = memo(({ 
  customer, 
  onSelect, 
  onEdit 
}: { 
  customer: Customer
  onSelect?: (customer: Customer) => void
  onEdit?: (customer: Customer) => void
}) => {
  const handleSelect = useCallback(() => {
    const startTime = performance.now()
    onSelect?.(customer)
    performanceMonitor.measureInteraction('customer_select', startTime)
  }, [customer, onSelect])

  const handleEdit = useCallback(() => {
    const startTime = performance.now()
    onEdit?.(customer)
    performanceMonitor.measureInteraction('customer_edit', startTime)
  }, [customer, onEdit])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {customer.name}
            </h3>
            <div className="mt-1 flex items-center text-xs text-gray-500 space-x-4">
              <div className="flex items-center">
                <Phone className="w-3 h-3 mr-1" />
                <span className="truncate">{customer.phone}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{new Date(customer.birthDate).getFullYear()}년생</span>
              </div>
            </div>
            {customer.lastVisit && (
              <div className="mt-1 text-xs text-gray-400">
                최근 방문: {new Date(customer.lastVisit).toLocaleDateString('ko-KR')}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="text-xs"
            >
              수정
            </Button>
          )}
          {onSelect && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSelect}
              className="text-xs"
            >
              선택
            </Button>
          )}
        </div>
      </div>

      {/* 추가 정보 (조건부 렌더링) */}
      {(customer.currentWeight || customer.targetWeight) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-600">
            {customer.currentWeight && (
              <span>현재: {customer.currentWeight}kg</span>
            )}
            {customer.targetWeight && (
              <span>목표: {customer.targetWeight}kg</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

CustomerCard.displayName = 'CustomerCard'

// 가상화된 리스트 컴포넌트
const VirtualizedCustomerList = memo(({ 
  customers, 
  onCustomerSelect, 
  onCustomerEdit,
  containerHeight = 600,
  itemHeight = 120
}: {
  customers: Customer[]
  onCustomerSelect?: (customer: Customer) => void
  onCustomerEdit?: (customer: Customer) => void
  containerHeight?: number
  itemHeight?: number
}) => {
  const { visibleStart, visibleEnd, totalHeight, offsetY, handleScroll } = useVirtualizedList(
    customers.length,
    itemHeight,
    containerHeight
  )

  const visibleCustomers = useMemo(() => 
    customers.slice(visibleStart, visibleEnd),
    [customers, visibleStart, visibleEnd]
  )

  return (
    <div 
      className="overflow-auto border border-gray-200 rounded-lg"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          <div className="space-y-2 p-4">
            {visibleCustomers.map((customer, index) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onSelect={onCustomerSelect}
                onEdit={onCustomerEdit}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

VirtualizedCustomerList.displayName = 'VirtualizedCustomerList'

// 메인 컴포넌트
export default function OptimizedCustomerList({
  customers,
  onCustomerSelect,
  onCustomerEdit,
  searchable = true,
  filterable = true,
  virtualizeThreshold = 100
}: OptimizedCustomerListProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = React.useState<'name' | 'lastVisit' | 'createdAt'>('name')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc')

  // 성능 모니터링
  React.useEffect(() => {
    performanceMonitor.measurePageLoad('customer_list')
  }, [])

  // 필터링 및 정렬된 고객 목록 (메모화)
  const filteredAndSortedCustomers = useMemo(() => {
    const startTime = performance.now()
    
    let filtered = customers

    // 검색 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        customer.email?.toLowerCase().includes(term)
      )
    }

    // 상태 필터
    if (filterStatus !== 'all') {
      filtered = filtered.filter(customer => {
        if (filterStatus === 'active') {
          return customer.lastVisit && 
            new Date(customer.lastVisit) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90일 이내
        }
        return !customer.lastVisit || 
          new Date(customer.lastVisit) <= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      })
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'lastVisit':
          aValue = a.lastVisit ? new Date(a.lastVisit) : new Date(0)
          bValue = b.lastVisit ? new Date(b.lastVisit) : new Date(0)
          break
        case 'createdAt':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    performanceMonitor.measureInteraction('customer_filter_sort', startTime)
    return filtered
  }, [customers, searchTerm, filterStatus, sortBy, sortOrder])

  // 페이지네이션
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    pageInfo,
    handlePageChange,
    handleItemsPerPageChange,
    getPageData
  } = usePagination(filteredAndSortedCustomers.length, 20)

  // 현재 페이지 데이터
  const currentPageCustomers = useMemo(() => {
    if (filteredAndSortedCustomers.length <= virtualizeThreshold) {
      return getPageData(filteredAndSortedCustomers)
    }
    return filteredAndSortedCustomers
  }, [filteredAndSortedCustomers, getPageData, virtualizeThreshold])

  // 검색 핸들러 (디바운싱)
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (value: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setSearchTerm(value)
      }, 300)
    }
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value)
  }, [debouncedSearch])

  // 대용량 데이터인 경우 가상화 사용
  const shouldUseVirtualization = filteredAndSortedCustomers.length > virtualizeThreshold

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 */}
      {(searchable || filterable) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="고객 이름, 전화번호, 이메일로 검색..."
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          )}

          {filterable && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="active">활성 고객</option>
                <option value="inactive">비활성 고객</option>
              </select>

              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_')
                  setSortBy(field as any)
                  setSortOrder(order as any)
                }}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name_asc">이름 ↑</option>
                <option value="name_desc">이름 ↓</option>
                <option value="lastVisit_desc">최근 방문 ↓</option>
                <option value="lastVisit_asc">최근 방문 ↑</option>
                <option value="createdAt_desc">등록일 ↓</option>
                <option value="createdAt_asc">등록일 ↑</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* 결과 요약 */}
      <div className="text-sm text-gray-600">
        총 {filteredAndSortedCustomers.length.toLocaleString()}명의 고객
        {searchTerm && ` (검색: "${searchTerm}")`}
        {filterStatus !== 'all' && ` (필터: ${filterStatus === 'active' ? '활성' : '비활성'})`}
      </div>

      {/* 고객 목록 */}
      {shouldUseVirtualization ? (
        <ViewportLazy>
          <VirtualizedCustomerList
            customers={filteredAndSortedCustomers}
            onCustomerSelect={onCustomerSelect}
            onCustomerEdit={onCustomerEdit}
          />
        </ViewportLazy>
      ) : (
        <div className="space-y-2">
          {currentPageCustomers.map(customer => (
            <ViewportLazy key={customer.id}>
              <CustomerCard
                customer={customer}
                onSelect={onCustomerSelect}
                onEdit={onCustomerEdit}
              />
            </ViewportLazy>
          ))}
        </div>
      )}

      {/* 페이지네이션 (가상화 사용하지 않는 경우만) */}
      {!shouldUseVirtualization && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAndSortedCustomers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* 빈 상태 */}
      {filteredAndSortedCustomers.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">고객이 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus !== 'all' 
              ? '검색 조건을 변경해보세요.' 
              : '새 고객을 등록해보세요.'
            }
          </p>
        </div>
      )}
    </div>
  )
}