'use client'

import React, { useState } from 'react'
import Link from 'next/link'
// Removed lucide-react dependency - using emoji icons instead
import { useAuth } from '@/contexts/AuthContext'
import { getNavigationItems, UserRole } from '@/lib/roleUtils'
import Logo from './Logo'
import ClientOnly from '@/components/hydration/ClientOnly'
import UserAvatar from './UserAvatar'

export default function Header() {
  const { user, signOut, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 역할별 네비게이션 아이템
  let navigationItems = user ? getNavigationItems(user.role as UserRole) : []
  
  // 관리자의 경우 사용자 관리, 시스템 설정 메뉴 제거
  if (user?.role === 'admin') {
    navigationItems = navigationItems.filter(item => 
      !item.name.includes('사용자 관리') && 
      !item.name.includes('시스템 설정') &&
      !item.name.includes('User Management') &&
      !item.name.includes('System Settings')
    )
    console.log('Filtered admin navigation items:', navigationItems)
  }
  
  // 아이콘 매핑 (이모지로 대체)
  const iconMap: { [key: string]: string } = {
    LayoutDashboard: '📊',
    Users: '👥',
    Calendar: '📅',
    MessageCircle: '💬',
    Activity: '📈',
    Settings: '⚙️',
    User: '👤'
  }

  const handleLogout = async () => {
    await signOut()
    setMobileMenuOpen(false)
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'doctor': return '의사(한의사)'
      case 'customer': return '고객'
      case 'admin': return '관리자'
      default: return '사용자'
    }
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center" onClick={closeMobileMenu}>
            <Logo size="md" showText={true} showSlogan={true} />
          </div>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-8">
              {/* 대시보드 홈 링크 */}
              <Link
                href={getNavigationItems(user.role as UserRole).length > 0 ? 
                  (user.role === 'doctor' ? '/dashboard/doctor' : 
                   user.role === 'customer' ? '/dashboard/customer' : 
                   user.role === 'admin' ? '/dashboard/admin' : '/dashboard') : '/dashboard'}
                prefetch={false}
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium flex items-center"
              >
                <span className="mr-2">📊</span>
                대시보드
              </Link>
              
              {/* 전역 네비게이션 메뉴 */}
              {navigationItems.map((item) => {
                const iconEmoji = iconMap[item.icon] || '👤'
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium flex items-center"
                  >
                    <span className="mr-2">{iconEmoji}</span>
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user && !loading ? (
              <>
                <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center space-x-2">
                  <UserAvatar name={user.name || user.email} size="sm" />
                  <div className="text-sm">
                    <div className="text-gray-700 font-medium">{user.name || user.email}님</div>
                    <div className="text-xs text-gray-500">{getRoleDisplayName(user.role)}</div>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-red-50"
                >
                  <span>🚪</span>
                  <span>로그아웃</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  로그인
                </Link>
                <Link 
                  href="/signup"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2"
            >
              {mobileMenuOpen ? (
                <span className="text-xl">❌</span>
              ) : (
                <span className="text-xl">☰</span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <ClientOnly fallback={null}>
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  {/* User info */}
                  <div className="px-3 py-2 bg-gray-50 rounded-md mb-3 flex items-center space-x-2">
                    <UserAvatar name={user.name || user.email} size="sm" />
                    <div className="text-sm">
                      <div className="text-gray-700 font-medium">{user.name || user.email}님</div>
                      <div className="text-xs text-gray-500">{getRoleDisplayName(user.role)}</div>
                    </div>
                  </div>
                  
                  {/* 대시보드 홈 링크 */}
                  <Link
                    href={user.role === 'doctor' ? '/dashboard/doctor' : 
                          user.role === 'customer' ? '/dashboard/customer' : 
                          user.role === 'admin' ? '/dashboard/admin' : '/dashboard'}
                    prefetch={false}
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md font-medium flex items-center"
                    onClick={closeMobileMenu}
                  >
                    <span className="mr-2">📊</span>
                    대시보드
                  </Link>
                  
                  {/* 전역 네비게이션 메뉴 */}
                  {navigationItems.map((item) => {
                    const iconEmoji = iconMap[item.icon] || '👤'
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={false}
                        className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md font-medium flex items-center"
                        onClick={closeMobileMenu}
                      >
                        <span className="mr-2">{iconEmoji}</span>
                        {item.name}
                      </Link>
                    )
                  })}
                  
                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md font-medium flex items-center space-x-2"
                  >
                    <span>🚪</span>
                    <span>로그아웃</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md font-medium"
                    onClick={closeMobileMenu}
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 rounded-md font-medium text-center transition-all duration-200"
                    onClick={closeMobileMenu}
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
          )}
        </ClientOnly>
      </div>
    </header>
  )
}