'use client'

import React, { useState, useEffect } from 'react'
import { HospitalData, InviteCode } from '@/types/hospital'
import { getHospitalsByRegion, getHospitalStats } from '@/lib/hospitalCodeService'
import { getInviteCodeStats } from '@/lib/inviteCodeService'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/hooks/use-toast'

// LoadingSpinner 컴포넌트
const LoadingSpinner = ({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) => {
  const sizeClasses = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-6 h-6' }
  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg className="w-full h-full text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  )
}

// 통계 카드 컴포넌트
const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon,
  onClick 
}: { 
  title: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  onClick?: () => void
}) => {
  const changeColors = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-600'
  }

  return (
    <div 
      className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 flex items-center ${changeColors[changeType || 'neutral']}`}>
              {changeType === 'increase' && (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {changeType === 'decrease' && (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {change}
            </p>
          )}
        </div>
        <div className="text-blue-500">
          {icon}
        </div>
      </div>
    </div>
  )
}

// 알림 카드 컴포넌트
const AlertCard = ({ 
  type, 
  title, 
  message, 
  timestamp,
  onDismiss 
}: {
  type: 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: Date
  onDismiss?: () => void
}) => {
  const typeStyles = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const typeIcons = {
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <div className={`p-4 rounded-lg border ${typeStyles[type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {typeIcons[type]}
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm mt-1 opacity-90">{message}</p>
            <p className="text-xs mt-2 opacity-75">
              {timestamp.toLocaleString('ko-KR')}
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-4 opacity-60 hover:opacity-100 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

interface AdminHospitalManagerProps {
  className?: string
}

interface SystemStats {
  totalHospitals: number
  activeHospitals: number
  totalInviteCodes: number
  activeInviteCodes: number
  totalSignups: number
  recentSignups: number
  suspiciousActivity: number
}

interface SystemAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: Date
  hospitalCode?: string
  dismissed: boolean
}

export default function AdminHospitalManager({ className = '' }: AdminHospitalManagerProps) {
  const { toast } = useToast()
  
  // 상태 관리
  const [hospitals, setHospitals] = useState<HospitalData[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalHospitals: 0,
    activeHospitals: 0,
    totalInviteCodes: 0,
    activeInviteCodes: 0,
    totalSignups: 0,
    recentSignups: 0,
    suspiciousActivity: 0
  })
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([])
  const [selectedHospital, setSelectedHospital] = useState<HospitalData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showHospitalDetails, setShowHospitalDetails] = useState(false)
  const [hospitalStats, setHospitalStats] = useState<any>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadSystemData()
    loadSystemAlerts()
    
    // 실시간 업데이트를 위한 폴링 (실제로는 WebSocket 사용 권장)
    const interval = setInterval(() => {
      loadSystemStats()
      loadSystemAlerts()
    }, 30000) // 30초마다 업데이트

    return () => clearInterval(interval)
  }, [])

  // 필터 변경 시 병원 목록 다시 로드
  useEffect(() => {
    loadHospitals()
  }, [currentPage, filterRegion, filterType, searchTerm])

  // 시스템 전체 데이터 로드
  const loadSystemData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await Promise.all([
        loadSystemStats(),
        loadHospitals()
      ])
    } catch (error) {
      console.error('시스템 데이터 로드 실패:', error)
      setError('시스템 데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 시스템 통계 로드
  const loadSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/system/stats')
      const stats = await response.json()
      setSystemStats(stats)
    } catch (error) {
      console.error('시스템 통계 로드 실패:', error)
    }
  }

  // 병원 목록 로드
  const loadHospitals = async () => {
    try {
      const result = await getHospitalsByRegion(
        filterRegion || undefined,
        filterType || undefined,
        currentPage,
        20
      )

      if (result.success) {
        let filteredHospitals = result.hospitals || []
        
        // 검색어 필터링
        if (searchTerm) {
          filteredHospitals = filteredHospitals.filter(hospital =>
            hospital.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            hospital.hospitalCode.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        setHospitals(filteredHospitals)
        setTotalPages(Math.ceil((result.total || 0) / 20))
      } else {
        setError(result.error || '병원 목록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('병원 목록 로드 실패:', error)
      setError('병원 목록을 불러오는데 실패했습니다.')
    }
  }

  // 시스템 알림 로드
  const loadSystemAlerts = async () => {
    try {
      const response = await fetch('/api/admin/security/alerts')
      const alerts = await response.json()
      setSystemAlerts(alerts.filter((alert: SystemAlert) => !alert.dismissed))
    } catch (error) {
      console.error('시스템 알림 로드 실패:', error)
    }
  }

  // 병원 상세 정보 로드
  const loadHospitalDetails = async (hospital: HospitalData) => {
    setSelectedHospital(hospital)
    setIsLoadingStats(true)
    setShowHospitalDetails(true)

    try {
      const stats = await getHospitalStats(hospital.hospitalCode)
      setHospitalStats(stats)
    } catch (error) {
      console.error('병원 상세 정보 로드 실패:', error)
      toast({
        title: "오류",
        description: "병원 상세 정보를 불러오는데 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

  // 알림 해제
  const dismissAlert = async (alertId: string) => {
    try {
      await fetch(`/api/admin/security/alerts/${alertId}/dismiss`, {
        method: 'POST'
      })
      
      setSystemAlerts(prev => prev.filter(alert => alert.id !== alertId))
      
      toast({
        title: "알림 해제",
        description: "알림이 해제되었습니다."
      })
    } catch (error) {
      console.error('알림 해제 실패:', error)
      toast({
        title: "오류",
        description: "알림 해제에 실패했습니다.",
        variant: "destructive"
      })
    }
  }

  // 의심스러운 활동 감지
  const detectSuspiciousActivity = (hospital: HospitalData): boolean => {
    // 실제로는 더 복잡한 로직 구현
    // 예: 단시간 내 많은 가입 코드 생성, 비정상적인 사용 패턴 등
    return Math.random() > 0.9 // 임시로 10% 확률로 의심스러운 활동 표시
  }

  // 페이지네이션 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 검색 핸들러
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // 검색 시 첫 페이지로 이동
  }

  // 필터 핸들러
  const handleFilterChange = (type: 'region' | 'hospitalType', value: string) => {
    if (type === 'region') {
      setFilterRegion(value)
    } else {
      setFilterType(value)
    }
    setCurrentPage(1) // 필터 변경 시 첫 페이지로 이동
  }

  if (isLoading) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <LoadingSpinner size="md" />
          <p className="text-gray-500 mt-4">시스템 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">병원 및 가입 코드 관리</h1>
          <p className="text-gray-600 mt-1">
            시스템 전체 병원과 가입 코드를 모니터링하고 관리합니다.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadSystemData}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            disabled={isLoading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-red-900">시스템 오류</h4>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 시스템 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="전체 병원"
          value={systemStats.totalHospitals}
          change={`활성: ${systemStats.activeHospitals}`}
          changeType="neutral"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        
        <StatCard
          title="가입 코드"
          value={systemStats.totalInviteCodes}
          change={`활성: ${systemStats.activeInviteCodes}`}
          changeType="neutral"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          }
        />
        
        <StatCard
          title="총 가입자"
          value={systemStats.totalSignups}
          change={`최근: +${systemStats.recentSignups}`}
          changeType="increase"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
        />
        
        <StatCard
          title="의심스러운 활동"
          value={systemStats.suspiciousActivity}
          change={systemStats.suspiciousActivity > 0 ? "주의 필요" : "정상"}
          changeType={systemStats.suspiciousActivity > 0 ? "decrease" : "neutral"}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        />
      </div>

      {/* 시스템 알림 */}
      {systemAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">시스템 알림</h2>
          <div className="space-y-3">
            {systemAlerts.slice(0, 3).map((alert) => (
              <AlertCard
                key={alert.id}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                timestamp={alert.timestamp}
                onDismiss={() => dismissAlert(alert.id)}
              />
            ))}
          </div>
          {systemAlerts.length > 3 && (
            <div className="text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800 underline">
                모든 알림 보기 ({systemAlerts.length - 3}개 더)
              </button>
            </div>
          )}
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          {/* 검색 */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="병원명 또는 코드로 검색..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 필터 */}
          <div className="flex space-x-3">
            <select
              value={filterRegion}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">모든 지역</option>
              <option value="서울">서울</option>
              <option value="부산">부산</option>
              <option value="대구">대구</option>
              <option value="인천">인천</option>
              <option value="광주">광주</option>
              <option value="대전">대전</option>
              <option value="울산">울산</option>
              <option value="세종">세종</option>
              <option value="경기">경기</option>
              <option value="강원">강원</option>
              <option value="충북">충북</option>
              <option value="충남">충남</option>
              <option value="전북">전북</option>
              <option value="전남">전남</option>
              <option value="경북">경북</option>
              <option value="경남">경남</option>
              <option value="제주">제주</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => handleFilterChange('hospitalType', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">모든 유형</option>
              <option value="clinic">의원</option>
              <option value="oriental_clinic">한의원</option>
              <option value="hospital">병원</option>
            </select>
          </div>
        </div>
      </div>

      {/* 병원 목록 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">병원 목록</h2>
          <p className="text-sm text-gray-600 mt-1">
            총 {hospitals.length}개 병원 (페이지 {currentPage} / {totalPages})
          </p>
        </div>

        {hospitals.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-gray-500">등록된 병원이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {hospitals.map((hospital) => {
              const isSuspicious = detectSuspiciousActivity(hospital)
              
              return (
                <div key={hospital.hospitalCode} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {hospital.hospitalName}
                        </h3>
                        <Badge variant={hospital.isActive ? "default" : "secondary"}>
                          {hospital.isActive ? '활성' : '비활성'}
                        </Badge>
                        {isSuspicious && (
                          <Badge variant="destructive">
                            의심스러운 활동
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">병원 코드:</span>
                          <p className="font-mono">{hospital.hospitalCode}</p>
                        </div>
                        <div>
                          <span className="font-medium">유형:</span>
                          <p>{hospital.hospitalType === 'clinic' ? '의원' : 
                              hospital.hospitalType === 'oriental_clinic' ? '한의원' : '병원'}</p>
                        </div>
                        <div>
                          <span className="font-medium">지역:</span>
                          <p>{hospital.region}</p>
                        </div>
                        <div>
                          <span className="font-medium">주소:</span>
                          <p>{hospital.address || '정보 없음'}</p>
                        </div>
                        <div>
                          <span className="font-medium">전화번호:</span>
                          <p>{hospital.phoneNumber || '정보 없음'}</p>
                        </div>
                        <div>
                          <span className="font-medium">등록일:</span>
                          <p>{hospital.createdAt.toLocaleDateString('ko-KR')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => loadHospitalDetails(hospital)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        상세 보기
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                페이지 {currentPage} / {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 병원 상세 정보 모달 */}
      {showHospitalDetails && selectedHospital && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedHospital.hospitalName} 상세 정보
              </h3>
              <button
                onClick={() => setShowHospitalDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoadingStats ? (
              <div className="text-center py-8">
                <LoadingSpinner size="md" />
                <p className="text-gray-500 mt-2">상세 정보를 불러오는 중...</p>
              </div>
            ) : hospitalStats ? (
              <div className="space-y-6">
                {/* 병원 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">병원 코드:</span>
                    <p className="font-mono">{selectedHospital.hospitalCode}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">유형:</span>
                    <p>{selectedHospital.hospitalType === 'clinic' ? '의원' : 
                        selectedHospital.hospitalType === 'oriental_clinic' ? '한의원' : '병원'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">지역:</span>
                    <p>{selectedHospital.region}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">상태:</span>
                    <Badge variant={selectedHospital.isActive ? "default" : "secondary"}>
                      {selectedHospital.isActive ? '활성' : '비활성'}
                    </Badge>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">주소:</span>
                    <p>{selectedHospital.address || '정보 없음'}</p>
                  </div>
                </div>

                {/* 통계 정보 */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">통계 정보</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">총 고객</p>
                      <p className="text-2xl font-bold text-blue-900">{hospitalStats.totalCustomers}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">활성 고객</p>
                      <p className="text-2xl font-bold text-green-900">{hospitalStats.activeCustomers}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">가입 코드</p>
                      <p className="text-2xl font-bold text-purple-900">{hospitalStats.totalInviteCodes}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-600 font-medium">활성 코드</p>
                      <p className="text-2xl font-bold text-yellow-900">{hospitalStats.activeInviteCodes}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-sm text-indigo-600 font-medium">총 가입</p>
                      <p className="text-2xl font-bold text-indigo-900">{hospitalStats.totalSignups}</p>
                    </div>
                    <div className="bg-pink-50 p-4 rounded-lg">
                      <p className="text-sm text-pink-600 font-medium">최근 가입</p>
                      <p className="text-2xl font-bold text-pink-900">{hospitalStats.recentSignups}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">상세 정보를 불러올 수 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}