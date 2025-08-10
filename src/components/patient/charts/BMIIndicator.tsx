'use client'

import React from 'react'
import { Activity, Target, TrendingDown } from 'lucide-react'

interface BMIIndicatorProps {
  currentBMI: number
  targetBMI: number
  height: number
  currentWeight: number
  targetWeight: number
  className?: string
}

export default function BMIIndicator({
  currentBMI,
  targetBMI,
  height,
  currentWeight,
  targetWeight,
  className = ''
}: BMIIndicatorProps) {
  
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: '저체중', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (bmi < 23) return { category: '정상', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (bmi < 25) return { category: '과체중', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    if (bmi < 30) return { category: '비만', color: 'text-orange-600', bgColor: 'bg-orange-100' }
    return { category: '고도비만', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  const currentCategory = getBMICategory(currentBMI)
  const targetCategory = getBMICategory(targetBMI)

  // BMI 스케일 (15-35 범위)
  const minBMI = 15
  const maxBMI = 35
  const bmiRange = maxBMI - minBMI

  // 현재 BMI와 목표 BMI의 위치 계산 (퍼센트)
  const currentPosition = ((currentBMI - minBMI) / bmiRange) * 100
  const targetPosition = ((targetBMI - minBMI) / bmiRange) * 100

  // BMI 구간별 색상과 위치
  const bmiRanges = [
    { min: 15, max: 18.5, color: '#3B82F6', label: '저체중' },
    { min: 18.5, max: 23, color: '#10B981', label: '정상' },
    { min: 23, max: 25, color: '#F59E0B', label: '과체중' },
    { min: 25, max: 30, color: '#F97316', label: '비만' },
    { min: 30, max: 35, color: '#EF4444', label: '고도비만' }
  ]

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">BMI 지수</h3>
          <p className="text-sm text-gray-600">체질량지수 (Body Mass Index)</p>
        </div>
        <Activity className="w-6 h-6 text-blue-600" />
      </div>

      {/* 현재 BMI와 목표 BMI 카드 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${currentCategory.bgColor}`}>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-1">현재 BMI</p>
            <p className={`text-2xl font-bold ${currentCategory.color}`}>
              {currentBMI.toFixed(1)}
            </p>
            <p className={`text-sm font-medium ${currentCategory.color}`}>
              {currentCategory.category}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {currentWeight}kg / {height}cm
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${targetCategory.bgColor}`}>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-1">목표 BMI</p>
            <p className={`text-2xl font-bold ${targetCategory.color}`}>
              {targetBMI.toFixed(1)}
            </p>
            <p className={`text-sm font-medium ${targetCategory.color}`}>
              {targetCategory.category}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {targetWeight}kg / {height}cm
            </p>
          </div>
        </div>
      </div>

      {/* BMI 스케일 바 */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>저체중</span>
          <span>정상</span>
          <span>과체중</span>
          <span>비만</span>
          <span>고도비만</span>
        </div>
        
        <div className="relative h-8 rounded-lg overflow-hidden">
          {/* 배경 그라데이션 */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, 
                #3B82F6 0%, #3B82F6 ${((18.5 - minBMI) / bmiRange) * 100}%,
                #10B981 ${((18.5 - minBMI) / bmiRange) * 100}%, #10B981 ${((23 - minBMI) / bmiRange) * 100}%,
                #F59E0B ${((23 - minBMI) / bmiRange) * 100}%, #F59E0B ${((25 - minBMI) / bmiRange) * 100}%,
                #F97316 ${((25 - minBMI) / bmiRange) * 100}%, #F97316 ${((30 - minBMI) / bmiRange) * 100}%,
                #EF4444 ${((30 - minBMI) / bmiRange) * 100}%, #EF4444 100%
              )`
            }}
          />

          {/* 현재 BMI 마커 */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-gray-800 shadow-lg"
            style={{ left: `${Math.max(0, Math.min(100, currentPosition))}%` }}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                현재: {currentBMI.toFixed(1)}
              </div>
            </div>
          </div>

          {/* 목표 BMI 마커 */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-green-600 shadow-lg"
            style={{ left: `${Math.max(0, Math.min(100, targetPosition))}%` }}
          >
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                목표: {targetBMI.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* 스케일 숫자 */}
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>15</span>
          <span>18.5</span>
          <span>23</span>
          <span>25</span>
          <span>30</span>
          <span>35</span>
        </div>
      </div>

      {/* BMI 변화 정보 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <TrendingDown className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-sm text-gray-600">BMI 변화</p>
          <p className="font-bold text-gray-900">
            {(currentBMI - targetBMI).toFixed(1)}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Target className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-sm text-gray-600">목표까지</p>
          <p className="font-bold text-gray-900">
            {Math.abs(currentBMI - targetBMI).toFixed(1)}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Activity className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <p className="text-sm text-gray-600">건강 상태</p>
          <p className={`font-bold ${currentCategory.color}`}>
            {currentCategory.category}
          </p>
        </div>
      </div>

      {/* BMI 가이드 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">BMI 가이드</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {bmiRanges.map((range, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: range.color }}
              />
              <span className="text-blue-800">
                {range.label}: {range.min}-{range.max === 35 ? '35+' : range.max}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-700 mt-2">
          * 아시아인 기준 (WHO 아시아-태평양 가이드라인)
        </p>
      </div>

      {/* 건강 팁 */}
      {currentBMI > 23 && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start space-x-2">
            <Target className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-800">건강 팁</h4>
              <p className="text-xs text-yellow-700 mt-1">
                {currentBMI > 25 
                  ? '규칙적인 운동과 균형 잡힌 식단으로 건강한 체중 관리를 시작해보세요.'
                  : '조금만 더 노력하면 정상 체중에 도달할 수 있어요. 꾸준히 관리해보세요!'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {currentBMI <= 23 && currentBMI >= 18.5 && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start space-x-2">
            <Activity className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-green-800">축하합니다! 🎉</h4>
              <p className="text-xs text-green-700 mt-1">
                건강한 BMI 범위에 있습니다. 현재 상태를 유지하며 꾸준한 관리를 계속해보세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}