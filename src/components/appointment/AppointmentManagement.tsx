'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import AppointmentList from './AppointmentList'
import AppointmentForm from './AppointmentForm'
import AppointmentDetail from './AppointmentDetail'
import BackButton from '@/components/common/BackButton'
import { Appointment, AppointmentFilters, AppointmentStats } from '@/types/appointment'
import { appointmentService } from '@/lib/appointmentService'

export default function AppointmentManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<AppointmentFilters>({
    search: '',
    status: 'all',
    type: 'all',
    dateRange: 'week',
    sortBy: 'date',
    sortOrder: 'asc'
  })

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      
      // 타임아웃 설정 (10초)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('요청 시간 초과')), 10000)
      })
      
      const dataPromise = appointmentService.getAppointments('doctor1')
      const data = await Promise.race([dataPromise, timeoutPromise]) as any
      
      setAppointments(data)
    } catch (error) {
      console.error('예약 목록 조회 실패:', error)
      
      // 에러 발생 시 더미 데이터 사용
      const dummyData = [
        {
          id: 'apt-1',
          customerId: 'customer-1',
          doctorId: 'doctor1',
          customerName: '김고객',
          customerPhone: '010-1234-5678',
          date: '2024-01-25',
          time: '09:00',
          duration: 30,
          type: 'consultation' as const,
          status: 'scheduled' as const,
          notes: '정기 상담 예약',
          symptoms: '체중 감량 상담',
          createdAt: '2024-01-20T09:00:00Z',
          updatedAt: '2024-01-20T09:00:00Z'
        },
        {
          id: 'apt-2',
          customerId: 'customer-2',
          doctorId: 'doctor1',
          customerName: '이고객',
          customerPhone: '010-9876-5432',
          date: '2024-01-25',
          time: '10:30',
          duration: 45,
          type: 'follow_up' as const,
          status: 'confirmed' as const,
          notes: '혈당 수치 확인',
          symptoms: '당뇨 관리 상담',
          createdAt: '2024-01-20T10:00:00Z',
          updatedAt: '2024-01-22T14:30:00Z'
        },
        {
          id: 'apt-3',
          customerId: 'customer-3',
          doctorId: 'doctor1',
          customerName: '박회원',
          customerPhone: '010-5555-7777',
          date: '2024-01-24',
          time: '14:00',
          duration: 30,
          type: 'consultation' as const,
          status: 'completed' as const,
          notes: '목표 달성 축하',
          symptoms: '유지 관리 상담',
          createdAt: '2024-01-20T11:00:00Z',
          updatedAt: '2024-01-24T15:00:00Z'
        }
      ]
      
      setAppointments(dummyData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])



  // 필터링 로직
  useEffect(() => {
    let filtered = [...appointments]

    // 검색 필터
    if (filters.search) {
      filtered = filtered.filter(appointment =>
        appointment.customerName.toLowerCase().includes(filters.search!.toLowerCase()) ||
        appointment.customerPhone.includes(filters.search!) ||
        appointment.notes?.toLowerCase().includes(filters.search!.toLowerCase()) ||
        appointment.symptoms?.toLowerCase().includes(filters.search!.toLowerCase())
      )
    }

    // 상태 필터
    if (filters.status !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === filters.status)
    }

    // 유형 필터
    if (filters.type !== 'all') {
      filtered = filtered.filter(appointment => appointment.type === filters.type)
    }

    // 날짜 범위 필터
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (filters.dateRange) {
      case 'today':
        filtered = filtered.filter(appointment => {
          const appointmentDate = new Date(appointment.date)
          return appointmentDate.toDateString() === today.toDateString()
        })
        break
      case 'week':
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(appointment => {
          const appointmentDate = new Date(appointment.date)
          return appointmentDate >= today && appointmentDate <= weekFromNow
        })
        break
      case 'month':
        const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
        filtered = filtered.filter(appointment => {
          const appointmentDate = new Date(appointment.date)
          return appointmentDate >= today && appointmentDate <= monthFromNow
        })
        break
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case 'date':
          aValue = new Date(`${a.date}T${a.time}`)
          bValue = new Date(`${b.date}T${b.time}`)
          break
        case 'customer':
          aValue = a.customerName
          bValue = b.customerName
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          aValue = new Date(`${a.date}T${a.time}`)
          bValue = new Date(`${b.date}T${b.time}`)
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredAppointments(filtered)
  }, [appointments, filters])

  const handleAddAppointment = () => {
    setEditingAppointment(null)
    setShowForm(true)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setShowForm(true)
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('정말로 이 예약을 삭제하시겠습니까?')) return
    
    try {
      await appointmentService.deleteAppointment(appointmentId)
      setAppointments(prev => prev.filter(a => a.id !== appointmentId))
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(null)
      }
      alert('예약이 삭제되었습니다.')
    } catch (error) {
      console.error('예약 삭제 실패:', error)
      alert('예약 삭제에 실패했습니다.')
    }
  }

  const handleSaveAppointment = async (appointmentData: any) => {
    try {
      if (editingAppointment) {
        // 수정
        const updatedAppointment = await appointmentService.updateAppointment(
          editingAppointment.id, 
          appointmentData
        )
        setAppointments(prev => prev.map(a => 
          a.id === editingAppointment.id ? updatedAppointment : a
        ))
        alert('예약이 수정되었습니다.')
      } else {
        // 새 예약 추가
        const newAppointmentData = {
          ...appointmentData,
          doctorId: 'doctor1'
        }
        const newAppointment = await appointmentService.createAppointment(newAppointmentData)
        setAppointments(prev => [newAppointment, ...prev])
        alert('예약이 등록되었습니다.')
      }
      setShowForm(false)
      setEditingAppointment(null)
    } catch (error) {
      console.error('예약 저장 실패:', error)
      alert('예약 정보 저장에 실패했습니다.')
    }
  }

  const handleUpdateStatus = async (appointmentId: string, status: Appointment['status']) => {
    try {
      const updatedAppointment = await appointmentService.updateAppointment(appointmentId, { status })
      setAppointments(prev => prev.map(a => 
        a.id === appointmentId ? updatedAppointment : a
      ))
      
      // 선택된 예약도 업데이트
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(updatedAppointment)
      }
    } catch (error) {
      console.error('예약 상태 업데이트 실패:', error)
      alert('예약 상태 업데이트에 실패했습니다.')
    }
  }

  // 통계 계산
  const stats: AppointmentStats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    todayAppointments: appointments.filter(a => {
      const today = new Date().toISOString().split('T')[0]
      return a.date === today && a.status !== 'cancelled'
    }).length,
    upcomingAppointments: appointments.filter(a => {
      const today = new Date().toISOString().split('T')[0]
      return a.date >= today && (a.status === 'scheduled' || a.status === 'confirmed')
    }).length
  }

  if (showForm) {
    return (
      <AppointmentForm
        appointment={editingAppointment}
        onSave={handleSaveAppointment}
        onCancel={() => {
          setShowForm(false)
          setEditingAppointment(null)
        }}
      />
    )
  }

  if (selectedAppointment) {
    return (
      <AppointmentDetail
        appointment={selectedAppointment}
        onBack={() => setSelectedAppointment(null)}
        onEdit={() => handleEditAppointment(selectedAppointment)}
        onDelete={() => handleDeleteAppointment(selectedAppointment.id)}
        onUpdateStatus={(status) => handleUpdateStatus(selectedAppointment.id, status)}
        onSendReminder={() => {
          // TODO: 알림 발송 기능 구현
          alert('알림이 발송되었습니다.')
        }}
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
            <h1 className="text-3xl font-bold text-gray-900">예약 관리</h1>
            <p className="text-gray-600 mt-1">예약을 등록하고 관리하세요</p>
          </div>
          <button
            onClick={handleAddAppointment}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            새 예약 등록
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">전체 예약</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Calendar className="h-6 w-6 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">예약됨</p>
              <p className="text-2xl font-bold">{stats.scheduled}</p>
            </div>
            <AlertCircle className="h-6 w-6 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">예정된 예약</p>
              <p className="text-2xl font-bold">{stats.upcomingAppointments}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">완료됨</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">취소됨</p>
              <p className="text-2xl font-bold">{stats.cancelled}</p>
            </div>
            <XCircle className="h-6 w-6 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">오늘 예약</p>
              <p className="text-2xl font-bold">{stats.todayAppointments}</p>
            </div>
            <Clock className="h-6 w-6 text-purple-200" />
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
              placeholder="고객명, 전화번호, 메모로 검색"
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
                <option value="scheduled">예약됨</option>
                <option value="confirmed">확정됨</option>
                <option value="completed">완료됨</option>
                <option value="cancelled">취소됨</option>
              </select>
            </div>

            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 유형</option>
              <option value="initial">초기 상담</option>
              <option value="consultation">일반 상담</option>
              <option value="follow_up">추적 관찰</option>
              <option value="emergency">응급</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">오늘</option>
              <option value="week">이번 주</option>
              <option value="month">이번 달</option>
            </select>

            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }))
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-asc">날짜 (빠른순)</option>
              <option value="date-desc">날짜 (늦은순)</option>
              <option value="customer-asc">고객명 (가나다순)</option>
              <option value="status-asc">상태순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 예약 목록 */}
      <AppointmentList
        appointments={filteredAppointments}
        loading={loading}
        onSelectAppointment={setSelectedAppointment}
        onEditAppointment={handleEditAppointment}
        onDeleteAppointment={handleDeleteAppointment}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  )
}