'use client'

import React, { useState, useEffect } from 'react'
import { Clock, User, Calendar, CheckCircle, Activity } from 'lucide-react'
// TODO: 빌드 오류 해결을 위해 dashboardDataService import 임시 제거
// import { dashboardDataService } from '@/lib/dashboardDataService'
// TODO: density 기능 임시 제거 (빌드 오류 해결 후 재추가)
// import { useDensity } from '@/contexts/DensityContext'

interface ActivityItem {
  type: 'appointment' | 'task'
  patientId: string
  patientName: string
  description: string
  timestamp: string
}

export default function RecentActivity() {
  // TODO: density 기능 임시 제거 (빌드 오류 해결 후 재추가)
  // const { density, getDensityClass } = useDensity()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: 빌드 오류 해결을 위해 임시로 빈 데이터 사용
    setActivities([])
    setLoading(false)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-blue-500" />
      case 'task':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
      
      if (diffInHours < 1) {
        return '방금 전'
      } else if (diffInHours < 24) {
        return `${diffInHours}시간 전`
      } else {
        return date.toLocaleDateString('ko-KR', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    } catch {
      return timestamp
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            최근 활동
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          최근 활동
        </h2>
        <span className="text-sm text-gray-500">
          {activities.length}개 활동
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">최근 활동이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {activities.map((activity, index) => (
            <div
              key={`${activity.type}-${activity.patientId}-${index}`}
              className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <User className="w-3 h-3 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {activity.patientName}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              </div>

              <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                activity.type === 'appointment' ? 'bg-blue-500' : 'bg-green-500'
              }`} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button 
          onClick={() => {/* TODO: 새로고침 기능 임시 비활성화 */}}
          className="w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          새로고침
        </button>
      </div>
    </div>
  )
}