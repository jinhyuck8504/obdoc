'use client'
import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  CreditCard,
  MapPin,
  FileText,
  Edit,
  Save,
  X,
  Check,
  AlertTriangle
} from 'lucide-react'
import { BillingInfo } from '@/types/invoice'
import { invoiceService } from '@/lib/invoiceService'

interface BillingInfoManagerProps {
  doctorId: string
  onClose: () => void
}

export default function BillingInfoManager({ doctorId, onClose }: BillingInfoManagerProps) {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<BillingInfo>>({})

  useEffect(() => {
    loadBillingInfo()
  }, [doctorId])

  const loadBillingInfo = async () => {
    try {
      setLoading(true)
      const data = await invoiceService.getBillingInfo(doctorId)
      setBillingInfo(data)
      if (data) {
        setFormData(data)
      } else {
        // 새로운 청구 정보 생성을 위한 기본값
        setFormData({
          doctorId,
          businessNumber: '',
          businessName: '',
          businessAddress: '',
          businessType: '의료업',
          businessCategory: '',
          representativeName: '',
          contactPerson: '',
          contactPhone: '',
          contactEmail: '',
          taxInvoiceEmail: '',
          taxInvoiceMethod: 'email',
          bankName: '',
          accountNumber: '',
          accountHolder: ''
        })
        setEditing(true)
      }
    } catch (error) {
      console.error('청구 정보 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // 실제 구현에서는 청구 정보 저장 API 호출
      console.log('청구 정보 저장:', formData)
      
      // 더미 데이터로 업데이트
      const updatedInfo: BillingInfo = {
        ...formData as BillingInfo,
        id: billingInfo?.id || `billing-${Date.now()}`,
        createdAt: billingInfo?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setBillingInfo(updatedInfo)
      setEditing(false)
      alert('청구 정보가 저장되었습니다.')
    } catch (error) {
      console.error('청구 정보 저장 실패:', error)
      alert('저장에 실패했습니다.')
    }
  }

  const handleCancel = () => {
    if (billingInfo) {
      setFormData(billingInfo)
      setEditing(false)
    } else {
      onClose()
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>청구 정보를 불러오는 중...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {billingInfo ? '청구 정보 관리' : '청구 정보 등록'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {!editing && billingInfo && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>수정</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 사업자 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <Building2 className="w-4 h-4 mr-2" />
              사업자 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사업자등록번호 <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.businessNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessNumber: e.target.value }))}
                    placeholder="000-00-00000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{billingInfo?.businessNumber || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상호명 <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.businessName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="병원/의원명"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{billingInfo?.businessName || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업종 <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <select
                    value={formData.businessType || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="의료업">의료업</option>
                    <option value="의료법인">의료법인</option>
                    <option value="개인사업자">개인사업자</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-900 py-2">{billingInfo?.businessType || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업태 <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.businessCategory || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessCategory: e.target.value }))}
                    placeholder="내과, 외과, 종합병원 등"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{billingInfo?.businessCategory || '-'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사업장 주소 <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.businessAddress || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessAddress: e.target.value }))}
                    placeholder="사업장 주소를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{billingInfo?.businessAddress || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  대표자명 <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.representativeName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, representativeName: e.target.value }))}
                    placeholder="대표자 성명"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{billingInfo?.representativeName || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* 담당자 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-4 h-4 mr-2" />
              담당자 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  담당자명 <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="담당자 성명"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{billingInfo?.contactPerson || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처 <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.contactPhone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="010-0000-0000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{billingInfo?.contactPhone || '-'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="contact@hospital.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{billingInfo?.contactEmail || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* 세금계산서 발행 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              세금계산서 발행 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  세금계산서 수신 이메일 <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.taxInvoiceEmail || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxInvoiceEmail: e.target.value }))}
                    placeholder="invoice@hospital.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{billingInfo?.taxInvoiceEmail || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  발행 방법 <span className="text-red-500">*</span>
                </label>
                {editing ? (
                  <select
                    value={formData.taxInvoiceMethod || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxInvoiceMethod: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="email">이메일</option>
                    <option value="post">우편</option>
                    <option value="fax">팩스</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-900 py-2">
                    {billingInfo?.taxInvoiceMethod === 'email' ? '이메일' :
                     billingInfo?.taxInvoiceMethod === 'post' ? '우편' :
                     billingInfo?.taxInvoiceMethod === 'fax' ? '팩스' : '-'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 환불 계좌 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              환불 계좌 정보 (선택사항)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">은행명</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.bankName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="국민은행"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{billingInfo?.bankName || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">계좌번호</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.accountNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="123456-78-901234"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{billingInfo?.accountNumber || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">예금주</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.accountHolder || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountHolder: e.target.value }))}
                    placeholder="홍길동"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">{billingInfo?.accountHolder || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* 주의사항 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">주의사항</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>사업자등록번호는 정확히 입력해주세요. 잘못된 정보로 인한 세금계산서 발행 오류는 고객 책임입니다.</li>
                  <li>세금계산서 수신 이메일은 정기적으로 확인 가능한 주소로 설정해주세요.</li>
                  <li>환불 계좌 정보는 구독 취소 시 환불 처리에 사용됩니다.</li>
                  <li>정보 변경 시 즉시 업데이트해주시기 바랍니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {editing ? '취소' : '닫기'}
          </button>
          {editing && (
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>저장</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}