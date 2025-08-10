'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import BackButton from '@/components/common/BackButton'
import { supabase } from '@/lib/supabase'
import { CreditCard, CheckCircle, XCircle, Clock, Shield, BarChart3, Receipt, Users, Settings, LayoutDashboard } from 'lucide-react'
import ModerationDashboard from '@/components/admin/ModerationDashboard'
import AdminStatsDashboard from '@/components/admin/AdminStatsDashboard'
import SubscriptionManager from '@/components/admin/SubscriptionManager'
import TaxInvoiceManager from '@/components/admin/TaxInvoiceManager'
import UserManagement from '@/components/admin/UserManagement'
import SystemSettings from '@/components/admin/SystemSettings'
// TODO: 보안 대시보드 임시 비활성화 (빌드 오류 해결 후 재활성화)
// import SecurityDashboard from '@/components/admin/SecurityDashboard'


interface DoctorSubscription {
  id: string
  hospital_name: string
  hospital_type: string
  subscription_plan: string
  subscription_status: string
  subscription_start: string | null
  subscription_end: string | null
  email: string
  created_at: string
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'moderation' | 'statistics' | 'invoices' | 'users' | 'settings'>('subscriptions')
  const [doctors, setDoctors] = useState<DoctorSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    pendingDoctors: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    fetchDoctors()
    fetchStats()
  }, [])

  const fetchDoctors = async () => {
    // 개발 모드 체크
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy-project')

    try {
      if (isDevelopment && isDummySupabase) {
        // 개발 모드에서는 더미 데이터 사용
        const dummyDoctors = [
          {
            id: 'dummy-1',
            hospital_name: '서울대학교병원',
            hospital_type: '종합병원',
            subscription_plan: '12months',
            subscription_status: 'pending',
            subscription_start: null,
            subscription_end: null,
            created_at: '2024-01-15',
            email: 'doctor1@hospital.com'
          },
          {
            id: 'dummy-2',
            hospital_name: '강남세브란스병원',
            hospital_type: '종합병원',
            subscription_plan: '6months',
            subscription_status: 'active',
            subscription_start: '2024-01-01',
            subscription_end: '2024-07-01',
            created_at: '2024-01-10',
            email: 'doctor2@hospital.com'
          },
          {
            id: 'dummy-3',
            hospital_name: '삼성서울병원',
            hospital_type: '종합병원',
            subscription_plan: '1month',
            subscription_status: 'pending',
            subscription_start: null,
            subscription_end: null,
            created_at: '2024-01-20',
            email: 'doctor3@samsung.com'
          },
          {
            id: 'dummy-4',
            hospital_name: '김내과의원',
            hospital_type: '내과',
            subscription_plan: '6months',
            subscription_status: 'pending',
            subscription_start: null,
            subscription_end: null,
            created_at: '2024-01-18',
            email: 'kim@clinic.com'
          },
          {
            id: 'dummy-5',
            hospital_name: '이가정의학과',
            hospital_type: '가정의학과',
            subscription_plan: '12months',
            subscription_status: 'pending',
            subscription_start: null,
            subscription_end: null,
            created_at: '2024-01-22',
            email: 'lee@family.com'
          }
        ]
        setDoctors(dummyDoctors)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('doctors')
        .select(`
          id,
          hospital_name,
          hospital_type,
          subscription_plan,
          subscription_status,
          subscription_start,
          subscription_end,
          created_at,
          users!inner(email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedData = data?.map((doctor: any) => ({
        ...doctor,
        email: doctor.users?.email || 'N/A'
      })) || []

      setDoctors(formattedData)
    } catch (error) {
      console.error('Error fetching doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    // 개발 모드 체크
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy-project')

    try {
      if (isDevelopment && isDummySupabase) {
        // 개발 모드에서는 더미 통계 데이터 사용 (더미 데이터와 일치)
        setStats({
          totalDoctors: 5,
          activeDoctors: 1,
          pendingDoctors: 4,
          totalRevenue: 12500000
        })
        return
      }

      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('subscription_status')

      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('amount')
        .eq('payment_status', 'paid')

      if (doctorsData) {
        const totalDoctors = doctorsData.length
        const activeDoctors = doctorsData.filter((d: any) => d.subscription_status === 'active').length
        const pendingDoctors = doctorsData.filter((d: any) => d.subscription_status === 'pending').length
        
        const totalRevenue = subscriptionsData?.reduce((sum: number, sub: any) => sum + Number(sub.amount), 0) || 0

        setStats({
          totalDoctors,
          activeDoctors,
          pendingDoctors,
          totalRevenue
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleApproveSubscription = async (doctorId: string, plan: string) => {
    // 개발 모드 체크
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy-project')

    if (isDevelopment && isDummySupabase) {
      // 개발 모드에서 더미 데이터 업데이트
      const startDate = new Date().toISOString().split('T')[0]
      const endDate = new Date()
      
      // 구독 기간 계산
      switch (plan) {
        case '1month':
          endDate.setMonth(endDate.getMonth() + 1)
          break
        case '6months':
          endDate.setMonth(endDate.getMonth() + 6)
          break
        case '12months':
          endDate.setFullYear(endDate.getFullYear() + 1)
          break
      }

      // 더미 데이터에서 해당 의사 찾아서 상태 업데이트
      setDoctors(prev => prev.map(doctor => 
        doctor.id === doctorId 
          ? {
              ...doctor,
              subscription_status: 'active',
              subscription_start: startDate,
              subscription_end: endDate.toISOString().split('T')[0]
            }
          : doctor
      ))

      // 통계도 업데이트
      setStats(prev => ({
        ...prev,
        activeDoctors: prev.activeDoctors + 1,
        pendingDoctors: Math.max(0, prev.pendingDoctors - 1)
      }))

      console.log('개발 모드: 구독 승인 완료', { doctorId, plan })
      alert('구독이 승인되었습니다! (개발 모드)')
      return
    }

    const startDate = new Date().toISOString().split('T')[0]
    const endDate = new Date()
    
    // 구독 기간 계산
    switch (plan) {
      case '1month':
        endDate.setMonth(endDate.getMonth() + 1)
        break
      case '6months':
        endDate.setMonth(endDate.getMonth() + 6)
        break
      case '12months':
        endDate.setFullYear(endDate.getFullYear() + 1)
        break
    }

    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          subscription_status: 'active',
          subscription_start: startDate,
          subscription_end: endDate.toISOString().split('T')[0],
          is_approved: true
        })
        .eq('id', doctorId)

      if (error) throw error

      // 구독 테이블도 업데이트
      await supabase
        .from('subscriptions')
        .update({ payment_status: 'paid' })
        .eq('doctor_id', doctorId)

      alert('구독이 승인되었습니다!')
      fetchDoctors()
      fetchStats()
    } catch (error) {
      console.error('Error approving subscription:', error)
      alert('승인 중 오류가 발생했습니다.')
    }
  }

  const handleRejectSubscription = async (doctorId: string) => {
    // 개발 모드 체크
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy-project')

    if (isDevelopment && isDummySupabase) {
      // 개발 모드에서 더미 데이터 업데이트
      setDoctors(prev => prev.map(doctor => 
        doctor.id === doctorId 
          ? {
              ...doctor,
              subscription_status: 'cancelled'
            }
          : doctor
      ))

      // 통계도 업데이트
      setStats(prev => ({
        ...prev,
        pendingDoctors: Math.max(0, prev.pendingDoctors - 1)
      }))

      console.log('개발 모드: 구독 거절 완료', { doctorId })
      alert('구독이 거절되었습니다! (개발 모드)')
      return
    }

    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          subscription_status: 'cancelled'
        })
        .eq('id', doctorId)

      if (error) throw error

      alert('구독이 거절되었습니다.')
      fetchDoctors()
      fetchStats()
    } catch (error) {
      console.error('Error rejecting subscription:', error)
      alert('거절 중 오류가 발생했습니다.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          활성
        </span>
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          대기
        </span>
      case 'cancelled':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          거절
        </span>
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  // 아이콘 매핑
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    LayoutDashboard
  }

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['admin']}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <BackButton fallbackPath="/" className="mb-2" />
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-gray-600">Obdoc 서비스 전체 관리</p>
          </div>

      {/* 탭 네비게이션 */}
      <div className="grid grid-cols-3 lg:grid-cols-6 bg-gray-100 rounded-lg p-1 mb-4 gap-1">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'subscriptions'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>구독 관리</span>
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'statistics'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>통계</span>
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'invoices'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>세금계산서</span>
        </button>
        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'moderation'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>모더레이션</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'users'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>사용자 관리</span>
        </button>
        {/* TODO: 보안 탭 임시 비활성화 (빌드 오류 해결 후 재활성화)
        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'security'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>보안</span>
        </button>
        */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
            activeTab === 'settings'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>시스템 설정</span>
        </button>

      </div>

      {/* 구독 관리 탭 */}
      {activeTab === 'subscriptions' && (
        <SubscriptionManager />
      )}

      {/* 통계 탭 */}
      {activeTab === 'statistics' && (
        <AdminStatsDashboard />
      )}

      {/* 세금계산서 탭 */}
      {activeTab === 'invoices' && (
        <TaxInvoiceManager />
      )}

      {/* 모더레이션 탭 */}
      {activeTab === 'moderation' && (
        <ModerationDashboard />
      )}

      {/* 사용자 관리 탭 */}
      {activeTab === 'users' && (
        <UserManagement />
      )}

      {/* TODO: 보안 탭 임시 비활성화 (빌드 오류 해결 후 재활성화)
      {activeTab === 'security' && (
        <SecurityDashboard />
      )}
      */}

      {/* 시스템 설정 탭 */}
      {activeTab === 'settings' && (
        <SystemSettings />
      )}


        </div>
      </RoleGuard>
    </AuthGuard>
  )
}