'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Save, X, Calendar, User, FileText, AlertCircle } from 'lucide-react'
import { Appointment, AppointmentFormData, TimeSlot } from '@/types/appointment'
import { Customer } from '@/types/customer'
import { customerService } from '@/lib/customerService'

interface AppointmentFormProps {
  appointment?: Appointment | null
  onSave: (data: AppointmentFormData) => void
  onCancel: () => void
}

export default function AppointmentForm({ appointment, onSave, onCancel }: AppointmentFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customerService.getCustomers()
        setCustomers(data)
      } catch (error) {
        console.error('고객 목록 조회 실패:', error)
      }
    }
    fetchCustomers()
  }, [])

  const [formData, setFormData] = useState<AppointmentFormData>({
    customerId: '',
    date: '',
    time: '',
    duration: 30,
    type: 'consultation',
    notes: '',
    symptoms: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (appointment) {
      setFormData({
        customerId: appointment.customerId,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        type: appointment.type,
        notes: appointment.notes || '',
        symptoms: appointment.symptoms || ''
      })
    }
  }, [appointment])

  // 날짜 변경 시 사용 가능한 시간대 생성
  useEffect(() => {
    if (formData.date) {
      generateTimeSlots(formData.date)
    }
  }, [formData.date, appointment])

  const generateTimeSlots = (selectedDate: string) => {
    const slots: TimeSlot[] = []
    const startHour = 9
    const endHour = 18
    const interval = 30 // 30분 간격

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        
        // TODO: 실제로는 기존 예약과 비교해서 available 결정
        const isAvailable = Math.random() > 0.3 // 임시로 랜덤하게 설정
        const isCurrentAppointmentTime = Boolean(appointment?.time === timeString)
        
        slots.push({
          time: timeString,
          available: isAvailable || isCurrentAppointmentTime
        })
      }
    }

    setAvailableSlots(slots)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerId) {
      newErrors.customerId = '환자를 선택해주세요'
    }

    if (!formData.date) {
      newErrors.date = '날짜를 선택해주세요'
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        newErrors.date = '과거 날짜는 선택할 수 없습니다'
      }
    }

    if (!formData.time) {
      newErrors.time = '시간을 선택해주세요'
    }

    if (formData.duration < 15 || formData.duration > 120) {
      newErrors.duration = '예약 시간은 15분에서 120분 사이여야 합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSave(formData)
    } catch (error) {
      console.error('예약 저장 중 오류:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof AppointmentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 에러 메시지 제거
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const getAppointmentTypeText = (type: string) => {
    switch (type) {
      case 'initial':
        return '초기 상담'
      case 'consultation':
        return '일반 상담'
      case 'follow_up':
        return '추적 관찰'
      case 'emergency':
        return '응급'
      default:
        return '일반 상담'
    }
  }

  const selectedCustomer = customers.find((customer: Customer) => customer.id === formData.customerId)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {appointment ? '예약 수정' : '새 예약 등록'}
            </h1>
            <p className="text-gray-600 mt-1">
              {appointment ? '예약 정보를 수정하세요' : '새로운 예약을 등록하세요'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 환자 선택 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">환자 선택</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                환자 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => handleInputChange('customerId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.customerId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">환자를 선택하세요</option>
                {customers.map((customer: Customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.phone})
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
              )}
            </div>

            {selectedCustomer && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">선택된 환자 정보</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>이름:</strong> {selectedCustomer.name}</p>
                  <p><strong>전화번호:</strong> {selectedCustomer.phone}</p>
                  <p><strong>현재 체중:</strong> {selectedCustomer.currentWeight}kg</p>
                  <p><strong>상태:</strong> {selectedCustomer.status === 'active' ? '진행중' : '비활성'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 예약 일시 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Calendar className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">예약 일시</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                날짜 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시간 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.time ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!formData.date}
              >
                <option value="">시간을 선택하세요</option>
                {availableSlots.map(slot => (
                  <option 
                    key={slot.time} 
                    value={slot.time}
                    disabled={!slot.available}
                  >
                    {slot.time} {!slot.available && '(예약됨)'}
                  </option>
                ))}
              </select>
              {errors.time && (
                <p className="mt-1 text-sm text-red-600">{errors.time}</p>
              )}
              {!formData.date && (
                <p className="mt-1 text-sm text-gray-500">먼저 날짜를 선택해주세요</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                소요 시간 (분)
              </label>
              <select
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={15}>15분</option>
                <option value={30}>30분</option>
                <option value={45}>45분</option>
                <option value={60}>1시간</option>
                <option value={90}>1시간 30분</option>
                <option value={120}>2시간</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                예약 유형
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="initial">초기 상담</option>
                <option value="consultation">일반 상담</option>
                <option value="follow_up">추적 관찰</option>
                <option value="emergency">응급</option>
              </select>
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <FileText className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">추가 정보</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                증상 또는 상담 내용
              </label>
              <textarea
                value={formData.symptoms}
                onChange={(e) => handleInputChange('symptoms', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="환자의 증상이나 상담하고 싶은 내용을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메모
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예약에 대한 추가 메모를 입력하세요"
              />
            </div>
          </div>
        </div>

        {/* 예약 요약 */}
        {formData.customerId && formData.date && formData.time && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">예약 요약</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700"><strong>환자:</strong> {selectedCustomer?.name}</p>
                <p className="text-blue-700"><strong>전화번호:</strong> {selectedCustomer?.phone}</p>
              </div>
              <div>
                <p className="text-blue-700"><strong>날짜:</strong> {new Date(formData.date).toLocaleDateString('ko-KR')}</p>
                <p className="text-blue-700"><strong>시간:</strong> {formData.time} ({formData.duration}분)</p>
              </div>
              <div>
                <p className="text-blue-700"><strong>유형:</strong> {getAppointmentTypeText(formData.type)}</p>
                {formData.symptoms && (
                  <p className="text-blue-700"><strong>증상:</strong> {formData.symptoms}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4 inline mr-2" />
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? '저장 중...' : (appointment ? '수정하기' : '예약하기')}
          </button>
        </div>
      </form>
    </div>
  )
}