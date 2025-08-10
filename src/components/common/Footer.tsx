import React from 'react'
import Link from 'next/link'
import { Activity, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">Obdoc</div>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              비만 관리의 흐름을 설계하다. 대한민국 모든 비만 클리닉과 고객들을 연결하는 필수적인 파트너입니다.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>brandnewmedi@naver.com</span>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">회사 정보</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>상호명: 브랜뉴메디</p>
              <p>대표자명: 최진혁</p>
              <p>사업자등록번호: 534-05-02170</p>
              <p>통신판매업신고번호: 2024-서울은평-0264</p>
              <p>주소: 서울시 은평구 연서로3나길6-13, 2층</p>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">고객지원</h3>
            <div className="space-y-3">
              <Link 
                href="/contact" 
                prefetch={false}
                className="block text-sm text-gray-300 hover:text-blue-400 transition-colors duration-200"
              >
                고객센터
              </Link>
              <Link 
                href="/terms" 
                prefetch={false}
                className="block text-sm text-gray-300 hover:text-blue-400 transition-colors duration-200"
              >
                이용약관
              </Link>
              <Link 
                href="/privacy" 
                prefetch={false}
                className="block text-sm text-gray-300 hover:text-blue-400 transition-colors duration-200"
              >
                개인정보처리방침
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              Copyright © 2025 brandnewmedi. All rights reserved.
            </p>
            <p className="text-sm text-gray-400 mt-2 md:mt-0">
              Made with ❤️ for better healthcare
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}