'use client'

import React from 'react'
import { useDensity, DensityLevel } from '@/contexts/DensityContext'
import { DensityCard, DensityCardContent, DensityCardHeader, DensityCardTitle } from '@/components/ui/DensityCard'
import { DensityButton } from '@/components/ui/DensityButton'
import { DensityInput } from '@/components/ui/DensityInput'
import { Monitor, Smartphone, Tablet } from 'lucide-react'

const densityOptions: Array<{
  level: DensityLevel
  label: string
  description: string
  icon: React.ComponentType<any>
}> = [
  {
    level: 'compact',
    label: '컴팩트',
    description: '더 많은 정보를 한 화면에 표시',
    icon: Smartphone
  },
  {
    level: 'comfortable',
    label: '편안함',
    description: '균형잡힌 간격과 크기',
    icon: Monitor
  },
  {
    level: 'spacious',
    label: '여유로움',
    description: '넓은 간격으로 편안한 사용',
    icon: Tablet
  }
]

export default function DensitySettings() {
  const { density, setDensity, config } = useDensity()

  return (
    <DensityCard>
      <DensityCardHeader>
        <DensityCardTitle>UI 밀도 설정</DensityCardTitle>
        <p className="text-sm text-gray-600">
          화면 요소들의 간격과 크기를 조정하여 선호하는 밀도로 설정하세요.
        </p>
      </DensityCardHeader>
      
      <DensityCardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {densityOptions.map((option) => {
            const Icon = option.icon
            const isActive = density === option.level
            
            return (
              <div
                key={option.level}
                className={`
                  relative border rounded-lg p-4 cursor-pointer transition-all
                  ${isActive 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => setDensity(option.level)}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <Icon className={`w-8 h-8 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  
                  <div>
                    <h3 className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                      {option.label}
                    </h3>
                    <p className={`text-sm mt-1 ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                      {option.description}
                    </p>
                  </div>
                  
                  {/* 미리보기 */}
                  <div className="w-full">
                    <div className="text-xs text-gray-500 mb-2">미리보기</div>
                    <div className="space-y-1">
                      <div 
                        className="bg-gray-200 rounded"
                        style={{ 
                          height: option.level === 'compact' ? '1.5rem' : 
                                 option.level === 'comfortable' ? '2rem' : '2.5rem',
                          padding: option.level === 'compact' ? '0.25rem' : 
                                  option.level === 'comfortable' ? '0.5rem' : '0.75rem'
                        }}
                      />
                      <div 
                        className="bg-gray-200 rounded"
                        style={{ 
                          height: option.level === 'compact' ? '1.5rem' : 
                                 option.level === 'comfortable' ? '2rem' : '2.5rem',
                          padding: option.level === 'compact' ? '0.25rem' : 
                                  option.level === 'comfortable' ? '0.5rem' : '0.75rem'
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* 현재 설정 정보 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">현재 설정</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">간격:</span>
              <span className="ml-1 font-mono">{config.spacing.md}</span>
            </div>
            <div>
              <span className="text-gray-600">패딩:</span>
              <span className="ml-1 font-mono">{config.padding.md}</span>
            </div>
            <div>
              <span className="text-gray-600">폰트:</span>
              <span className="ml-1 font-mono">{config.fontSize.base}</span>
            </div>
            <div>
              <span className="text-gray-600">행간:</span>
              <span className="ml-1 font-mono">{config.lineHeight.normal}</span>
            </div>
          </div>
        </div>
        
        {/* 테스트 컴포넌트들 */}
        <div className="mt-6 space-y-4">
          <h4 className="font-medium text-gray-900">실시간 미리보기</h4>
          
          <div className="space-y-3">
            <div className="flex space-x-2">
              <DensityButton variant="default">기본 버튼</DensityButton>
              <DensityButton variant="outline">아웃라인 버튼</DensityButton>
              <DensityButton variant="secondary">보조 버튼</DensityButton>
            </div>
            
            <div className="space-y-2">
              <DensityInput 
                type="text" 
                placeholder="텍스트 입력 필드"
              />
              <select className={`
                w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500
                input-${density}
              `}>
                <option>선택 옵션</option>
                <option>옵션 1</option>
                <option>옵션 2</option>
              </select>
            </div>
            
            <div className={`border rounded-lg bg-white card-${density}`}>
              <div className="border-b px-4 py-2">
                <h5 className="font-medium">카드 제목</h5>
              </div>
              <div className="px-4 py-3">
                <p className="text-gray-600">카드 내용입니다. 밀도 설정에 따라 간격이 조정됩니다.</p>
              </div>
            </div>
          </div>
        </div>
      </DensityCardContent>
    </DensityCard>
  )
}