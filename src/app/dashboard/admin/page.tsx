'use client'
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Users, Building, BarChart3, AlertTriangle, CheckCircle, Clock, DollarSign, Activity, RefreshCw, CreditCard } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/hooks/use-toast'
import UserManagementModal from '@/components/admin/UserManagementModal'
import HospitalManagementModal from '@/components/admin/HospitalManagementModal'
import AnalyticsModal from '@/components/admin/AnalyticsModal'
import SubscriptionManagementModal from '@/components/admin/SubscriptionManagementModal'
import ApiTestPanel from '@/components/admin/ApiTestPanel'

// 타입 정의
interface PendingApproval {
  id: string
  hospital_name: string
  owner_name: string
  email: string
  hospital_type: string
  subscription_plan: string
  created_at: string
}

interface AdminStats {
  total_hospitals: number
  total_users: number
  monthly_revenue: number
  active_sessions: number
  pending_approvals: number
  recent_activity: number
}

interface ActivityLog {
  id: string
  action: string
  description: string
  admin_email: string
  created_at: string
  time_ago: string
  metadata?: any
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // 모달 상태
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [hospitalModalOpen, setHospitalModalOpen] = useState(false)
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false)
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false)
  const [stats, setStats] = useState<AdminStats>({
    total_hospitals: 0,
    total_users: 0,
    monthly_revenue: 0,
    active_sessions: 0,
    pending_approvals: 0,
    recent_activity: 0
  })
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])

  // 데이터 로딩 함수들
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats/overview')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      } else {
        console.error('통계 데이터 로딩 실패:', result.error)
      }
    } catch (error) {
      console.error('통계 데이터 로딩 오류:', error)
    }
  }

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/admin/approvals/pending')
      const result = await response.json()
      
      if (result.success) {
        setPendingApprovals(result.data)
      } else {
        console.error('승인 대기 목록 로딩 실패:', result.error)
      }
    } catch (error) {
      console.error('승인 대기 목록 로딩 오류:', error)
    }
  }

  const fetchActivityLogs = async () => {
    try {
      const response = await fetch('/api/admin/activity-logs?limit=5')
      const result = await response.json()
      
      if (result.success) {
        setActivityLogs(result.data)
      } else {
        console.error('활동 로그 로딩 실패:', result.error)
      }
    } catch (error) {
      console.error('활동 로그 로딩 오류:', error)
    }
  }

  // 전체 데이터 새로고침
  const refreshAllData = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        fetchStats(),
        fetchPendingApprovals(),
        fetchActivityLogs()
      ])
    } catch (error) {
      console.error('데이터 새로고침 오류:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // 컴포넌트 마운트 시 데이터 로딩
  useEffect(() => {
    refreshAllData()
  }, [])

  const handleApproval = async (approval: PendingApproval, action: 'approve' | 'reject') => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/approvals/${approval.id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: action === 'approve' ? '승인 완료' : '거절 완료',
          description: result.message
        })
        
        // 데이터 새로고침
        await Promise.all([
          fetchPendingApprovals(),
          fetchStats(),
          fetchActivityLogs()
        ])
      } else {
        throw new Error(result.error || '처리 중 오류가 발생했습니다')
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'users':
        setUserModalOpen(true)
        break
      case 'hospitals':
        setHospitalModalOpen(true)
        break
      case 'analytics':
        setAnalyticsModalOpen(true)
        break
      case 'subscriptions':
        setSubscriptionModalOpen(true)
        break
      default:
        toast({
          title: '준비 중',
          description: '해당 기능은 준비 중입니다.',
          variant: 'default'
        })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                관리자 대시보드
              </h1>
              <p className="text-gray-600 mt-2">
                Obdoc 서비스 전체 현황을 관리하세요.
              </p>
            </div>
            <Button
              onClick={refreshAllData}
              disabled={refreshing}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </Button>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">등록 병원</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_hospitals}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 사용자</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_users.toLocaleString()}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">월 매출</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₩{(stats.monthly_revenue / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">활성 세션</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_sessions}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Approvals */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">승인 대기</h2>
                  <Badge variant="destructive">{pendingApprovals.length}</Badge>
                </div>
              </div>
              <CardBody className="p-6">
                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-500">승인 대기 중인 병원이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApprovals.map((approval) => (
                      <div key={approval.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Building className="h-5 w-5 text-yellow-600 mr-2" />
                            <p className="font-medium text-gray-900">{approval.hospital_name}</p>
                            <Badge className="ml-2" variant="outline">
                              {approval.hospital_type === 'clinic' ? '일반의원' :
                               approval.hospital_type === 'korean_medicine' ? '한의원' : '병원'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            원장: {approval.owner_name} | 이메일: {approval.email} | {
                              approval.subscription_plan === '1month' ? '1개월 플랜' :
                              approval.subscription_plan === '6months' ? '6개월 플랜' :
                              approval.subscription_plan === '12months' ? '12개월 플랜' : approval.subscription_plan
                            }
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            신청일: {new Date(approval.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={loading}
                            onClick={() => handleApproval(approval, 'reject')}
                          >
                            거절
                          </Button>
                          <Button 
                            size="sm"
                            disabled={loading}
                            onClick={() => handleApproval(approval, 'approve')}
                          >
                            승인
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* System Status */}
            <Card className="mt-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">시스템 상태</h2>
              </div>
              <CardBody className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">API 서버</p>
                      <p className="text-sm text-green-600">정상 운영</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">데이터베이스</p>
                      <p className="text-sm text-green-600">정상 운영</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                    <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">백업 시스템</p>
                      <p className="text-sm text-yellow-600">진행 중</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Quick Actions & Alerts */}
          <div>
            {/* Quick Actions */}
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">빠른 작업</h2>
              </div>
              <CardBody className="p-6">
                <div className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('users')}
                  >
                    <Users className="h-4 w-4 mr-3" />
                    사용자 관리
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('hospitals')}
                  >
                    <Building className="h-4 w-4 mr-3" />
                    병원 관리
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('analytics')}
                  >
                    <BarChart3 className="h-4 w-4 mr-3" />
                    통계 분석
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('subscriptions')}
                  >
                    <CreditCard className="h-4 w-4 mr-3" />
                    구독 관리
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* System Alerts */}
            <Card className="mt-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">시스템 알림</h2>
                  <Badge variant="destructive">2</Badge>
                </div>
              </div>
              <CardBody className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        서버 응답 시간 증가
                      </p>
                      <p className="text-xs text-red-700">
                        평균 응답 시간이 500ms를 초과했습니다.
                      </p>
                      <p className="text-xs text-red-600 mt-1">5분 전</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">
                        정기 백업 진행 중
                      </p>
                      <p className="text-xs text-yellow-700">
                        데이터베이스 백업이 진행 중입니다.
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">15분 전</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Recent Activity */}
            <Card className="mt-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
              </div>
              <CardBody className="p-6">
                {activityLogs.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">최근 활동이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          log.action.includes('approve') ? 'bg-green-500' :
                          log.action.includes('subscription') ? 'bg-blue-500' :
                          log.action.includes('system') ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-500">{log.description}</p>
                          <p className="text-xs text-gray-400">{log.time_ago}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
        
        {/* API 테스트 패널 */}
        <ApiTestPanel />
      </div>

      {/* 모달들 */}
      <UserManagementModal 
        isOpen={userModalOpen} 
        onClose={() => setUserModalOpen(false)} 
      />
      <HospitalManagementModal 
        isOpen={hospitalModalOpen} 
        onClose={() => setHospitalModalOpen(false)} 
      />
      <AnalyticsModal 
        isOpen={analyticsModalOpen} 
        onClose={() => setAnalyticsModalOpen(false)} 
      />
      <SubscriptionManagementModal 
        isOpen={subscriptionModalOpen} 
        onClose={() => setSubscriptionModalOpen(false)} 
      />
    </div>
  )
}