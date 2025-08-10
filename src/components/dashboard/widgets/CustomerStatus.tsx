'use client'

import React, { useState } from 'react'
import { Users, TrendingDown, TrendingUp, Target, Activity, Calendar, Weight } from 'lucide-react'

export default function PatientStatus() {
  // TODO: Fetch real data from API
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [isLoading, setIsLoading] = useState(false)
  
  // 기간별 통계 데이터
  const statsData = {
    week: {
      totalPatients: 45,
      activePatients: 38,
      goalAchieved: 3,
      averageWeightLoss: 0.8,
      successRate: 65,
      newPatients: 2
    },
    month: {
      totalPatients: 45,
      activePatients: 38,
      goalAchieved: 8,
      averageWeightLoss: 2.3,
      successRate: 78,
      newPatients: 6
    },
    year: {
      totalPatients: 45,
      activePatients: 38,
      goalAchieved: 35,
      averageWeightLoss: 12.5,
      successRate: 85,
      newPatients: 25
    }
  }
  
  const stats = statsData[selectedPeriod]

  const handlePeriodChange = async (period: 'week' | 'month' | 'year') => {
    setIsLoading(true)
    setSelectedPeriod(period)
    
    // 실제 API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsLoading(false)
  }

  const getPeriodLabel = (period: 'week' | 'month' | 'year') => {
    switch (period) {
      case 'week': return '이번 주'
      case 'month': return '이번 달'
      case 'year': return '올해'
    }
  }

  const recentPatients = [
    { id: 1, name: '김철수', status: 'active', lastVisit: '2024-01-15', progress: 85 },
    { id: 2, name: '이영희', status: 'goal_achieved', lastVisit: '2024-01-14', progress: 100 },
    { id: 3, name: '박민수', status: 'needs_attention', lastVisit: '2024-01-10', progress: 45 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'goal_achieved':
        return 'bg-green-100 text-green-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'needs_attention':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'goal_achieved':
        return '목표달성'
      case 'active':
        return '진행중'
      case 'needs_attention':
        return '관심필요'
      default:
        return '비활성'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">고객 현황</h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              disabled={isLoading}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedPeriod === period
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {getPeriodLabel(period)}
            </button>
          ))}
        </div>
      </div>
      
      {/* 주요 통계 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
          <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">
            {isLoading ? '...' : stats.totalPatients}
          </p>
          <p className="text-sm text-gray-600">전체 고객</p>
        </div>
        
        <div className={`text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
          <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">
            {isLoading ? '...' : stats.goalAchieved}
          </p>
          <p className="text-sm text-gray-600">목표 달성</p>
        </div>
        
        <div className={`text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
          <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-600">
            {isLoading ? '...' : stats.activePatients}
          </p>
          <p className="text-sm text-gray-600">활성 고객</p>
        </div>
        
        <div className={`text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
          <Weight className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-orange-600">
            {isLoading ? '...' : `${stats.averageWeightLoss}kg`}
          </p>
          <p className="text-sm text-gray-600">평균 감량</p>
        </div>
      </div>

      {/* 성과 지표 */}
      <div className={`mb-6 p-4 bg-gray-50 rounded-lg transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">성공률</span>
          <span className="text-sm font-bold text-green-600">
            {isLoading ? '...' : `${stats.successRate}%`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: isLoading ? '0%' : `${stats.successRate}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>
            {getPeriodLabel(selectedPeriod)} 신규: {isLoading ? '...' : `${stats.newPatients}명`}
          </span>
          <span className="text-green-600">
            {isLoading ? '...' : '+15% 증가'}
          </span>
        </div>
      </div>

      {/* 최근 고객 활동 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">최근 고객 활동</h3>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {recentPatients.map((patient) => (
            <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">
                    {patient.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-600">{patient.lastVisit}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(patient.status)}`}>
                  {getStatusText(patient.status)}
                </span>
                <p className="text-xs text-gray-500 mt-1">{patient.progress}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}