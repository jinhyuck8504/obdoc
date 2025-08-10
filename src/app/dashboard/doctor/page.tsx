'use client'

import React from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import DoctorDashboard from '@/components/dashboard/DoctorDashboard'

export default function DoctorDashboardPage() {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['doctor', 'admin']}>
        <DoctorDashboard />
      </RoleGuard>
    </AuthGuard>
  )
}