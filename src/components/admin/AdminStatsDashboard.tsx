'use client'
import React, { useState, useEffect } from 'react'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Calendar,
  MessageSquare,
  AlertTriangle,
  Building2,
  Filter,
  RefreshCw
} from 'lucide-react'
import { AdminStats, AdminFilters, RevenueData, UserActivityData, HospitalTypeStats } from '@/types/admin'
import { adminService } from '@/lib/adminService'
import StatCard from './widgets/StatCard'
import RevenueChart from './widgets/RevenueChart'
import HospitalTypeChart from './widgets/HospitalTypeChart'
import UserActivityChart from './widgets/UserActivityChart'
import ChartErrorBoundary from '../common/ChartErrorBoundary'
import SupabaseConnectionTest from './SupabaseConnectionTest'
import AuthenticationTest from './AuthenticationTest'
import RoleBasedAccessTest from './RoleBasedAccessTest'
import CRUDOperationTest from './CRUDOperationTest'

export default function AdminStatsDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [userActivityData, setUserActivityData] = useState<UserActivityData[]>([])
  const [hospitalTypeData, setHospitalTypeData] = useState<HospitalTypeStats[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<AdminFilters>({
    dateRange: 'month'
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadAllData()
  }, [filters])

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [
        statsData,
        revenueDataResult,
        userActivityResult,
        hospitalTypeResult
      ] = await Promise.all([
        adminService.getAdminStats(filters),
        adminService.getRevenueData(filters),
        adminService.getUserActivityData(filters),
        adminService.getHospitalTypeStats(filters)
      ])

      setStats(statsData)
      setRevenueData(revenueDataResult)
      setUserActivityData(userActivityResult)
      setHospitalTypeData(hospitalTypeResult)
    } catch (error) {
      console.error('관리자 통계 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadAllData()
  }

  const handleFilterChange = (newFilters: Partial<AdminFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">통계 대시보드</h2>
          <p className="text-gray-600 mt-1">서비스 전체 현황과 주요 지표를 확인하세요</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>필터</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">기간</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange({ dateRange: e.target.value as AdminFilters['dateRange'] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">오늘</option>
                <option value="week">이번 주</option>
                <option value="month">이번 달</option>
                <option value="3months">최근 3개월</option>
                <option value="6months">최근 6개월</option>
                <option value="year">올해</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">병원 유형</label>
              <select
                value={filters.hospitalType || ''}
                onChange={(e) => handleFilterChange({ hospitalType: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="종합병원">종합병원</option>
                <option value="내과">내과</option>
                <option value="가정의학과">가정의학과</option>
                <option value="비만클리닉">비만클리닉</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">구독 상태</label>
              <select
                value={filters.subscriptionStatus || 'all'}
                onChange={(e) => handleFilterChange({ subscriptionStatus: e.target.value as AdminFilters['subscriptionStatus'] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="active">활성</option>
                <option value="pending">대기</option>
                <option value="expired">만료</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="총 사용자"
          value={stats?.totalUsers || 0}
          change={{ value: 12.5, type: 'increase', period: '지난 달 대비' }}
          icon={Users}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="활성 구독"
          value={stats?.activeSubscriptions || 0}
          change={{ value: 8.3, type: 'increase', period: '지난 달 대비' }}
          icon={TrendingUp}
          color="green"
          loading={loading}
        />
        <StatCard
          title="월 매출"
          value={stats ? `${(stats.monthlyRevenue / 1000000).toFixed(1)}M원` : '0원'}
          change={{ value: 15.7, type: 'increase', period: '지난 달 대비' }}
          icon={DollarSign}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="신고 대기"
          value={stats?.reportedContent || 0}
          change={{ value: 5.2, type: 'decrease', period: '지난 주 대비' }}
          icon={AlertTriangle}
          color="red"
          loading={loading}
        />
      </div>

      {/* 상세 통계 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 수익 차트 */}
        <ChartErrorBoundary>
          <RevenueChart data={revenueData} loading={loading} />
        </ChartErrorBoundary>
        
        {/* 병원 유형별 차트 */}
        <ChartErrorBoundary>
          <HospitalTypeChart data={hospitalTypeData} loading={loading} />
        </ChartErrorBoundary>
      </div>

      {/* 사용자 활동 차트 */}
      <ChartErrorBoundary>
        <UserActivityChart data={userActivityData} loading={loading} />
      </ChartErrorBoundary>

      {/* 추가 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="총 게시글"
          value={stats?.totalPosts || 0}
          icon={MessageSquare}
          color="indigo"
          loading={loading}
        />
        <StatCard
          title="총 댓글"
          value={stats?.totalComments || 0}
          icon={MessageSquare}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="완료된 예약"
          value={stats?.completedAppointments || 0}
          icon={Calendar}
          color="green"
          loading={loading}
        />
        <StatCard
          title="등록 병원"
          value={stats?.totalDoctors || 0}
          icon={Building2}
          color="yellow"
          loading={loading}
        />
      </div>

      {/* Supabase 연결 상태 및 테스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SupabaseConnectionTest />
        <AuthenticationTest />
      </div>
      
      {/* 역할별 접근 권한 테스트 */}
      <RoleBasedAccessTest />
      
      {/* CRUD 작업 테스트 */}
      <CRUDOperationTest />

      {/* 시스템 상태 */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">시스템 상태</h3>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                stats.systemHealth === 'healthy' ? 'bg-green-500' :
                stats.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-700">
                {stats.systemHealth === 'healthy' ? '정상' :
                 stats.systemHealth === 'warning' ? '주의' : '위험'}
              </span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            마지막 업데이트: {new Date(stats.lastUpdated).toLocaleString('ko-KR')}
          </div>
        </div>
      )}
    </div>
  )
}