'use client'

import React from 'react'
import { Edit, Trash2, Eye, Phone, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import { Appointment } from '@/types/appointment'

interface AppointmentListProps {
  appointments: Appointment[]
  loading: boolean
  onSelectAppointment: (appointment: Appointment) => void
  onEditAppointment: (appointment: Appointment) => void
  onDeleteAppointment: (appointmentId: string) => void
  onUpdateStatus: (appointmentId: string, status: Appointment['status']) => void
}

export default function AppointmentList({
  appointments,
  loading,
  onSelectAppointment,
  onEditAppointment,
  onDeleteAppointment,
  onUpdateStatus
}: AppointmentListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no-show':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '예약됨'
      case 'confirmed':
        return '확정됨'
      case 'completed':
        return '완료됨'
      case 'cancelled':
        return '취소됨'
      case 'no-show':
        return '노쇼'
      default:
        return '알 수 없음'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'cancelled':
      case 'no-show':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'consultation':
        return '상담'
      case 'checkup':
        return '검진'
      case 'follow-up':
        return '재진'
      case 'weight-check':
        return '체중 측정'
      case 'diet-consultation':
        return '식단 상담'
      default:
        return '상담'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800'
      case 'checkup':
        return 'bg-green-100 text-green-800'
      case 'follow-up':
        return 'bg-purple-100 text-purple-800'
      case 'weight-check':
        return 'bg-orange-100 text-orange-800'
      case 'diet-consultation':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const formatTime = (time: string) => {
    return time
  }

  const isToday = (dateString: string) => {
    const today = new Date().toDateString()
    const appointmentDate = new Date(dateString).toDateString()
    return today === appointmentDate
  }

  const isPast = (dateString: string, time: string) => {
    const now = new Date()
    const appointmentDateTime = new Date(`${dateString}T${time}`)
    return appointmentDateTime < now
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <LoadingSpinner size="lg" text="예약 목록을 불러오는 중..." />
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <EmptyState
          icon={<Calendar className="h-20 w-20 text-gray-300" />}
          title="등록된 예약이 없습니다"
          description="새 예약을 등록하여 일정을 관리하세요"
          variant="appointments"
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 테이블 헤더 */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
          <div className="col-span-3">환자 정보</div>
          <div className="col-span-2">예약 일시</div>
          <div className="col-span-2">유형 및 장소</div>
          <div className="col-span-2">상태</div>
          <div className="col-span-2">연락처</div>
          <div className="col-span-1">액션</div>
        </div>
      </div>

      {/* 테이블 바디 */}
      <div className="divide-y divide-gray-200">
        {appointments.map((appointment) => {
          const isAppointmentToday = isToday(appointment.date)
          const isAppointmentPast = isPast(appointment.date, appointment.time)

          return (
            <div
              key={appointment.id}
              className={`px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                isAppointmentToday ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              } ${isAppointmentPast && appointment.status === 'scheduled' ? 'opacity-75' : ''}`}
              onClick={() => onSelectAppointment(appointment)}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* 환자 정보 */}
                <div className="col-span-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {appointment.customerName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{appointment.customerName}</p>
                      <p className="text-sm text-gray-600">ID: {appointment.customerId}</p>
                    </div>
                  </div>
                </div>

                {/* 예약 일시 */}
                <div className="col-span-2">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                      <span className={`font-medium ${isAppointmentToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {formatDate(appointment.date)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-3 h-3 mr-1 text-gray-400" />
                      {formatTime(appointment.time)} ({appointment.duration}분)
                    </div>
                  </div>
                </div>

                {/* 유형 및 장소 */}
                <div className="col-span-2">
                  <div className="space-y-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(appointment.type)}`}>
                      {getTypeText(appointment.type)}
                    </span>

                  </div>
                </div>

                {/* 상태 */}
                <div className="col-span-2">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(appointment.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    
                    {/* 빠른 상태 변경 버튼 */}
                    {appointment.status === 'scheduled' && (
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onUpdateStatus(appointment.id, 'confirmed')
                          }}
                          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
                        >
                          확정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onUpdateStatus(appointment.id, 'cancelled')
                          }}
                          className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    )}
                    
                    {appointment.status === 'confirmed' && !isAppointmentPast && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onUpdateStatus(appointment.id, 'completed')
                        }}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors"
                      >
                        완료
                      </button>
                    )}
                  </div>
                </div>

                {/* 연락처 */}
                <div className="col-span-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-3 h-3 mr-1" />
                    <a 
                      href={`tel:${appointment.customerPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {appointment.customerPhone}
                    </a>
                  </div>

                </div>

                {/* 액션 */}
                <div className="col-span-1">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectAppointment(appointment)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="상세 보기"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditAppointment(appointment)
                      }}
                      className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="수정"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteAppointment(appointment.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 메모 표시 */}
              {appointment.notes && (
                <div className="mt-3 pl-13">
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>메모:</strong> {appointment.notes}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 푸터 */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>총 {appointments.length}개의 예약이 있습니다</p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>오늘 예약</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>완료</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>취소</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}