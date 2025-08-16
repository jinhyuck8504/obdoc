'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardNavigationItems, UserRole } from '@/lib/roleUtils'
import TodayTasks from './widgets/TodayTasks'
import CustomerStatus from './widgets/CustomerStatus'
import Calendar from './widgets/Calendar'
import QuickSearch from './widgets/QuickSearch'
import RecentActivity from './widgets/RecentActivity'
import DataSyncTest from './widgets/DataSyncTest'
import BackButton from '@/components/common/BackButton'
import { SafeTimeDisplay } from '@/components/hydration'
import ClientOnly from '@/components/common/ClientOnly'
import { Clock, Users, Calendar as CalendarIcon, TrendingUp, MessageCircle } from 'lucide-react'

export default function DoctorDashboard() {
  const { user } = useAuth()
  
  // 기본 사용자 정보 (서버와 클라이언트에서 동일)
  const defaultUser = {
    name: '김의사',
    email: 'doctor@example.com',
    role: 'doctor' as const
  }
  
  const displayUser = user || defaultUser

  // 간단한 통계 데이터 (실제로는 API에서 가져와야 함)
  const quickStats = {
    todayTasks: 5,
    totalCustomers: 45,
    todayAppointments: 8,
    monthlyProgress: 85
  }

  // 대시보드 내부 네비게이션 메뉴 (헤더와 중복되지 않는 전용 기능만)
  const dashboardNavItems = getDashboardNavigationItems('doctor' as UserRole)
  
  // 아이콘 매핑
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    Users,
    Calendar: CalendarIcon,
    MessageCircle
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
      <BackButton fallbackPath="/" className="mb-2" />
      {/* 대시보드 내부 네비게이션 */}
      <div className="mb-4">
        <nav className="flex space-x-8 border-b border-gray-200">
          {dashboardNavItems.map((item) => {
            const IconComponent = iconMap[item.icon] || Users
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-1 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300"
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* 헤더 섹션 */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              안녕하세요, {displayUser?.name || '원장'}님! 👋
            </h1>
            <div suppressHydrationWarning>
              <SafeTimeDisplay 
                format="datetime" 
                className="text-gray-600 mt-1"
              />
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                시스템 정상
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">오늘 할 일</p>
              <p className="text-3xl font-bold">{quickStats.todayTasks}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">총 고객</p>
              <p className="text-3xl font-bold">{quickStats.totalCustomers}</p>
            </div>
            <Users className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">오늘 예약</p>
              <p className="text-3xl font-bold">{quickStats.todayAppointments}</p>
            </div>
            <CalendarIcon className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">월간 진행률</p>
              <p className="text-3xl font-bold">{quickStats.monthlyProgress}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* 메인 위젯 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽 컬럼 */}
        <div className="lg:col-span-1 space-y-6">
          <TodayTasks />
          <QuickSearch />
        </div>

        {/* 가운데 컬럼 */}
        <div className="lg:col-span-1">
          <CustomerStatus />
        </div>

        {/* 오른쪽 컬럼 - 캘린더와 최근 활동 */}
        <div className="lg:col-span-1 space-y-4">
          <Calendar />
          <RecentActivity />
          {/* 개발 중에만 표시되는 동기화 테스트 컴포넌트 */}
          {process.env.NODE_ENV === 'development' && <DataSyncTest />}
        </div>
      </div>
      </div>
    </div>
  )
}