'use client'
import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Users, Calendar, BarChart3, MessageCircle, Plus, Activity } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function DoctorDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleTaskComplete = async (taskName: string) => {
    setLoading(true)
    try {
      // 실제 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 800))
      
      toast({
        title: '작업 완료',
        description: `${taskName} 작업이 완료되었습니다.`,
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '작업 처리 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-customer':
        router.push('/dashboard/doctor/customers/new')
        break
      case 'appointments':
        router.push('/dashboard/doctor/appointments')
        break
      case 'progress':
        router.push('/dashboard/doctor/progress')
        break
      case 'community':
        router.push('/dashboard/doctor/community')
        break
      default:
        toast({
          title: '준비 중',
          description: '해당 기능은 준비 중입니다.',
          variant: 'default'
        })
    }
  }

  const handleAddTask = () => {
    toast({
      title: '새 작업 추가',
      description: '새 작업 추가 기능은 준비 중입니다.',
      variant: 'default'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            안녕하세요, {user?.name || '원장님'}!
          </h1>
          <p className="text-gray-600 mt-2">
            오늘도 환자들의 건강한 변화를 함께 만들어가요.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 고객</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">활성 고객</p>
                  <p className="text-2xl font-bold text-gray-900">18</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">오늘 예약</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">평균 감량</p>
                  <p className="text-2xl font-bold text-gray-900">3.2kg</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Tasks */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">오늘 할 일</h2>
                  <Button size="sm" onClick={handleAddTask}>
                    <Plus className="h-4 w-4 mr-2" />
                    추가
                  </Button>
                </div>
              </div>
              <CardBody className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">김영희 고객 상담</p>
                      <p className="text-sm text-gray-600">오전 10:00 - 체중 감량 진행 상황 점검</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={loading}
                      onClick={() => handleTaskComplete('김영희 고객 상담')}
                    >
                      완료
                    </Button>
                  </div>
                  
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">이철수 고객 식단 검토</p>
                      <p className="text-sm text-gray-600">오후 2:00 - 주간 식단 계획 수정</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={loading}
                      onClick={() => handleTaskComplete('이철수 고객 식단 검토')}
                    >
                      완료
                    </Button>
                  </div>
                  
                  <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">주간 리포트 작성</p>
                      <p className="text-sm text-gray-600">오후 5:00 - 이번 주 고객 진행 상황 정리</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={loading}
                      onClick={() => handleTaskComplete('주간 리포트 작성')}
                    >
                      완료
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">빠른 작업</h2>
              </div>
              <CardBody className="p-6">
                <div className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('new-customer')}
                  >
                    <Users className="h-4 w-4 mr-3" />
                    새 고객 등록
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('appointments')}
                  >
                    <Calendar className="h-4 w-4 mr-3" />
                    예약 관리
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('progress')}
                  >
                    <BarChart3 className="h-4 w-4 mr-3" />
                    진행 상황 보기
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('community')}
                  >
                    <MessageCircle className="h-4 w-4 mr-3" />
                    커뮤니티 관리
                  </Button>
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
                      <p className="text-sm font-medium text-gray-900">김영희님이 체중을 기록했습니다</p>
                      <p className="text-xs text-gray-500">2시간 전</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">새로운 커뮤니티 게시글</p>
                      <p className="text-xs text-gray-500">4시간 전</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">이철수님 예약 변경</p>
                      <p className="text-xs text-gray-500">6시간 전</p>
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