'use client'
import React from 'react'
import Link from 'next/link'
import Logo from './Logo'

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <Logo size="md" showText={true} showSlogan={true} />
            <p className="mt-4 text-gray-600 text-sm leading-relaxed">
              브랜뉴메디는 대한민국 모든 비만 클리닉과 고객들을 연결하는 필수적인 파트너로서,
              지속적인 관리와 동기부여를 통해 목표 달성률을 높입니다.
            </p>
            <div className="mt-6 text-sm text-gray-500">
              <p>Copyright © 2025 BRANDNEWMEDI. All rights reserved.</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              서비스
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/signup" className="text-gray-600 hover:text-slate-800 text-sm transition-colors">
                  원장님 가입
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-600 hover:text-slate-800 text-sm transition-colors">
                  로그인
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-600 hover:text-slate-800 text-sm transition-colors">
                  대시보드
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              법적 고지
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-slate-800 text-sm transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-slate-800 text-sm transition-colors">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-slate-800 text-sm transition-colors">
                  문의하기
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500">
              <p>상호명: 브랜뉴메디 | 대표자명: 최진혁</p>
              <p className="mt-1">사업자등록번호: 534-05-02170 | 통신판매업신고번호: 2024-서울은평-0264</p>
            </div>
            <div className="mt-4 md:mt-0 text-sm text-gray-500">
              <p>문의: brandnewmedi@naver.com</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer