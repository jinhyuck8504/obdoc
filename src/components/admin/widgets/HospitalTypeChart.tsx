'use client'
import React from 'react'
import { HospitalTypeStats } from '@/types/admin'
import { Building2, Users, DollarSign } from 'lucide-react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface HospitalTypeChartProps {
  data: HospitalTypeStats[]
  loading?: boolean
}

export default function HospitalTypeChart({ data, loading }: HospitalTypeChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="flex-1 h-4 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const totalCount = data.reduce((sum, item) => sum + item.count, 0)
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)

  const colors = [
    'rgba(59, 130, 246, 0.8)',   // blue
    'rgba(34, 197, 94, 0.8)',    // green
    'rgba(251, 191, 36, 0.8)',   // yellow
    'rgba(147, 51, 234, 0.8)',   // purple
    'rgba(99, 102, 241, 0.8)'    // indigo
  ]

  const borderColors = [
    'rgba(59, 130, 246, 1)',
    'rgba(34, 197, 94, 1)',
    'rgba(251, 191, 36, 1)',
    'rgba(147, 51, 234, 1)',
    'rgba(99, 102, 241, 1)'
  ]

  // Chart.js 데이터 설정
  const chartData = {
    labels: data.map(item => item.type),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: colors.slice(0, data.length),
        borderColor: borderColors.slice(0, data.length),
        borderWidth: 2,
        hoverBackgroundColor: colors.slice(0, data.length).map(color => 
          color.replace('0.8', '0.9')
        ),
        hoverBorderWidth: 3
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          },
          generateLabels: function(chart: any) {
            const data = chart.data
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const dataset = data.datasets[0]
                const count = dataset.data[i]
                const percentage = ((count / totalCount) * 100).toFixed(1)
                return {
                  text: `${label} (${count}개, ${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: dataset.borderWidth,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                }
              })
            }
            return []
          }
        }
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
            const label = context.label || ''
            const value = context.parsed
            const percentage = ((value / totalCount) * 100).toFixed(1)
            const item = data[context.dataIndex]
            return [
              `${label}: ${value}개 병원 (${percentage}%)`,
              `활성: ${item.activeCount}개`,
              `수익: ${(item.revenue / 1000000).toFixed(1)}M원`
            ]
          }
        }
      }
    },
    cutout: '60%',
    animation: {
      animateRotate: true,
      animateScale: true
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* 헤더 */}
      <div className="flex items-center space-x-2 mb-6">
        <Building2 className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">병원 유형별 현황</h3>
      </div>

      {/* 차트 */}
      <div className="relative h-64 mb-6">
        <Doughnut data={chartData} options={chartOptions} />
      </div>

      {/* 상세 정보 */}
      <div className="space-y-3 mb-6">
        {data.map((item, index) => (
          <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <div>
                <div className="font-medium text-gray-900">{item.type}</div>
                <div className="text-sm text-gray-600">
                  {item.count}개 병원 ({item.percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{item.activeCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-3 h-3" />
                  <span>{(item.revenue / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 요약 */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{totalCount}</div>
            <div className="text-gray-600">총 병원 수</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {(totalRevenue / 1000000).toFixed(1)}M원
            </div>
            <div className="text-gray-600">총 수익</div>
          </div>
        </div>
      </div>
    </div>
  )
}