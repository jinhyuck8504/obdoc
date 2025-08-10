'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Users, TrendingDown, Target, Activity } from 'lucide-react'
import CustomerList from './CustomerList'
import CustomerForm from './CustomerForm'
import CustomerDetail from './CustomerDetail'
import BackButton from '@/components/common/BackButton'
import { Customer, CustomerFilters } from '@/types/customer'
import { customerService } from '@/lib/customerService'

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  })

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const data = await customerService.getCustomers()
      setCustomers(data)
    } catch (error) {
      console.error('고객 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  // 필터링 로직
  useEffect(() => {
    let filtered = [...customers]

    // 검색 필터
    if (filters.search) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        customer.phone.includes(filters.search) ||
        customer.email?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // 상태 필터
    if (filters.status !== 'all') {
      filtered = filtered.filter(customer => customer.status === filters.status)
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'startDate':
          aValue = new Date(a.startDate)
          bValue = new Date(b.startDate)
          break
        case 'lastVisit':
          aValue = new Date(a.lastVisit || a.startDate)
          bValue = new Date(b.lastVisit || b.startDate)
          break
        case 'progress':
          aValue = ((a.initialWeight - a.currentWeight) / (a.initialWeight - a.targetWeight)) * 100
          bValue = ((b.initialWeight - b.currentWeight) / (b.initialWeight - b.targetWeight)) * 100
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredCustomers(filtered)
  }, [customers, filters])

  const handleAddCustomer = () => {
    setEditingCustomer(null)
    setShowForm(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('정말로 이 고객을 삭제하시겠습니까?')) return
    
    try {
      await customerService.deleteCustomer(customerId)
      setCustomers(prev => prev.filter(c => c.id !== customerId))
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(null)
      }
      alert('고객이 삭제되었습니다.')
    } catch (error) {
      console.error('고객 삭제 실패:', error)
      alert('고객 삭제에 실패했습니다.')
    }
  }

  const handleSaveCustomer = async (customerData: any) => {
    try {
      if (editingCustomer) {
        // 수정
        const updatedCustomer = await customerService.updateCustomer(editingCustomer.id, customerData)
        setCustomers(prev => prev.map(c => 
          c.id === editingCustomer.id ? updatedCustomer : c
        ))
        alert('고객 정보가 수정되었습니다.')
      } else {
        // 새 고객 추가
        const newCustomerData = {
          ...customerData,
          emergencyContact: customerData.emergencyContactName ? {
            name: customerData.emergencyContactName,
            phone: customerData.emergencyContactPhone,
            relationship: customerData.emergencyContactRelationship
          } : undefined,
          status: 'active' as const,
          startDate: new Date().toISOString().split('T')[0],
          doctorId: 'doctor1'
        }
        const newCustomer = await customerService.createCustomer(newCustomerData)
        setCustomers(prev => [newCustomer, ...prev])
        alert('고객이 등록되었습니다.')
      }
      setShowForm(false)
      setEditingCustomer(null)
    } catch (error) {
      console.error('고객 저장 실패:', error)
      alert('고객 정보 저장에 실패했습니다.')
    }
  }

  // 통계 계산
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    completed: customers.filter(c => c.status === 'completed').length,
    averageProgress: customers.length > 0 
      ? Math.round(customers.reduce((acc, c) => {
          const progress = ((c.initialWeight - c.currentWeight) / (c.initialWeight - c.targetWeight)) * 100
          return acc + Math.max(0, Math.min(100, progress))
        }, 0) / customers.length)
      : 0
  }

  if (showForm) {
    return (
      <CustomerForm
        customer={editingCustomer}
        onSave={handleSaveCustomer}
        onCancel={() => {
          setShowForm(false)
          setEditingCustomer(null)
        }}
      />
    )
  }

  if (selectedCustomer) {
    return (
      <CustomerDetail
        customer={selectedCustomer}
        onBack={() => setSelectedCustomer(null)}
        onEdit={() => handleEditCustomer(selectedCustomer)}
        onDelete={() => handleDeleteCustomer(selectedCustomer.id)}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* 헤더 - 여백 최적화 */}
      <div className="mb-4">
        <BackButton className="mb-1" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">고객 관리</h1>
            <p className="text-gray-600 text-sm mt-1">고객 정보를 등록하고 관리하세요</p>
          </div>
          <button
            onClick={handleAddCustomer}
            className="mt-3 sm:mt-0 inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 고객 등록
          </button>
        </div>
      </div>

      {/* 통계 카드 - 간격 최적화 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-3 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-medium">전체 고객</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-6 w-6 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-3 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs font-medium">활성 고객</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
            <Activity className="h-6 w-6 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-3 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs font-medium">목표 달성</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
            <Target className="h-6 w-6 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg p-3 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs font-medium">평균 진행률</p>
              <p className="text-2xl font-bold">{stats.averageProgress}%</p>
            </div>
            <TrendingDown className="h-6 w-6 text-orange-200" />
          </div>
        </div>
      </div>

      {/* 필터 및 검색 - 패딩 최적화 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 lg:space-x-4">
          {/* 검색 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="고객명, 전화번호, 이메일로 검색"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 필터 */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체 상태</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
                <option value="completed">완료</option>
              </select>
            </div>

            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }))
              }}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name-asc">이름 (가나다순)</option>
              <option value="name-desc">이름 (역순)</option>
              <option value="startDate-desc">등록일 (최신순)</option>
              <option value="startDate-asc">등록일 (오래된순)</option>
              <option value="lastVisit-desc">최근 방문 (최신순)</option>
              <option value="progress-desc">진행률 (높은순)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 고객 목록 */}
      <CustomerList
        customers={filteredCustomers}
        loading={loading}
        onSelectCustomer={setSelectedCustomer}
        onEditCustomer={handleEditCustomer}
        onDeleteCustomer={handleDeleteCustomer}
      />
    </div>
  )
}