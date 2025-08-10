'use client'

import React from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import CustomerDashboard from '@/components/customer/CustomerDashboard'

export default function PatientDashboardPage() {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['customer', 'admin']}>
        <CustomerDashboard />
      </RoleGuard>
    </AuthGuard>
  )
}