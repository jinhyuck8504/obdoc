'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, Phone, Calendar, MapPin, Star, Clock } from 'lucide-react'
import { Customer } from '@/types/customer'
import { customerService } from '@/lib/customerService'

export default function QuickSearch() {
  const router = useRouter()
  // TODO: density 기능 임시 제거 (빌드 오류 해결 후 재추가)
  // const { density, getDensityClass } = useDensity()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  
  // TODO: 빌드 오류 해결을 위해 임시로 빈 배열 사용
  const mockCustomers: Customer[] = []

  const searchCustomers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      
      // 실제 API 호출 대신 로컬 데이터에서 검색
      await new Promise(resolve => setTimeout(resolve, 300)) // 검색 지연 시뮬레이션
      
      const filteredCustomers = mockCustomers.filter(customer => 
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone.includes(query) ||
        (customer.address && customer.address.toLowerCase().includes(query.toLowerCase()))
      )
      
      setSearchResults(filteredCustomers.slice(0, 5)) // 최대 5개 결과만 표시
    } catch (error) {
      console.error('고객 검색 실패:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // 검색 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleCustomerClick = (customer: Customer) => {
    // 최근 검색에 추가
    setRecentSearches(prev => {
      const updated = [customer.name, ...prev.filter(name => name !== customer.name)]
      return updated.slice(0, 5) // 최대 5개까지만 저장
    })
    // 고객 관리 페이지로 이동
    router.push('/dashboard/doctor/customers')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료'
      case 'active':
        return '진행중'
      case 'inactive':
        return '비활성'
      default:
        return '알 수 없음'
    }
  }

  const calculateProgress = (customer: Customer) => {
    const totalLoss = customer.initialWeight - customer.targetWeight
    const currentLoss = customer.initialWeight - customer.currentWeight
    return Math.max(0, Math.min(100, (currentLoss / totalLoss) * 100))
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 고객 검색</h2>
      
      <div className="relative mb-4">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
          isSearching ? 'text-blue-500 animate-pulse' : 'text-gray-400'
        }`} />
        <input
          type="text"
          placeholder="고객명, 전화번호, 지역으로 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* 최근 검색 */}
      {!searchTerm && recentSearches.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">최근 검색</h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => setSearchTerm(search)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
              >
                <Clock className="w-3 h-3 inline mr-1" />
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {isSearching ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 text-sm mt-2">검색 중...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {searchTerm ? '검색 결과가 없습니다' : '고객을 검색해보세요'}
            </p>
            {searchTerm && (
              <p className="text-xs text-gray-400 mt-1">
                다른 검색어를 시도해보세요
              </p>
            )}
          </div>
        ) : (
          searchResults.map((customer) => {
            const progress = calculateProgress(customer)
            return (
              <div
                key={customer.id}
                onClick={() => handleCustomerClick(customer)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="font-medium text-gray-900 group-hover:text-blue-700">
                        {customer.name}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(customer.status)}`}>
                        {getStatusText(customer.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-3 h-3 mr-2" />
                        {customer.phone}
                      </div>
                      
                      {customer.address && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-3 h-3 mr-2" />
                          {customer.address}
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-3 h-3 mr-2" />
                        최근 방문: {customer.lastVisit || customer.startDate}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-xs text-gray-500 mb-2">
                      진행률 {progress.toFixed(0)}%
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${
                          customer.status === 'completed' ? 'bg-green-500' :
                          customer.status === 'active' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 빠른 액션 */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
        <a
          href="/dashboard/doctor/customers"
          className="w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors block"
        >
          전체 환자 목록 보기
        </a>
        {searchTerm && searchResults.length > 0 && (
          <button className="w-full text-left p-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
            + 새 고객으로 "{searchTerm}" 등록
          </button>
        )}
      </div>
    </div>
  )
}