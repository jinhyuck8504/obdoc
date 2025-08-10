'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const { user } = useAuth()

  const getDashboardLink = () => {
    if (!user) return '/login'
    
    switch (user.role) {
      case 'doctor':
        return '/dashboard/doctor'
      case 'customer':
        return '/dashboard/customer'
      case 'admin':
        return '/admin.html'
      default:
        return '/login'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Shield className="h-16 w-16 text-red-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          접근 권한이 없습니다
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          이 페이지에 접근할 권한이 없습니다.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              {user ? (
                <>
                  현재 로그인된 계정: <span className="font-medium">{user.email}</span><br />
                  역할: <span className="font-medium">
                    {user.role === 'doctor' ? '의사(한의사)' : 
                     user.role === 'customer' ? '고객' : 
                     user.role === 'admin' ? '관리자' : '알 수 없음'}
                  </span>
                </>
              ) : (
                '로그인이 필요합니다.'
              )}
            </p>
            
            <div className="space-y-4">
              <Link
                href={getDashboardLink()}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {user ? '내 대시보드로 돌아가기' : '로그인하기'}
              </Link>
              
              {user && (
                <Link
                  href="/"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  메인 페이지로 이동
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}