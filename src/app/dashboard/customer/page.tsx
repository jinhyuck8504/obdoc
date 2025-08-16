'use client'
import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { TrendingDown, Calendar, MessageCircle, Target, Activity, Award } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/card'

export default function CustomerDashboardPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            안녕하세요, {user?.name || '고객님'}!
          </h1>
          <p className="text-gray-600 mt-2">
            오늘도 건강한 하루를 만들어가세요.
          </p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <TrendingDown className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">현재 체중</p>
                  <p className="text-2xl font-bold text-gray-900">68.5kg</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">목표 체중</p>
                  <p className="text-2xl font-bold text-gray-900">65.0kg</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">감량 성과</p>
                  <p className="text-2xl font-bold text-gray-900">-4.5kg</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <Activity className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">진행률</p>
                  <p className="text-2xl font-bold text-gray-900">78%</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Report */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">나의 리포트</h2>
              </div>
              <CardBody className="p-6">
                {/* Weight Progress Chart Placeholder */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">체중 변화 그래프</h3>
                  <div className="h-48 flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">체중 변화 차트가 여기에 표시됩니다</p>
                  </div>
                </div>

                {/* Weekly Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-800">이번 주 감량</p>
                    <p className="text-2xl font-bold text-green-900">-0.8kg</p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">평균 칼로리</p>
                    <p className="text-2xl font-bold text-blue-900">1,450</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">운동 일수</p>
                    <p className="text-2xl font-bold text-purple-900">5일</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Quick Actions */}
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">빠른 작업</h2>
              </div>
              <CardBody className="p-6">
                <div className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingDown className="h-4 w-4 mr-3" />
                    체중 기록하기
                  </Button>
                  
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-3" />
                    예약 확인
                  </Button>
                  
                  <Button className="w-full justify-start" variant="outline">
                    <MessageCircle className="h-4 w-4 mr-3" />
                    커뮤니티 참여
                  </Button>
                  
                  <Button className="w-full justify-start" variant="outline">
                    <Target className="h-4 w-4 mr-3" />
                    목표 설정
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Upcoming Schedule */}
            <Card className="mt-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">나의 일정</h2>
              </div>
              <CardBody className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">병원 방문</p>
                      <p className="text-sm text-gray-600">내일 오후 2:00</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <Activity className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">운동 계획</p>
                      <p className="text-sm text-gray-600">매일 오후 6:00</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                    <Target className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">목표 점검</p>
                      <p className="text-sm text-gray-600">주말마다</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Community Shortcut */}
            <Card className="mt-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">커뮤니티</h2>
              </div>
              <CardBody className="p-6">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    다른 분들과 경험을 나누고 동기부여를 받아보세요!
                  </p>
                  <Button className="w-full">
                    커뮤니티 바로가기
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}