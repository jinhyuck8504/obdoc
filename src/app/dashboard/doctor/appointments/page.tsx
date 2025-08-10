'use client'

import React from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import AppointmentManagement from '@/components/appointment/AppointmentManagement'

export default function DoctorAppointmentsPage() {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['doctor', 'admin']}>
        <div className="min-h-screen bg-gray-50">
          <AppointmentManagement />
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}