'use client'

import React, { useState } from 'react'
import { Customer } from '@/types/customer'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface CustomerFormProps {
  customer?: Customer
  onSave: (customerData: any) => void
  onCancel: () => void
}

export default function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    birth_date: customer?.birth_date || '',
    gender: customer?.gender || '',
    height: customer?.height || '',
    weight: customer?.weight || '',
    target_weight: customer?.target_weight || '',
    is_active: customer?.is_active ?? true,
    email_verified: customer?.email_verified ?? false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.'
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.'
    }

    if (formData.phone && !/^[0-9-+\s()]+$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식을 입력해주세요.'
    }

    if (formData.height && (isNaN(Number(formData.height)) || Number(formData.height) <= 0)) {
      newErrors.height = '올바른 키를 입력해주세요.'
    }

    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) <= 0)) {
      newErrors.weight = '올바른 체중을 입력해주세요.'
    }

    if (formData.target_weight && (isNaN(Number(formData.target_weight)) || Number(formData.target_weight) <= 0)) {
      newErrors.target_weight = '올바른 목표 체중을 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
        target_weight: formData.target_weight ? Number(formData.target_weight) : null,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null
      }
      
      await onSave(submitData)
    } catch (error) {
      console.error('고객 정보 저장 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {customer ? '고객 정보 수정' : '새 고객 등록'}
        </h1>
        <p className="text-gray-600">
          {customer ? '고객의 정보를 수정합니다.' : '새로운 고객을 등록합니다.'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="이름 *"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div>
                <Input
                  label="이메일 *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={errors.email}
                  placeholder="이메일을 입력하세요"
                />
              </div>

              <div>
                <Input
                  label="전화번호"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  error={errors.phone}
                  placeholder="전화번호를 입력하세요"
                />
              </div>

              <div>
                <Input
                  label="생년월일"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleChange('birth_date', e.target.value)}
                  error={errors.birth_date}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  성별
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">선택하세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>
            </div>
          </div>

          {/* 건강 정보 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">건강 정보</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  label="키 (cm)"
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleChange('height', e.target.value)}
                  error={errors.height}
                  placeholder="키를 입력하세요"
                />
              </div>

              <div>
                <Input
                  label="현재 체중 (kg)"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  error={errors.weight}
                  placeholder="체중을 입력하세요"
                />
              </div>

              <div>
                <Input
                  label="목표 체중 (kg)"
                  type="number"
                  step="0.1"
                  value={formData.target_weight}
                  onChange={(e) => handleChange('target_weight', e.target.value)}
                  error={errors.target_weight}
                  placeholder="목표 체중을 입력하세요"
                />
              </div>
            </div>
          </div>

          {/* 계정 상태 */}
          {customer && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">계정 상태</h2>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    계정 활성화
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="email_verified"
                    checked={formData.email_verified}
                    onChange={(e) => handleChange('email_verified', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="email_verified" className="ml-2 text-sm text-gray-700">
                    이메일 인증됨
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              {customer ? '수정' : '등록'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}