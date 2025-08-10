'use client'

import React, { useState } from 'react'
import { X, Save, Weight, Calendar, FileText } from 'lucide-react'
import { WeightFormData } from '@/types/health'

interface WeightInputModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: WeightFormData) => void
  initialData?: Partial<WeightFormData>
}

export default function WeightInputModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}: WeightInputModalProps) {
  const [formData, setFormData] = useState<WeightFormData>({
    weight: initialData?.weight || 0,
    date: initialData?.date || new Date().toISOString().split('T')[0],
    note: initialData?.note || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.weight || formData.weight <= 0) {
      newErrors.weight = '체중을 입력해주세요'
    } else if (formData.weight < 30 || formData.weight > 300) {
      newErrors.weight = '체중은 30kg에서 300kg 사이여야 합니다'
    }

    if (!formData.date) {
      newErrors.date = '날짜를 선택해주세요'
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // 오늘 끝까지 허용
      
      if (selectedDate > today) {
        newErrors.date = '미래 날짜는 선택할 수 없습니다'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSave(formData)
      onClose()
      // 폼 리셋
      setFormData({
        weight: 0,
        date: new Date().toISOString().split('T')[0],
        note: ''
      })
    } catch (error) {
      console.error('체중 저장 중 오류:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof WeightFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const calculateBMI = (weight: number, height: number): number => {
    if (weight <= 0 || height <= 0) return 0
    return weight / Math.pow(height / 100, 2)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Weight className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {initialData ? '체중 기록 수정' : '체중 기록 추가'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 체중 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              체중 (kg) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={formData.weight || ''}
                onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.weight ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="체중을 입력하세요"
              />
            </div>
            {errors.weight && (
              <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
            )}
          </div>

          {/* 날짜 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              측정 날짜 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모 (선택사항)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                rows={3}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="오늘의 컨디션이나 특이사항을 기록하세요"
              />
            </div>
          </div>

          {/* BMI 미리보기 (키 정보가 있을 때) */}
          {formData.weight > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>참고:</strong> 체중 기록이 저장되면 BMI와 진행률이 자동으로 계산됩니다.
              </p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}