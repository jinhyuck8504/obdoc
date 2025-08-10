'use client'
import React from 'react'
import { Activity, Target, TrendingDown, TrendingUp } from 'lucide-react'

interface BMIIndicatorProps {
  currentBMI: number
  targetBMI: number
  height: number
  currentWeight: number
  targetWeight: number
}

export default function BMIIndicator({ 
  currentBMI, 
  targetBMI, 
  height, 
  currentWeight, 
  targetWeight 
}: BMIIndicatorProps) {
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: '저체중', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (bmi < 23) return { category: '정상', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (bmi < 25) return { category: '과체중', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    if (bmi < 30) return { category: '비만 1단계', color: 'text-orange-600', bgColor: 'bg-orange-100' }
    return { category: '비만 2단계', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  const currentCategory = getBMICategory(currentBMI)
  const targetCategory = getBMICategory(targetBMI)

  const bmiDifference = currentBMI - targetBMI
  const isImproving = bmiDifference > 0

  return (
    <div className="space-y-6">
      {/* 현재 BMI vs 목표 BMI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <Activity className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <p className="text-3xl font-bold text-blue-600 mb-2">{currentBMI.toFixed(1)}</p>
          <p className="text-sm text-blue-700 mb-2">현재 BMI</p>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${currentCategory.bgColor} ${currentCategory.color}`}>
            {currentCategory.category}
          </span>
        </div>

        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
          <Target className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <p className="text-3xl font-bold text-green-600 mb-2">{targetBMI.toFixed(1)}</p>
          <p className="text-sm text-green-700 mb-2">목표 BMI</p>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${targetCategory.bgColor} ${targetCategory.color}`}>
            {targetCategory.category}
          </span>
        </div>
      </div>

      {/* BMI 변화 정보 */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">BMI 변화</h4>
          <div className="flex items-center space-x-2">
            {isImproving ? (
              <TrendingDown className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingUp className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${isImproving ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(bmiDifference).toFixed(1)} {isImproving ? '감소 필요' : '증가 필요'}
            </span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 space-y-1">
          <p>현재 체중: {currentWeight}kg</p>
          <p>목표 체중: {targetWeight}kg</p>
          <p>키: {height}cm</p>
        </div>
      </div>

      {/* BMI 범위 차트 */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-4">BMI 범위</h4>
        
        <div className="relative">
          {/* BMI 범위 바 */}
          <div className="flex h-8 rounded-lg overflow-hidden">
            <div className="bg-blue-200 flex-1 flex items-center justify-center text-xs text-blue-800">
              저체중<br/>~18.5
            </div>
            <div className="bg-green-200 flex-1 flex items-center justify-center text-xs text-green-800">
              정상<br/>18.5-23
            </div>
            <div className="bg-yellow-200 flex-1 flex items-center justify-center text-xs text-yellow-800">
              과체중<br/>23-25
            </div>
            <div className="bg-orange-200 flex-1 flex items-center justify-center text-xs text-orange-800">
              비만1<br/>25-30
            </div>
            <div className="bg-red-200 flex-1 flex items-center justify-center text-xs text-red-800">
              비만2<br/>30+
            </div>
          </div>
          
          {/* 현재 BMI 위치 표시 */}
          <div 
            className="absolute top-0 w-1 h-8 bg-blue-600"
            style={{ 
              left: `${Math.min(95, Math.max(5, (currentBMI / 35) * 100))}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-blue-600">
              현재
            </div>
          </div>
          
          {/* 목표 BMI 위치 표시 */}
          <div 
            className="absolute top-0 w-1 h-8 bg-green-600"
            style={{ 
              left: `${Math.min(95, Math.max(5, (targetBMI / 35) * 100))}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-green-600">
              목표
            </div>
          </div>
        </div>
      </div>

      {/* BMI 개선 팁 */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">💡 BMI 개선 팁</h4>
        <div className="text-sm text-gray-700 space-y-1">
          {currentBMI > 25 ? (
            <>
              <p>• 규칙적인 유산소 운동을 통해 체중을 감량하세요</p>
              <p>• 균형 잡힌 식단으로 칼로리 섭취를 조절하세요</p>
              <p>• 충분한 수분 섭취와 양질의 수면을 유지하세요</p>
            </>
          ) : currentBMI < 18.5 ? (
            <>
              <p>• 영양가 있는 음식으로 건강한 체중 증가를 목표하세요</p>
              <p>• 근력 운동을 통해 근육량을 늘리세요</p>
              <p>• 전문가와 상담하여 적절한 체중 증가 계획을 세우세요</p>
            </>
          ) : (
            <>
              <p>• 현재 건강한 BMI 범위를 유지하고 계십니다</p>
              <p>• 꾸준한 운동과 균형 잡힌 식단으로 현재 상태를 유지하세요</p>
              <p>• 정기적인 건강 검진을 받으시기 바랍니다</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}