'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, User, LogOut } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo size="md" showText={true} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-gray-700 hover:text-slate-800 font-medium transition-colors"
                >
                  대시보드
                </Link>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>로그아웃</span>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-slate-800 font-medium transition-colors"
                >
                  로그인
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    회원가입
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 rounded-md p-2"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              {user ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="text-gray-700 hover:text-slate-800 font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    대시보드
                  </Link>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 py-2">
                    <User className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 w-fit"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>로그아웃</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-gray-700 hover:text-slate-800 font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    로그인
                  </Link>
                  <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" className="w-fit">
                      회원가입
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header