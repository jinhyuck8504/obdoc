'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import CustomerDetail from '@/components/customer/CustomerDetail'
import CustomerForm from '@/components/customer/CustomerForm'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Customer } from '@/types/customer'
import { customerService } from '@/lib/customerService'

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true)
        const data = await customerService.getCustomer(customerId)
        if (!data) {
          setError('고객 정보를 찾을 수 없습니다.')
          return
        }
        setCustomer(data)
      } catch (error) {
        console.error('고객 정보 조회 실패:', error)
        setError('고객 정보를 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchCustomer()
    }
  }, [customerId])

  const handleBack = () => {
    router.push('/dashboard/doctor/customers')
  }

  const handleEdit = () => {
    setShowEditForm(true)
  }

  const handleDelete = async () => {
    if (!customer) return
    
    try {
      await customerService.deleteCustomer(customer.id)
      alert('고객이 삭제되었습니다.')
      router.push('/dashboard/doctor/customers')
    } catch (error) {
      console.error('고객 삭제 실패:', error)
      alert('고객 삭제에 실패했습니다.')
    }
  }

  const handleSaveEdit = async (customerData: any) => {
    if (!customer) return

    try {
      const updatedCustomer = await customerService.updateCustomer(customer.id, customerData)
      setCustomer(updatedCustomer)
      setShowEditForm(false)
      alert('고객 정보가 수정되었습니다.')
    } catch (error) {
      console.error('고객 정보 수정 실패:', error)
      alert('고객 정보 수정에 실패했습니다.')
    }
  }

  const handleCancelEdit = () => {
    setShowEditForm(false)
  }

  if (loading) {
    return (
      <AuthGuard>
        <RoleGuard allowedRoles={['doctor', 'admin']}>
          <div className="min-h-screen bg-gray-50">
            <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner size="lg" text="고객 정보를 불러오는 중..." />
            </div>
          </div>
        </RoleGuard>
      </AuthGuard>
    )
  }

  if (error || !customer) {
    return (
      <AuthGuard>
        <RoleGuard allowedRoles={['doctor', 'admin']}>
          <div className="min-h-screen bg-gray-50">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <p className="text-red-600 text-lg mb-4">{error || '고객 정보를 찾을 수 없습니다.'}</p>
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  고객 목록으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </RoleGuard>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['doctor', 'admin']}>
        <div className="min-h-screen bg-gray-50">
          {showEditForm ? (
            <CustomerForm
              customer={customer}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          ) : (
            <CustomerDetail
              customer={customer}
              onBack={handleBack}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}