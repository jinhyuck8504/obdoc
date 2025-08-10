'use client'
import React, { useState } from 'react'
import { X, Target, Calendar, FileText, Save } from 'lucide-react'
import { GoalFormData, HealthMetrics } from '@/types/health'

interface GoalSettingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: GoalFormData) => void
  currentMetrics: HealthMetrics
}

export default function GoalSettingModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentMetrics 
}: GoalSettingModalProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    targetWeight: currentMetrics.targetWeight,
    targetDate: '',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.targetWeight || formData.targetWeight <= 0) {
      newErrors.targetWeight = '목표 체중을 입력해주세요'
    } else if (formData.targetWeight < 30 || formData.targetWeight > 200) {
      newErrors.targetWeight = '목표 체중은 30kg에서 200kg 사이여야 합니다'
    }

    if (formData.targetDate) {
      const targetDate = new Date(formData.targetDate)
      const today = new Date()
      if (targetDate <= today) {
        newErrors.targetDate = '목표 날짜는 오늘 이후여야 합니다'
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
    } catch (error) {
      console.error('목표 설정 중 오류:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof GoalFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">목표 설정</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              목표 체중 (kg) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                step="0.1"
                value={formData.targetWeight || ''}
                onChange={(e) => handleInputChange('targetWeight', parseFloat(e.target.value) || 0)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.targetWeight ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="목표 체중을 입력하세요"
                min="30"
                max="200"
              />
            </div>
            {errors.targetWeight && (
              <p className="mt-1 text-sm text-red-600">{errors.targetWeight}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              목표 달성 날짜 (선택사항)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => handleInputChange('targetDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.targetDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.targetDate && (
              <p className="mt-1 text-sm text-red-600">{errors.targetDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모 (선택사항)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="목표에 대한 메모를 작성하세요"
              />
            </div>
          </div>

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
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors flex items-center"
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