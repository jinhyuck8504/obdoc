'use client'
import React from 'react'
import { WeightRecord } from '@/types/health'

interface WeightChartProps {
  records: WeightRecord[]
  targetWeight: number
  initialWeight: number
  height?: number
}

export default function WeightChart({ 
  records, 
  targetWeight, 
  initialWeight, 
  height = 300 
}: WeightChartProps) {
  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            📊
          </div>
          <p className="text-gray-500">체중 기록이 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">체중을 기록하면 차트가 표시됩니다</p>
        </div>
      </div>
    )
  }

  // 간단한 SVG 차트 구현
  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const weights = sortedRecords.map(r => r.weight)
  const minWeight = Math.min(...weights, targetWeight) - 2
  const maxWeight = Math.max(...weights, initialWeight) + 2
  const weightRange = maxWeight - minWeight

  const chartWidth = 600
  const chartHeight = height - 80
  const padding = 40

  const getX = (index: number) => padding + (index * (chartWidth - 2 * padding)) / (sortedRecords.length - 1)
  const getY = (weight: number) => padding + ((maxWeight - weight) / weightRange) * chartHeight

  return (
    <div className="bg-white p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">체중 변화 차트</h3>
        <p className="text-sm text-gray-600">시간에 따른 체중 변화를 확인하세요</p>
      </div>
      
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={height} className="border border-gray-200 rounded-lg">
          {/* 격자 */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* 목표 체중 라인 */}
          <line
            x1={padding}
            y1={getY(targetWeight)}
            x2={chartWidth - padding}
            y2={getY(targetWeight)}
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <text
            x={chartWidth - padding - 10}
            y={getY(targetWeight) - 5}
            fill="#10b981"
            fontSize="12"
            textAnchor="end"
          >
            목표: {targetWeight}kg
          </text>
          
          {/* 체중 변화 라인 */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            points={sortedRecords.map((record, index) => 
              `${getX(index)},${getY(record.weight)}`
            ).join(' ')}
          />
          
          {/* 데이터 포인트 */}
          {sortedRecords.map((record, index) => (
            <g key={record.id}>
              <circle
                cx={getX(index)}
                cy={getY(record.weight)}
                r="4"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={getX(index)}
                y={getY(record.weight) - 10}
                fill="#374151"
                fontSize="10"
                textAnchor="middle"
              >
                {record.weight}kg
              </text>
            </g>
          ))}
          
          {/* Y축 라벨 */}
          {Array.from({ length: 5 }, (_, i) => {
            const weight = minWeight + (weightRange * i) / 4
            return (
              <g key={i}>
                <text
                  x={padding - 10}
                  y={getY(weight) + 4}
                  fill="#6b7280"
                  fontSize="10"
                  textAnchor="end"
                >
                  {weight.toFixed(0)}kg
                </text>
              </g>
            )
          })}
          
          {/* X축 라벨 */}
          {sortedRecords.map((record, index) => (
            <text
              key={record.id}
              x={getX(index)}
              y={height - 10}
              fill="#6b7280"
              fontSize="10"
              textAnchor="middle"
            >
              {new Date(record.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </text>
          ))}
        </svg>
      </div>
      
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-gray-600">실제 체중</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span className="text-gray-600">목표 체중</span>
        </div>
      </div>
    </div>
  )
}