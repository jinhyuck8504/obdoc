'use client'
import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Users, Building, BarChart3, AlertTriangle, CheckCircle, Clock, DollarSign, Activity } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/hooks/use-toast'

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleApproval = async (hospitalName: string, action: 'approve' | 'reject') => {
    setLoading(true)
    try {
      // 실제 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: action === 'approve' ? '승인 완료' : '거절 완료',
        description: `${hospitalName}의 가입 신청이 ${action === 'approve' ? '승인' : '거절'}되었습니다.`
      })
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '처리 중 오류가 발생했습니다. 다시 시도해주세요.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'users':
        router.push('/dashboard/admin/users')
        break
      case 'hospitals':
        router.push('/dashboard/admin/hospitals')
        break
      case 'analytics':
        router.push('/dashboard/admin/analytics')
        break
      case 'subscriptions':
        router.push('/dashboard/admin/subscriptions')
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
          <h1 className="text-3xl font-bold text-gray-900">
            관리자 대시보드
          </h1>
          <p className="text-gray-600 mt-2">
            Obdoc 서비스 전체 현황을 관리하세요.
          </p>
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
                  <p className="text-2xl font-bold text-gray-900">47</p>
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
                  <p className="text-2xl font-bold text-gray-900">1,234</p>
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
                  <p className="text-2xl font-bold text-gray-900">₩9.4M</p>
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
                  <p className="text-2xl font-bold text-gray-900">89</p>
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
                  <Badge variant="destructive">3</Badge>
                </div>
              </div>
              <CardBody className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-yellow-600 mr-2" />
                        <p className="font-medium text-gray-900">서울 비만클리닉</p>
                        <Badge className="ml-2" variant="outline">일반의원</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        원장: 김철수 | 이메일: kim@clinic.com | 6개월 플랜
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={loading}
                        onClick={() => handleApproval('서울 비만클리닉', 'reject')}
                      >
                        거절
                      </Button>
                      <Button 
                        size="sm"
                        disabled={loading}
                        onClick={() => handleApproval('서울 비만클리닉', 'approve')}
                      >
                        승인
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-yellow-600 mr-2" />
                        <p className="font-medium text-gray-900">강남 한의원</p>
                        <Badge className="ml-2" variant="outline">한의원</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        원장: 이영희 | 이메일: lee@hanui.com | 12개월 플랜
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={loading}
                        onClick={() => handleApproval('강남 한의원', 'reject')}
                      >
                        거절
                      </Button>
                      <Button 
                        size="sm"
                        disabled={loading}
                        onClick={() => handleApproval('강남 한의원', 'approve')}
                      >
                        승인
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-yellow-600 mr-2" />
                        <p className="font-medium text-gray-900">부산 종합병원</p>
                        <Badge className="ml-2" variant="outline">병원</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        원장: 박민수 | 이메일: park@hospital.com | 1개월 플랜
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={loading}
                        onClick={() => handleApproval('부산 종합병원', 'reject')}
                      >
                        거절
                      </Button>
                      <Button 
                        size="sm"
                        disabled={loading}
                        onClick={() => handleApproval('부산 종합병원', 'approve')}
                      >
                        승인
                      </Button>
                    </div>
                  </div>
                </div>
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
                    <DollarSign className="h-4 w-4 mr-3" />
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
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">새 병원 승인</p>
                      <p className="text-xs text-gray-500">서울 다이어트 클리닉</p>
                      <p className="text-xs text-gray-400">1시간 전</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">구독 갱신</p>
                      <p className="text-xs text-gray-500">강남 한의원 - 12개월 플랜</p>
                      <p className="text-xs text-gray-400">3시간 전</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">시스템 업데이트</p>
                      <p className="text-xs text-gray-500">v1.2.3 배포 완료</p>
                      <p className="text-xs text-gray-400">6시간 전</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}