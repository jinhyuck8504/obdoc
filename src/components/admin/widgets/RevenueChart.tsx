'use client'
import React from 'react'
import { RevenueData } from '@/types/admin'
import { TrendingUp, DollarSign } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js'
import { Bar, Line, Chart } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

interface RevenueChartProps {
  data: RevenueData[]
  loading?: boolean
}

export default function RevenueChart({ data, loading }: RevenueChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    )
  }

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const averageRevenue = totalRevenue / data.length

  // Chart.js 데이터 설정
  const chartData = {
    labels: data.map(item => {
      const date = new Date(item.month + '-01')
      return date.toLocaleDateString('ko-KR', { month: 'short' })
    }),
    datasets: [
      {
        label: '수익',
        data: data.map(item => item.revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: '신규 구독',
        data: data.map(item => item.newSubscriptions * 100000), // 시각화를 위해 스케일 조정
        type: 'line' as const,
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        yAxisID: 'y1',
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || ''
            if (label === '수익') {
              return `${label}: ${context.parsed.y.toLocaleString('ko-KR')}원`
            } else {
              return `${label}: ${Math.round(context.parsed.y / 100000)}건`
            }
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
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value: any) {
            return (value / 1000000).toFixed(1) + 'M원'
          },
          font: {
            size: 11
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value: any) {
            return Math.round(value / 100000) + '건'
          },
          font: {
            size: 11
          }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">월별 수익 현황</h3>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <DollarSign className="w-4 h-4" />
            <span>평균: {averageRevenue.toLocaleString('ko-KR')}원</span>
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="relative h-64 mb-6">
        <Chart type="bar" data={chartData} options={chartOptions} />
      </div>

      {/* 범례 */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {totalRevenue.toLocaleString('ko-KR')}원
            </div>
            <div className="text-gray-600">총 수익</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.reduce((sum, d) => sum + d.subscriptions, 0)}건
            </div>
            <div className="text-gray-600">총 구독</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.reduce((sum, d) => sum + d.newSubscriptions, 0)}건
            </div>
            <div className="text-gray-600">신규 구독</div>
          </div>
        </div>
      </div>
    </div>
  )
}