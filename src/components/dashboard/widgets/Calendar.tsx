'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Clock, User, MapPin } from 'lucide-react'
import AsyncButton from '@/components/ui/AsyncButton'

interface Appointment {
  id: number
  date: string
  time: string
  patient: string
  type: string
  status: 'scheduled' | 'completed' | 'cancelled'
  location?: string
  notes?: string
}

export default function Calendar() {
  const router = useRouter()
  // useDensity 임시 제거 (DensityProvider 오류 방지)
  // const { density, getDensityClass } = useDensity()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  // TODO: Fetch real appointments from API
  const appointments: Appointment[] = [
    {
      id: 1,
      date: '2024-01-15',
      time: '10:00',
      patient: '김철수',
      type: '상담',
      status: 'scheduled',
      location: '1층 상담실',
      notes: '초기 상담'
    },
    {
      id: 2,
      date: '2024-01-15',
      time: '14:00',
      patient: '이영희',
      type: '체중측정',
      status: 'completed',
      location: '2층 측정실'
    },
    {
      id: 3,
      date: '2024-01-16',
      time: '11:00',
      patient: '박민수',
      type: '식단상담',
      status: 'scheduled',
      location: '1층 상담실',
      notes: '식단 조정 필요'
    },
    {
      id: 4,
      date: '2024-01-16',
      time: '15:30',
      patient: '정수진',
      type: '진료',
      status: 'scheduled',
      location: '진료실'
    },
  ]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (number | null)[] = []

    // Previous month's days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
  }

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return appointments.filter(apt => apt.date === dateStr)
  }

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0]
    return appointments.filter(apt => apt.date === today)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료'
      case 'cancelled':
        return '취소'
      default:
        return '예정'
    }
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']
  const todayAppointments = getTodayAppointments()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2" />
          일정
        </h2>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-medium text-gray-900 text-sm min-w-[100px] text-center">
            {formatDate(currentDate)}
          </span>

          <button
            onClick={() => navigateMonth('next')}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <AsyncButton
            onClick={async () => {
              router.push('/dashboard/doctor/appointments')
            }}
            className="ml-2 px-2.5 py-1.5 text-xs"
            variant="primary"
            size="sm"
            timeout={5000}
            preventDoubleClick={true}
            showErrorInline={false}
          >
            <Plus className="w-3 h-3 mr-1" />
            예약
          </AsyncButton>
        </div>
      </div>

      {/* 미니 캘린더 그리드 */}
      <div className="mb-4">
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {weekDays.map(day => (
            <div key={day} className="p-1 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, index) => {
            const dayAppointments = day ? getAppointmentsForDay(day) : []
            const isSelected = selectedDate === day
            const isTodayDate = day ? isToday(day) : false

            return (
              <div
                key={index}
                onClick={() => day && setSelectedDate(isSelected ? null : day)}
                className={`
                  p-1.5 text-center text-xs h-8 flex items-center justify-center relative cursor-pointer transition-all rounded-sm
                  ${day ? 'hover:bg-gray-100' : ''}
                  ${isSelected ? 'bg-blue-100 border border-blue-300' : ''}
                  ${isTodayDate ? 'bg-blue-600 text-white font-semibold' : ''}
                  ${!day ? 'text-gray-300 cursor-default' : 'text-gray-700'}
                `}
              >
                <span>{day}</span>
                {day && dayAppointments.length > 0 && !isTodayDate && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 오늘의 예약 - 간소화된 버전 */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">오늘 예약</h3>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {todayAppointments.length}건
          </span>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-xs text-gray-500">예약이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {todayAppointments.slice(0, 3).map(apt => (
              <div key={apt.id} className="flex items-center justify-between bg-gray-50 rounded-md hover:bg-gray-100 transition-colors p-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${apt.status === 'completed' ? 'bg-green-500' :
                        apt.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-medium text-gray-900">{apt.time}</span>
                      <span className="text-xs text-gray-600 truncate">{apt.patient}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{apt.type}</p>
                  </div>
                </div>
              </div>
            ))}
            {todayAppointments.length > 3 && (
              <div className="text-center">
                <AsyncButton
                  onClick={async () => {
                    router.push('/dashboard/doctor/appointments')
                  }}
                  className="text-xs"
                  variant="ghost"
                  size="sm"
                  timeout={5000}
                  preventDoubleClick={true}
                  showErrorInline={false}
                >
                  +{todayAppointments.length - 3}개 더 보기
                </AsyncButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}