import React from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import AutoRedirect from '@/components/auth/AutoRedirect'

export default function DashboardPage() {
  return (
    <AuthGuard>
      <AutoRedirect redirectTo="dashboard" />
    </AuthGuard>
  )
}