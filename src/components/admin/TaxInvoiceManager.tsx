'use client'
import React from 'react'

export default function TaxInvoiceManager() {
  const handleViewDetail = (invoiceId: string) => {
    alert(`${invoiceId} 상세보기를 클릭했습니다.`)
  }

  const handleViewTaxInvoice = (invoiceId: string) => {
    alert(`${invoiceId} 세금계산서 열람을 클릭했습니다.`)
  }

  const handlePaymentConfirm = (invoiceId: string) => {
    alert(`${invoiceId} 결제확인을 클릭했습니다.`)
  }

  const handleOverdueAlert = (invoiceId: string) => {
    alert(`${invoiceId} 연체 알림을 클릭했습니다.`)
  }

  const handleIssueInvoice = (invoiceId: string) => {
    alert(`${invoiceId} 발행하기를 클릭했습니다.`)
  }

  const handleBillingInfo = (invoiceId: string) => {
    alert(`${invoiceId} 청구정보를 클릭했습니다.`)
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">세금계산서 관리</h2>
          <p className="text-gray-600 mt-1">구독 결제 및 세금계산서 발행 관리</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">총 계산서</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="h-8 w-8 text-blue-200">📄</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">결제완료</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="h-8 w-8 text-green-200">✅</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">총 매출</p>
              <p className="text-2xl font-bold">₩0</p>
            </div>
            <div className="h-8 w-8 text-purple-200">📈</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">연체</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="h-8 w-8 text-red-200">⏰</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            세금계산서 목록 (0건)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">세금계산서가 없습니다</h3>
            <p className="text-sm text-gray-500">구독 결제가 완료되면 세금계산서가 표시됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}