/**
 * 의료진용 고객 관리 대시보드
 * 개인정보 보호 법규를 준수하며 고객 정보를 안전하게 관리합니다.
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { customerManagementService } from '@/lib/customerManagementService'
import {
  CustomerInfo,
  CustomerFilter,
  CustomerStats,
  FlaggedActivity,
  CustomerManagementPermissions
} from '@/types/customerManagement'

interface CustomerManagementDashboardProps {
  className?: string
}

export default function CustomerManagementDashboard({ 
  className = '' 
}: CustomerManagementDashboardProps) {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<CustomerInfo[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [permissions, setPermissions] = useState<CustomerManagementPermissions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 필터 및 페이지네이션 상태
  const [filter, setFilter] = useState<CustomerFilter>({
    page: 1,
    limit: 20,
    sortBy: 'joinedAt',
    sortOrder: 'desc'
  })
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null)
  const [showCustomerDetails, setShowCustomerDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'analytics' | 'alerts'>('overview')

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user?.id, filter])

  const loadDashboardData = async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      // 병렬로 데이터 로드
      const [customersResponse, statsData] = await Promise.all([
        customerManagementService.getCustomersByDoctor(user.id, filter),
        customerManagementService.getCustomerStats(user.id)
      ])

      setCustomers(customersResponse.customers)
      setStats(statsData)
      
      // 첫 번째 고객의 권한 정보로 전체 권한 설정
      if (customersResponse.customers.length > 0) {
        const detailsResponse = await customerManagementService.getCustomerDetails(
          customersResponse.customers[0].id,
          user.id
        )
        setPermissions(detailsResponse.permissions)
      }

    } catch (err) {
      console.error('대시보드 데이터 로드 실패:', err)
      setError(err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }  const han
dleCustomerSelect = async (customer: CustomerInfo) => {
    setSelectedCustomer(customer)
    setShowCustomerDetails(true)
  }

  const handleFilterChange = (newFilter: Partial<CustomerFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter, page: 1 }))
  }

  const getStatusColor = (status: CustomerInfo['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-gray-600 bg-gray-100'
      case 'suspended': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusLabel = (status: CustomerInfo['status']) => {
    switch (status) {
      case 'active': return '활성'
      case 'inactive': return '비활성'
      case 'suspended': return '정지'
      default: return '알 수 없음'
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user || user.role !== 'doctor') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">의사 권한이 필요합니다.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-medium text-red-900">오류 발생</h4>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  } 
 return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">고객 관리</h2>
          <p className="text-gray-600 mt-1">
            병원 소속 고객들의 정보를 안전하게 관리합니다
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            새로고침
          </button>
          {permissions?.canExportData && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              데이터 내보내기
            </button>
          )}
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 고객</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">활성 고객</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">이번 달 신규</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.newCustomersThisMonth}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">월간 유지율</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(stats.retentionRate.monthly * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}    
  {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: '개요', icon: '📊' },
            { id: 'customers', name: '고객 목록', icon: '👥' },
            { id: 'analytics', name: '분석', icon: '📈' },
            { id: 'alerts', name: '알림', icon: '🚨' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 최근 가입 고객 */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">최근 가입 고객</h3>
            </div>
            <div className="p-6">
              {customers.slice(0, 5).length > 0 ? (
                <div className="space-y-4">
                  {customers.slice(0, 5).map(customer => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {customer.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(customer.joinedAt)} 가입
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {getStatusLabel(customer.status)}
                        </span>
                        <button
                          onClick={() => handleCustomerSelect(customer)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          상세보기
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <p className="text-gray-600">등록된 고객이 없습니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* 가입 트렌드 차트 */}
          {stats && stats.joinTrends.length > 0 && (
            <div className="bg-white rounded-lg shadow border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">가입 트렌드 (최근 30일)</h3>
              </div>
              <div className="p-6">
                <div className="h-64 flex items-end space-x-1">
                  {stats.joinTrends.map((trend, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{
                          height: `${Math.max((trend.count / Math.max(...stats.joinTrends.map(t => t.count))) * 200, 4)}px`
                        }}
                      ></div>
                      <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                        {new Date(trend.date).getDate()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}      {ac
tiveTab === 'customers' && (
        <div className="space-y-6">
          {/* 필터 및 검색 */}
          <div className="bg-white rounded-lg shadow border p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  검색
                </label>
                <input
                  type="text"
                  placeholder="이름 또는 이메일 검색..."
                  value={filter.searchTerm || ''}
                  onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상태
                </label>
                <select
                  value={filter.status?.[0] || ''}
                  onChange={(e) => handleFilterChange({ 
                    status: e.target.value ? [e.target.value as CustomerInfo['status']] : undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">전체</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="suspended">정지</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  정렬 기준
                </label>
                <select
                  value={filter.sortBy || 'joinedAt'}
                  onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="joinedAt">가입일</option>
                  <option value="name">이름</option>
                  <option value="lastActiveAt">최근 활동</option>
                  <option value="totalAppointments">예약 수</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  정렬 순서
                </label>
                <select
                  value={filter.sortOrder || 'desc'}
                  onChange={(e) => handleFilterChange({ sortOrder: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">내림차순</option>
                  <option value="asc">오름차순</option>
                </select>
              </div>
            </div>
          </div>

          {/* 고객 목록 */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                고객 목록 ({customers.length}명)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      고객 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가입일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      최근 활동
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      예약 수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {customer.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {getStatusLabel(customer.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(customer.joinedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.lastActiveAt ? formatDate(customer.lastActiveAt) : '없음'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.totalAppointments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleCustomerSelect(customer)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          상세보기
                        </button>
                        {customer.flaggedActivities.length > 0 && (
                          <span className="text-red-600 text-xs">
                            🚩 {customer.flaggedActivities.length}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {customers.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-gray-600">조건에 맞는 고객이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      )}    
  {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          {/* 상위 활동 */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">주요 활동</h3>
            </div>
            <div className="p-6">
              {stats.topActivities.length > 0 ? (
                <div className="space-y-4">
                  {stats.topActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {activity.activity}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${activity.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-16 text-right">
                          {activity.count}회
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">활동 데이터가 없습니다.</p>
              )}
            </div>
          </div>

          {/* 유지율 지표 */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">고객 유지율</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round(stats.retentionRate.daily * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">일간 유지율</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round(stats.retentionRate.weekly * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">주간 유지율</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {Math.round(stats.retentionRate.monthly * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">월간 유지율</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">플래그된 활동</h3>
            </div>
            <div className="p-6">
              {customers.some(c => c.flaggedActivities.length > 0) ? (
                <div className="space-y-4">
                  {customers
                    .filter(c => c.flaggedActivities.length > 0)
                    .map(customer => (
                      <div key={customer.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{customer.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {customer.flaggedActivities.length}개의 플래그된 활동
                            </p>
                            <div className="mt-2 space-y-1">
                              {customer.flaggedActivities.slice(0, 2).map(flag => (
                                <div key={flag.id} className="text-sm">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    flag.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                    flag.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                    flag.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {flag.severity.toUpperCase()}
                                  </span>
                                  <span className="ml-2 text-gray-700">
                                    {flag.description}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCustomerSelect(customer)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            상세보기
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600">플래그된 활동이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}