'use client'

import React from 'react'
import { Customer } from '@/types/customer'
import BackButton from '@/components/common/BackButton'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface CustomerDetailProps {
  customer: Customer
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function CustomerDetail({ 
  customer, 
  onBack, 
  onEdit, 
  onDelete 
}: CustomerDetailProps) {
  const handleDelete = () => {
    if (window.confirm('정말로 이 고객을 삭제하시겠습니까?')) {
      onDelete()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <BackButton onClick={onBack} />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">고객 상세 정보</h1>
        <p className="text-gray-600">고객의 상세 정보를 확인하고 관리할 수 있습니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 기본 정보 */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">기본 정보</h2>
                <div className="flex space-x-2">
                  <Button onClick={onEdit} variant="outline" size="sm">
                    수정
                  </Button>
                  <Button onClick={handleDelete} variant="danger" size="sm">
                    삭제
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이름
                  </label>
                  <p className="text-gray-900">{customer.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일
                  </label>
                  <p className="text-gray-900">{customer.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전화번호
                  </label>
                  <p className="text-gray-900">{customer.phone || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    생년월일
                  </label>
                  <p className="text-gray-900">{customer.birth_date || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    성별
                  </label>
                  <p className="text-gray-900">
                    {customer.gender === 'male' ? '남성' : customer.gender === 'female' ? '여성' : '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    가입일
                  </label>
                  <p className="text-gray-900">
                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString('ko-KR') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 상태 정보 */}
        <div>
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">상태 정보</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    계정 상태
                  </label>
                  <Badge variant={customer.is_active ? 'success' : 'danger'}>
                    {customer.is_active ? '활성' : '비활성'}
                  </Badge>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 인증
                  </label>
                  <Badge variant={customer.email_verified ? 'success' : 'warning'}>
                    {customer.email_verified ? '인증됨' : '미인증'}
                  </Badge>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    마지막 로그인
                  </label>
                  <p className="text-sm text-gray-600">
                    {customer.last_login_at 
                      ? new Date(customer.last_login_at).toLocaleString('ko-KR')
                      : '로그인 기록 없음'
                    }
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 건강 정보 */}
      {(customer.height || customer.weight || customer.target_weight) && (
        <div className="mt-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">건강 정보</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {customer.height && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      키
                    </label>
                    <p className="text-gray-900">{customer.height}cm</p>
                  </div>
                )}

                {customer.weight && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      현재 체중
                    </label>
                    <p className="text-gray-900">{customer.weight}kg</p>
                  </div>
                )}

                {customer.target_weight && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      목표 체중
                    </label>
                    <p className="text-gray-900">{customer.target_weight}kg</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}