'use client'

import React from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import CustomerManagement from '@/components/customer/CustomerManagement'

export default function DoctorPatientsPage() {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['doctor', 'admin']}>
        <div className="min-h-screen bg-gray-50">
          <CustomerManagement />
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}