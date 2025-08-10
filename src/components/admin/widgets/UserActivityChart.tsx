'use client'
import React, { useState } from 'react'
import { UserActivityData } from '@/types/admin'
import { Activity, Users, MessageSquare, Calendar } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface UserActivityChartProps {
  data: UserActivityData[]
  loading?: boolean
}

type MetricType = 'activeUsers' | 'newUsers' | 'posts' | 'appointments'

export default function UserActivityChart({ data, loading }: UserActivityChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('activeUsers')

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="flex space-x-2 mb-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          ))}
        </div>
        <div className="h-48 bg-gray-100 rounded animate-pulse"></div>
      </div>
    )
  }

  const metrics = [
    { key: 'activeUsers' as MetricType, label: '활성 사용자', icon: Users, color: 'blue' },
    { key: 'newUsers' as MetricType, label: '신규 사용자', icon: Users, color: 'green' },
    { key: 'posts' as MetricType, label: '게시글', icon: MessageSquare, color: 'purple' },
    { key: 'appointments' as MetricType, label: '예약', icon: Calendar, color: 'orange' }
  ]

  const selectedMetricData = metrics.find(m => m.key === selectedMetric)!
  const recentData = data.slice(-7) // 최근 7일

  const colorMap: Record<string, { background: string; border: string; point: string }> = {
    blue: {
      background: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 1)',
      point: 'rgba(59, 130, 246, 1)'
    },
    green: {
      background: 'rgba(34, 197, 94, 0.1)',
      border: 'rgba(34, 197, 94, 1)',
      point: 'rgba(34, 197, 94, 1)'
    },
    purple: {
      background: 'rgba(147, 51, 234, 0.1)',
      border: 'rgba(147, 51, 234, 1)',
      point: 'rgba(147, 51, 234, 1)'
    },
    orange: {
      background: 'rgba(251, 146, 60, 0.1)',
      border: 'rgba(251, 146, 60, 1)',
      point: 'rgba(251, 146, 60, 1)'
    }
  }

  const colorClasses = {
    blue: 'bg-blue-500 border-blue-500 text-blue-600',
    green: 'bg-green-500 border-green-500 text-green-600',
    purple: 'bg-purple-500 border-purple-500 text-purple-600',
    orange: 'bg-orange-500 border-orange-500 text-orange-600'
  }

  // Chart.js 데이터 설정
  const chartData = {
    labels: recentData.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      })
    }),
    datasets: [
      {
        label: selectedMetricData.label,
        data: recentData.map(item => item[selectedMetric]),
        fill: true,
        backgroundColor: colorMap[selectedMetricData.color].background,
        borderColor: colorMap[selectedMetricData.color].border,
        pointBackgroundColor: colorMap[selectedMetricData.color].point,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 3,
        tension: 0.4,
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString('ko-KR')}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value: any) {
            return value.toLocaleString('ko-KR')
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* 헤더 */}
      <div className="flex items-center space-x-2 mb-6">
        <Activity className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">사용자 활동 현황</h3>
      </div>

      {/* 메트릭 선택 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {metrics.map(metric => {
          const Icon = metric.icon
          const isSelected = selectedMetric === metric.key
          
          return (
            <button
              key={metric.key}
              onClick={() => setSelectedMetric(metric.key)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected 
                  ? `bg-${metric.color}-100 text-${metric.color}-700 border border-${metric.color}-200`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{metric.label}</span>
            </button>
          )
        })}
      </div>

      {/* 차트 */}
      <div className="relative h-48 mb-6">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        {metrics.map(metric => {
          const Icon = metric.icon
          const total = data.reduce((sum, d) => sum + d[metric.key], 0)
          const average = Math.round(total / data.length)
          
          return (
            <div key={metric.key} className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-600">{metric.label}</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {average.toLocaleString('ko-KR')}
              </div>
              <div className="text-xs text-gray-500">평균/일</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}