'use client'

import React from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import CustomerDashboard from '@/components/customer/CustomerDashboard'

export default function CustomerDashboardPage() {
  return (
    <AuthGuard requiredRole="customer">
      <CustomerDashboard />
    </AuthGuard>
  )
}