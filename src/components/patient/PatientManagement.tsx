'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Users, TrendingDown, Target, Activity } from 'lucide-react'
import CustomerList from '../customer/CustomerList'
import CustomerForm from '../customer/CustomerForm'
import CustomerDetail from '../customer/CustomerDetail'
import BackButton from '@/components/common/BackButton'
import { Customer, CustomerFilters } from '@/types/customer'
import { customerService } from '@/lib/customerService'
import PatientList from './PatientList'
import PatientDetail from './PatientDetail'
import PatientForm from './PatientForm'
import { patientService } from '@/lib/patientService'
import { customerService } from '@/lib/customerService'

export default function PatientManagement() {
  const [patients, setPatients] = useState<Customer[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Customer[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Customer | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  })

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const data = await patientService.getPatients()
      setPatients(data)
    } catch (error) {
      console.error('고객 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  // 필터링 로직
  useEffect(() => {
    let filtered = [...patients]

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

    setFilteredPatients(filtered)
  }, [patients, filters])

  const handleAddPatient = () => {
    setEditingPatient(null)
    setShowForm(true)
  }

  const handleEditPatient = (customer: Customer) => {
    setEditingPatient(customer)
    setShowForm(true)
  }

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('정말로 이 고객을 삭제하시겠습니까?')) return
    
    try {
      await patientService.deletePatient(patientId)
      setPatients(prev => prev.filter(p => p.id !== patientId))
      if (selectedPatient?.id === patientId) {
        setSelectedPatient(null)
      }
      alert('고객이 삭제되었습니다.')
    } catch (error) {
      console.error('고객 삭제 실패:', error)
      alert('환자 삭제에 실패했습니다.')
    }
  }

  const handleSavePatient = async (patientData: any) => {
    try {
      if (editingPatient) {
        // 수정
        const updatedPatient = await patientService.updatePatient(editingPatient.id, patientData)
        setPatients(prev => prev.map(p => 
          p.id === editingPatient.id ? updatedPatient : p
        ))
        alert('환자 정보가 수정되었습니다.')
      } else {
        // 새 환자 추가
        const newPatientData = {
          ...patientData,
          emergencyContact: patientData.emergencyContactName ? {
            name: patientData.emergencyContactName,
            phone: patientData.emergencyContactPhone,
            relationship: patientData.emergencyContactRelationship
          } : undefined,
          status: 'active' as const,
          startDate: new Date().toISOString().split('T')[0],
          doctorId: 'doctor1'
        }
        const newPatient = await patientService.createPatient(newPatientData)
        setPatients(prev => [newPatient, ...prev])
        alert('환자가 등록되었습니다.')
      }
      setShowForm(false)
      setEditingPatient(null)
    } catch (error) {
      console.error('환자 저장 실패:', error)
      alert('환자 정보 저장에 실패했습니다.')
    }
  }

  // 통계 계산
  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    completed: patients.filter(p => p.status === 'completed').length,
    averageProgress: patients.length > 0 
      ? Math.round(patients.reduce((acc, p) => {
          const progress = ((p.initialWeight - p.currentWeight) / (p.initialWeight - p.targetWeight)) * 100
          return acc + Math.max(0, Math.min(100, progress))
        }, 0) / patients.length)
      : 0
  }

  if (showForm) {
    return (
      <PatientForm
        customer={editingPatient}
        onSave={handleSavePatient}
        onCancel={() => {
          setShowForm(false)
          setEditingPatient(null)
        }}
      />
    )
  }

  if (selectedPatient) {
    return (
      <PatientDetail
        customer={selectedPatient}
        onBack={() => setSelectedPatient(null)}
        onEdit={() => handleEditPatient(selectedPatient)}
        onDelete={() => handleDeletePatient(selectedPatient.id)}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <BackButton className="mb-2" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">환자 관리</h1>
            <p className="text-gray-600 mt-1">환자 정보를 등록하고 관리하세요</p>
          </div>
          <button
            onClick={handleAddPatient}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            새 환자 등록
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">전체 환자</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">활성 환자</p>
              <p className="text-3xl font-bold">{stats.active}</p>
            </div>
            <Activity className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">목표 달성</p>
              <p className="text-3xl font-bold">{stats.completed}</p>
            </div>
            <Target className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">평균 진행률</p>
              <p className="text-3xl font-bold">{stats.averageProgress}%</p>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* 검색 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="환자명, 전화번호, 이메일로 검색"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 필터 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* 환자 목록 */}
      <PatientList
        patients={filteredPatients}
        loading={loading}
        onSelectPatient={setSelectedPatient}
        onEditPatient={handleEditPatient}
        onDeletePatient={handleDeletePatient}
      />
    </div>
  )
}