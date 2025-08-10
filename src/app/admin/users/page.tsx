'use client'

import React from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import UserManagement from '@/components/admin/UserManagement'

export default function AdminUsersPage() {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['admin']}>
        <UserManagement />
      </RoleGuard>
    </AuthGuard>
  )
}