'use client'

import React, { useState } from 'react'
import { ArrowLeft, Edit, Trash2, Phone, Calendar, Clock, User, FileText, Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Appointment } from '@/types/appointment'

interface AppointmentDetailProps {
  appointment: Appointment
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onUpdateStatus: (status: Appointment['status']) => void
  onSendReminder: () => void
}

export default function AppointmentDetail({ 
  appointment, 
  onBack, 
  onEdit, 
  onDelete, 
  onUpdateStatus,
  onSendReminder 
}: AppointmentDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'no-show':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
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
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'cancelled':
      case 'no-show':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
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

  const getTimeUntilAppointment = () => {
    const now = new Date()
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`)
    const diffMs = appointmentDateTime.getTime() - now.getTime()
    
    if (diffMs < 0) {
      return '지난 예약'
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours < 1) {
      return `${diffMinutes}분 후`
    } else if (diffHours < 24) {
      return `${diffHours}시간 ${diffMinutes}분 후`
    } else {
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}일 후`
    }
  }

  const handleDelete = () => {
    onDelete()
    setShowDeleteConfirm(false)
  }

  const appointmentPast = isPast(appointment.date, appointment.time)
  const appointmentToday = isToday(appointment.date)
  const timeUntil = getTimeUntilAppointment()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">예약 상세</h1>
              <p className="text-gray-600 mt-1">예약 정보를 확인하고 관리하세요</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onEdit}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              수정
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              삭제
            </button>
          </div>
        </div>
      </div>

      {/* 상태 및 시간 정보 */}
      <div className={`rounded-xl shadow-lg p-6 text-white mb-8 ${
        appointmentToday ? 'bg-gradient-to-r from-blue-500 to-purple-600' :
        appointmentPast ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
        'bg-gradient-to-r from-green-500 to-blue-600'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getStatusIcon(appointment.status)}
            <div>
              <h2 className="text-2xl font-bold">{getStatusText(appointment.status)}</h2>
              <p className="text-blue-100">
                {appointmentToday ? '오늘 예약' : appointmentPast ? '지난 예약' : timeUntil}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-bold">{formatTime(appointment.time)}</p>
            <p className="text-blue-100">{appointment.duration}분</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 메인 정보 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 환자 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">환자 정보</h3>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">
                  {appointment.customerName.charAt(0)}
                </span>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{appointment.customerName}</h4>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <a href={`tel:${appointment.customerPhone}`} className="hover:text-blue-600 transition-colors">
                      {appointment.customerPhone}
                    </a>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">ID: {appointment.customerId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 예약 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Calendar className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">예약 정보</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                <div className="flex items-center text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {formatDate(appointment.date)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시간</label>
                <div className="flex items-center text-gray-900">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  {formatTime(appointment.time)} ({appointment.duration}분)
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">예약 유형</label>
                <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                  {getTypeText(appointment.type)}
                </span>
              </div>


            </div>
          </div>

          {/* 메모 */}
          {appointment.notes && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">메모</h3>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* 사이드바 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 상태 관리 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">상태 관리</h3>
            
            <div className={`p-4 rounded-lg border mb-4 ${getStatusColor(appointment.status)}`}>
              <div className="flex items-center space-x-2">
                {getStatusIcon(appointment.status)}
                <span className="font-medium">{getStatusText(appointment.status)}</span>
              </div>
            </div>

            {/* 상태 변경 버튼들 */}
            <div className="space-y-2">
              {appointment.status === 'scheduled' && (
                <>
                  <button
                    onClick={() => onUpdateStatus('confirmed')}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    예약 확정
                  </button>
                  <button
                    onClick={() => onUpdateStatus('cancelled')}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    예약 취소
                  </button>
                </>
              )}
              
              {appointment.status === 'confirmed' && !appointmentPast && (
                <button
                  onClick={() => onUpdateStatus('completed')}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  완료 처리
                </button>
              )}
              
              {appointment.status === 'confirmed' && appointmentPast && (
                <button
                  onClick={() => onUpdateStatus('no_show')}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  노쇼 처리
                </button>
              )}
            </div>
          </div>

          {/* 알림 관리 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Bell className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">알림 관리</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">SMS 알림</span>
                <span className="text-sm text-gray-500">
                  미발송
                </span>
              </div>
              
              {appointment.status !== 'cancelled' && (
                <button
                  onClick={onSendReminder}
                  className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  알림 발송
                </button>
              )}
            </div>
          </div>

          {/* 예약 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">예약 정보</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">등록일</span>
                <span className="text-gray-900">
                  {new Date(appointment.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">수정일</span>
                <span className="text-gray-900">
                  {new Date(appointment.updatedAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">예약 ID</span>
                <span className="text-gray-900 font-mono text-xs">{appointment.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">예약 삭제</h3>
                <p className="text-sm text-gray-600">이 작업은 되돌릴 수 없습니다</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              <strong>{appointment.customerName}</strong>님의 {formatDate(appointment.date)} {formatTime(appointment.time)} 예약을 삭제하시겠습니까?
            </p>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}