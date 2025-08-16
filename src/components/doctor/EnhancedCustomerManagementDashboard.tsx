/**
 * 의료진용 고객 관리 대시보드 (보안 강화 버전)
 * 역할 기반 가입 플로우와 완전 통합된 고객 관리 시스템
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Key,
  Activity,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  Bell,
  Settings,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Flag,
  Star,
  Archive,
  UserCheck,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/hooks/use-toast'
import CustomerDetailsModal from './CustomerDetailsModal'
import { customerManagementService, Customer, CustomerStatus, CustomerFlag } from '@/lib/customerManagementService'
import { realTimeMonitoringService } from '@/lib/realTimeMonitoringService'
import { notificationService } from '@/lib/notificationService'

// 고객 통계 인터페이스
interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  newCustomersToday: number
  newCustomersThisWeek: number
  flaggedCustomers: number
  recentSignups: number
  conversionRate: number
  averageEngagement: number
}

// 필터 옵션
interface FilterOptions {
  status: CustomerStatus | 'all'
  flag: CustomerFlag | 'all'
  signupMethod: 'invite_code' | 'direct' | 'all'
  dateRange: '7d' | '30d' | '90d' | 'all'
  searchTerm: string
}// 통계 카드 컴
포넌트
const StatCard: React.FC<{
  title: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  color: string
  onClick?: () => void
}> = ({ title, value, change, changeType, icon, color, onClick }) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase': return 'text-green-600'
      case 'decrease': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase': return '↗'
      case 'decrease': return '↘'
      default: return '→'
    }
  }

  return (
    <Card 
      className={`${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-all duration-200`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {change && (
              <p className={`text-sm mt-1 flex items-center ${getChangeColor()}`}>
                <span className="mr-1">{getChangeIcon()}</span>
                {change}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}// 
고객 행 컴포넌트
const CustomerRow: React.FC<{
  customer: Customer
  onView: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  onFlag: (customer: Customer, flag: CustomerFlag) => void
  onStatusChange: (customer: Customer, status: CustomerStatus) => void
}> = ({ customer, onView, onEdit, onDelete, onFlag, onStatusChange }) => {
  const [showActions, setShowActions] = useState(false)

  const getStatusColor = (status: CustomerStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFlagColor = (flag: CustomerFlag) => {
    switch (flag) {
      case 'vip': return 'bg-purple-100 text-purple-800'
      case 'priority': return 'bg-blue-100 text-blue-800'
      case 'attention': return 'bg-orange-100 text-orange-800'
      case 'blocked': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFlagIcon = (flag: CustomerFlag) => {
    switch (flag) {
      case 'vip': return <Star className="w-3 h-3" />
      case 'priority': return <Flag className="w-3 h-3" />
      case 'attention': return <AlertTriangle className="w-3 h-3" />
      case 'blocked': return <Shield className="w-3 h-3" />
      default: return null
    }
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {customer.name}
            </div>
            <div className="text-sm text-gray-500">
              {customer.email}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(customer.status)}>
            {customer.status}
          </Badge>
          {customer.flag && customer.flag !== 'none' && (
            <Badge className={`${getFlagColor(customer.flag)} flex items-center space-x-1`}>
              {getFlagIcon(customer.flag)}
              <span>{customer.flag}</span>
            </Badge>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4" />
          <span>{customer.phoneNumber || 'N/A'}</span>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <Key className="w-4 h-4" />
          <span className="font-mono text-xs">
            {customer.inviteCodeId ? customer.inviteCodeId.slice(0, 8) + '...' : 'Direct'}
          </span>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span>{customer.createdAt.toLocaleDateString('ko-KR')}</span>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4" />
          <span>{customer.lastActiveAt?.toLocaleDateString('ko-KR') || 'Never'}</span>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActions(!showActions)}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          
          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
              <div className="py-1">
                <button
                  onClick={() => {
                    onView(customer)
                    setShowActions(false)
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  상세 보기
                </button>
                <button
                  onClick={() => {
                    onEdit(customer)
                    setShowActions(false)
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  편집
                </button>
                
                {/* 상태 변경 서브메뉴 */}
                <div className="border-t border-gray-100">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    상태 변경
                  </div>
                  {(['active', 'inactive', 'suspended', 'pending'] as CustomerStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        onStatusChange(customer, status)
                        setShowActions(false)
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(status).replace('text-', 'bg-').replace('100', '500')}`} />
                      {status}
                    </button>
                  ))}
                </div>
                
                {/* 플래그 서브메뉴 */}
                <div className="border-t border-gray-100">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    플래그 설정
                  </div>
                  {(['none', 'vip', 'priority', 'attention', 'blocked'] as CustomerFlag[]).map((flag) => (
                    <button
                      key={flag}
                      onClick={() => {
                        onFlag(customer, flag)
                        setShowActions(false)
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      {getFlagIcon(flag) || <div className="w-3 h-3 mr-1" />}
                      <span className="ml-1">{flag}</span>
                    </button>
                  ))}
                </div>
                
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => {
                      onDelete(customer)
                      setShowActions(false)
                    }}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}//
 메인 대시보드 컴포넌트
const EnhancedCustomerManagementDashboard: React.FC<{
  className?: string
}> = ({ className = '' }) => {
  const { toast } = useToast()
  
  // 상태 관리
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomersToday: 0,
    newCustomersThisWeek: 0,
    flaggedCustomers: 0,
    recentSignups: 0,
    conversionRate: 0,
    averageEngagement: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    flag: 'all',
    signupMethod: 'all',
    dateRange: '30d',
    searchTerm: ''
  })
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'lastActiveAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // 데이터 로드
  const loadCustomers = useCallback(async () => {
    try {
      setError(null)
      const result = await customerManagementService.getCustomers({
        page: currentPage,
        limit: 20,
        status: filters.status === 'all' ? undefined : filters.status,
        flag: filters.flag === 'all' ? undefined : filters.flag,
        search: filters.searchTerm || undefined,
        sortBy,
        sortOrder
      })

      if (result.success) {
        setCustomers(result.customers || [])
        setTotalPages(Math.ceil((result.total || 0) / 20))
      } else {
        setError(result.error || '고객 목록을 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('고객 목록을 불러오는데 실패했습니다.')
      console.error('Failed to load customers:', err)
    }
  }, [currentPage, filters, sortBy, sortOrder])

  const loadStats = useCallback(async () => {
    try {
      const result = await customerManagementService.getCustomerStats()
      if (result.success && result.stats) {
        setStats(result.stats)
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([loadCustomers(), loadStats()])
      setIsLoading(false)
      setLastRefresh(new Date())
    }
    loadData()
  }, [loadCustomers, loadStats])

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadCustomers()
      loadStats()
      setLastRefresh(new Date())
    }, 30000) // 30초마다

    return () => clearInterval(interval)
  }, [autoRefresh, loadCustomers, loadStats])

  // 실시간 이벤트 리스너
  useEffect(() => {
    const unsubscribe = realTimeMonitoringService.onEvent('signup', (event) => {
      // 새 고객 가입 시 데이터 새로고침
      loadCustomers()
      loadStats()
      
      toast({
        title: "새 고객 가입",
        description: "새로운 고객이 가입했습니다.",
      })
    })

    return unsubscribe
  }, [loadCustomers, loadStats, toast])  // 고객 상
세 보기
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowCustomerModal(true)
  }

  // 고객 편집
  const handleEditCustomer = async (customer: Customer) => {
    // 편집 모달 또는 페이지로 이동
    toast({
      title: "편집 기능",
      description: "고객 편집 기능을 준비 중입니다.",
    })
  }

  // 고객 삭제
  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`정말로 ${customer.name} 고객을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const result = await customerManagementService.deleteCustomer(customer.id)
      if (result.success) {
        toast({
          title: "고객 삭제 완료",
          description: `${customer.name} 고객이 삭제되었습니다.`,
        })
        loadCustomers()
        loadStats()
      } else {
        toast({
          title: "삭제 실패",
          description: result.error || '고객 삭제에 실패했습니다.',
          variant: "destructive"
        })
      }
    } catch (err) {
      toast({
        title: "오류",
        description: "고객 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  // 고객 플래그 설정
  const handleFlagCustomer = async (customer: Customer, flag: CustomerFlag) => {
    try {
      const result = await customerManagementService.updateCustomerFlag(customer.id, flag)
      if (result.success) {
        toast({
          title: "플래그 업데이트",
          description: `${customer.name} 고객의 플래그가 ${flag}로 설정되었습니다.`,
        })
        loadCustomers()
      } else {
        toast({
          title: "업데이트 실패",
          description: result.error || '플래그 업데이트에 실패했습니다.',
          variant: "destructive"
        })
      }
    } catch (err) {
      toast({
        title: "오류",
        description: "플래그 업데이트 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  // 고객 상태 변경
  const handleStatusChange = async (customer: Customer, status: CustomerStatus) => {
    try {
      const result = await customerManagementService.updateCustomerStatus(customer.id, status)
      if (result.success) {
        toast({
          title: "상태 업데이트",
          description: `${customer.name} 고객의 상태가 ${status}로 변경되었습니다.`,
        })
        loadCustomers()
      } else {
        toast({
          title: "업데이트 실패",
          description: result.error || '상태 업데이트에 실패했습니다.',
          variant: "destructive"
        })
      }
    } catch (err) {
      toast({
        title: "오류",
        description: "상태 업데이트 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  // 필터 변경
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // 필터 변경 시 첫 페이지로
  }

  // 검색
  const handleSearch = (searchTerm: string) => {
    handleFilterChange('searchTerm', searchTerm)
  }

  // 수동 새로고침
  const handleRefresh = () => {
    setIsLoading(true)
    Promise.all([loadCustomers(), loadStats()]).finally(() => {
      setIsLoading(false)
      setLastRefresh(new Date())
    })
  }

  // 데이터 내보내기
  const handleExport = async () => {
    try {
      const result = await customerManagementService.exportCustomers(filters)
      if (result.success && result.data) {
        // CSV 다운로드 로직
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "내보내기 완료",
          description: "고객 데이터가 성공적으로 내보내졌습니다.",
        })
      }
    } catch (err) {
      toast({
        title: "내보내기 실패",
        description: "데이터 내보내기 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  } 
 if (isLoading && customers.length === 0) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-500">고객 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">고객 관리</h1>
          <p className="text-gray-600 mt-1">
            가입 코드를 통해 등록된 고객들을 관리하고 모니터링합니다.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            마지막 업데이트: {lastRefresh.toLocaleTimeString('ko-KR')}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap className="w-4 h-4 mr-2" />
            자동 새로고침
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900">오류 발생</h4>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="전체 고객"
          value={stats.totalCustomers}
          change={`활성: ${stats.activeCustomers}`}
          changeType="neutral"
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        
        <StatCard
          title="오늘 신규 가입"
          value={stats.newCustomersToday}
          change={`이번 주: ${stats.newCustomersThisWeek}`}
          changeType="increase"
          icon={<UserPlus className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        
        <StatCard
          title="플래그된 고객"
          value={stats.flaggedCustomers}
          change={`전체의 ${((stats.flaggedCustomers / stats.totalCustomers) * 100).toFixed(1)}%`}
          changeType={stats.flaggedCustomers > 0 ? 'decrease' : 'neutral'}
          icon={<Flag className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
        
        <StatCard
          title="전환율"
          value={`${stats.conversionRate.toFixed(1)}%`}
          change={`평균 참여도: ${stats.averageEngagement.toFixed(1)}%`}
          changeType="increase"
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
      </div>      {/
* 검색 및 필터 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* 검색 */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="고객명, 이메일, 전화번호로 검색..."
                  value={filters.searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 필터 토글 */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>필터</span>
              {Object.values(filters).some(v => v !== 'all' && v !== '') && (
                <Badge variant="secondary" className="ml-2">활성</Badge>
              )}
            </Button>
          </div>

          {/* 필터 옵션 */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">모든 상태</option>
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                    <option value="suspended">정지</option>
                    <option value="pending">대기</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    플래그
                  </label>
                  <select
                    value={filters.flag}
                    onChange={(e) => handleFilterChange('flag', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">모든 플래그</option>
                    <option value="none">플래그 없음</option>
                    <option value="vip">VIP</option>
                    <option value="priority">우선순위</option>
                    <option value="attention">주의</option>
                    <option value="blocked">차단</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    가입 방식
                  </label>
                  <select
                    value={filters.signupMethod}
                    onChange={(e) => handleFilterChange('signupMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">모든 방식</option>
                    <option value="invite_code">가입 코드</option>
                    <option value="direct">직접 가입</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    기간
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="7d">최근 7일</option>
                    <option value="30d">최근 30일</option>
                    <option value="90d">최근 90일</option>
                    <option value="all">전체 기간</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>      
{/* 고객 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>고객 목록</CardTitle>
          <CardDescription>
            총 {customers.length}명의 고객 (페이지 {currentPage} / {totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">등록된 고객이 없습니다.</p>
              <p className="text-sm text-gray-400">
                가입 코드를 생성하여 고객을 초대해보세요.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      고객 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      연락처
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가입 코드
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가입일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      최근 활동
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <CustomerRow
                      key={customer.id}
                      customer={customer}
                      onView={handleViewCustomer}
                      onEdit={handleEditCustomer}
                      onDelete={handleDeleteCustomer}
                      onFlag={handleFlagCustomer}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                페이지 {currentPage} / {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 고객 상세 모달 */}
      {showCustomerModal && selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          isOpen={showCustomerModal}
          onClose={() => {
            setShowCustomerModal(false)
            setSelectedCustomer(null)
          }}
          onUpdate={() => {
            loadCustomers()
            loadStats()
          }}
        />
      )}
    </div>
  )
}

export default EnhancedCustomerManagementDashboard