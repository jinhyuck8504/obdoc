'use client'

import React from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import SystemSettings from '@/components/admin/SystemSettings'

export default function AdminSettingsPage() {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['admin']}>
        <SystemSettings />
      </RoleGuard>
    </AuthGuard>
  )
}