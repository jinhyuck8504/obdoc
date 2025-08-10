'use client'
import React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import Button from '@/components/ui/Button'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  showItemsPerPage?: boolean
  showTotalItems?: boolean
  maxVisiblePages?: number
  className?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  showTotalItems = true,
  maxVisiblePages = 7,
  className = ''
}: PaginationProps) {
  // 페이지 번호 배열 생성
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | 'ellipsis')[] = []
    const halfVisible = Math.floor(maxVisiblePages / 2)

    // 항상 첫 페이지 표시
    pages.push(1)

    if (currentPage <= halfVisible + 2) {
      // 현재 페이지가 앞쪽에 있을 때
      for (let i = 2; i <= Math.min(maxVisiblePages - 1, totalPages - 1); i++) {
        pages.push(i)
      }
      if (totalPages > maxVisiblePages - 1) {
        pages.push('ellipsis')
      }
    } else if (currentPage >= totalPages - halfVisible - 1) {
      // 현재 페이지가 뒤쪽에 있을 때
      if (totalPages > maxVisiblePages - 1) {
        pages.push('ellipsis')
      }
      for (let i = Math.max(2, totalPages - maxVisiblePages + 2); i <= totalPages - 1; i++) {
        pages.push(i)
      }
    } else {
      // 현재 페이지가 중간에 있을 때
      pages.push('ellipsis')
      for (let i = currentPage - halfVisible + 1; i <= currentPage + halfVisible - 1; i++) {
        pages.push(i)
      }
      pages.push('ellipsis')
    }

    // 항상 마지막 페이지 표시
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const visiblePages = getVisiblePages()
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const itemsPerPageOptions = [10, 20, 50, 100]

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* 총 항목 수 및 현재 범위 */}
      {showTotalItems && (
        <div className="text-sm text-gray-600">
          총 {totalItems.toLocaleString()}개 중 {startItem.toLocaleString()}-{endItem.toLocaleString()}개 표시
        </div>
      )}

      {/* 페이지 네비게이션 */}
      <div className="flex items-center gap-2">
        {/* 이전 페이지 버튼 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2"
          aria-label="이전 페이지"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* 페이지 번호들 */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => (
            page === 'ellipsis' ? (
              <div key={`ellipsis-${index}`} className="px-2 py-1">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </div>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                className="min-w-[2.5rem] h-10"
                aria-label={`페이지 ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </Button>
            )
          ))}
        </div>

        {/* 다음 페이지 버튼 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2"
          aria-label="다음 페이지"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* 페이지당 항목 수 선택 */}
      {showItemsPerPage && onItemsPerPageChange && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">페이지당</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="페이지당 항목 수"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>
                {option}개
              </option>
            ))}
          </select>
          <span className="text-gray-600">표시</span>
        </div>
      )}
    </div>
  )
}

// 페이지네이션 훅
export function usePagination(
  totalItems: number,
  initialItemsPerPage: number = 20,
  initialPage: number = 1
) {
  const [currentPage, setCurrentPage] = React.useState(initialPage)
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage)

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // 페이지 변경 시 유효성 검사
  const handlePageChange = React.useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  // 페이지당 항목 수 변경 시 첫 페이지로 이동
  const handleItemsPerPageChange = React.useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }, [])

  // 현재 페이지의 데이터 범위 계산
  const getPageData = React.useCallback((data: any[]): any[] => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }, [currentPage, itemsPerPage])

  // 페이지 정보
  const pageInfo = React.useMemo(() => ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startItem: (currentPage - 1) * itemsPerPage + 1,
    endItem: Math.min(currentPage * itemsPerPage, totalItems),
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  }), [currentPage, totalPages, totalItems, itemsPerPage])

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    pageInfo,
    handlePageChange,
    handleItemsPerPageChange,
    getPageData
  }
}

// 무한 스크롤 훅
export function useInfiniteScroll<T>(
  fetchMore: (page: number) => Promise<T[]>,
  initialData: T[] = [],
  itemsPerPage: number = 20
) {
  const [data, setData] = React.useState<T[]>(initialData)
  const [loading, setLoading] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [error, setError] = React.useState<Error | null>(null)

  const loadMore = React.useCallback(async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)
      setError(null)
      
      const newData = await fetchMore(page)
      
      if (newData.length < itemsPerPage) {
        setHasMore(false)
      }
      
      setData(prev => [...prev, ...newData])
      setPage(prev => prev + 1)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [fetchMore, page, loading, hasMore, itemsPerPage])

  // 스크롤 이벤트 리스너 (클라이언트에서만)
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 // 1000px 전에 로드
      ) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])

  const reset = React.useCallback(() => {
    setData(initialData)
    setPage(1)
    setHasMore(true)
    setError(null)
  }, [initialData])

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset
  }
}

// 가상화된 리스트 훅 (대용량 데이터용)
export function useVirtualizedList(
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = React.useState(0)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    itemCount
  )

  const totalHeight = itemCount * itemHeight
  const offsetY = visibleStart * itemHeight

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleStart,
    visibleEnd,
    totalHeight,
    offsetY,
    handleScroll
  }
}