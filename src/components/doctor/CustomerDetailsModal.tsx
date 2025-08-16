/**
 * 고객 상세 정보 모달
 * 개인정보 보호를 준수하며 고객의 상세 정보를 표시합니다.
 */
'use client'

import React, { useState, useEffect } from 'react'
import { customerManagementService } from '@/lib/customerManagementService'
import { useAuth } from '@/contexts/AuthContext'
import {
  CustomerInfo,
  CustomerDetailsResponse,
  CustomerActivityLog,
  FlaggedActivity,
  CustomerNote
} from '@/types/customerManagement'

interface CustomerDetailsModalProps {
  customer: CustomerInfo | null
  isOpen: boolean
  onClose: () => void
}

export default function CustomerDetailsModal({
  customer,
  isOpen,
  onClose
}: CustomerDetailsModalProps) {
  const { user } = useAuth()
  const [customerDetails, setCustomerDetails] = useState<CustomerDetailsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'activity' | 'flags' | 'notes'>('info')
  const [newNote, setNewNote] = useState('')
  const [noteType, setNoteType] = useState<CustomerNote['type']>('general')
  const [isAddingNote, setIsAddingNote] = useState(false)

  useEffect(() => {
    if (isOpen && customer && user?.id) {
      loadCustomerDetails()
    }
  }, [isOpen, customer, user?.id])

  const loadCustomerDetails = async () => {
    if (!customer || !user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const details = await customerManagementService.getCustomerDetails(
        customer.id,
        user.id
      )
      setCustomerDetails(details)
    } catch (err) {
      console.error('고객 상세 정보 로드 실패:', err)
      setError(err instanceof Error ? err.message : '정보를 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!customer || !user?.id || !newNote.trim()) return

    setIsAddingNote(true)
    try {
      await customerManagementService.addCustomerNote(
        customer.id,
        user.id,
        {
          content: newNote.trim(),
          type: noteType,
          isPrivate: false
        }
      )
      
      setNewNote('')
      await loadCustomerDetails() // 새로고침
    } catch (err) {
      console.error('노트 추가 실패:', err)
      setError(err instanceof Error ? err.message : '노트 추가에 실패했습니다.')
    } finally {
      setIsAddingNote(false)
    }
  }

  const handleStatusChange = async (newStatus: CustomerInfo['status']) => {
    if (!customer || !user?.id) return

    try {
      await customerManagementService.updateCustomerStatus(
        customer.id,
        user.id,
        newStatus,
        `상태를 ${newStatus}로 변경`
      )
      
      await loadCustomerDetails() // 새로고침
    } catch (err) {
      console.error('상태 변경 실패:', err)
      setError(err instanceof Error ? err.message : '상태 변경에 실패했습니다.')
    }
  }  co
nst formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSeverityColor = (severity: FlaggedActivity['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: CustomerInfo['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-gray-600 bg-gray-100'
      case 'suspended': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusLabel = (status: CustomerInfo['status']) => {
    switch (status) {
      case 'active': return '활성'
      case 'inactive': return '비활성'
      case 'suspended': return '정지'
      default: return '알 수 없음'
    }
  }

  if (!isOpen || !customer) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {customer.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{customer.name}</h2>
              <p className="text-gray-600">{customer.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(customer.status)}`}>
              {getStatusLabel(customer.status)}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="닫기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'info', name: '기본 정보', icon: '👤' },
              { id: 'activity', name: '활동 내역', icon: '📋' },
              { id: 'flags', name: '플래그', icon: '🚩' },
              { id: 'notes', name: '노트', icon: '📝' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>  
      {/* 탭 컨텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : customerDetails ? (
            <>
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* 기본 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">개인 정보</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">이름:</span>
                          <span className="font-medium">{customerDetails.customer.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">이메일:</span>
                          <span className="font-medium">{customerDetails.customer.email}</span>
                        </div>
                        {customerDetails.customer.phoneNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">전화번호:</span>
                            <span className="font-medium">{customerDetails.customer.phoneNumber}</span>
                          </div>
                        )}
                        {customerDetails.customer.dateOfBirth && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">생년월일:</span>
                            <span className="font-medium">{customerDetails.customer.dateOfBirth}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">가입 정보</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">가입일:</span>
                          <span className="font-medium">{formatDate(customerDetails.customer.joinedAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">가입 코드:</span>
                          <span className="font-medium font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {customerDetails.customer.inviteCode}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">담당 의사:</span>
                          <span className="font-medium">{customerDetails.customer.doctorName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">최근 활동:</span>
                          <span className="font-medium">
                            {customerDetails.customer.lastActiveAt 
                              ? formatDate(customerDetails.customer.lastActiveAt)
                              : '없음'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 서비스 이용 현황 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">서비스 이용 현황</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {customerDetails.customer.totalAppointments}
                        </div>
                        <div className="text-sm text-blue-800">총 예약 수</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {customerDetails.customer.completedAppointments}
                        </div>
                        <div className="text-sm text-green-800">완료된 예약</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {customerDetails.customer.cancelledAppointments}
                        </div>
                        <div className="text-sm text-red-800">취소된 예약</div>
                      </div>
                    </div>
                  </div>

                  {/* 상태 변경 */}
                  {customerDetails.permissions.canSuspendCustomers && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">상태 관리</h4>
                      <div className="flex space-x-2">
                        {(['active', 'inactive', 'suspended'] as const).map(status => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            disabled={customerDetails.customer.status === status}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              customerDetails.customer.status === status
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {getStatusLabel(status)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )} 
             {activeTab === 'activity' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">활동 내역</h4>
                  {customerDetails.activityLog.length > 0 ? (
                    <div className="space-y-3">
                      {customerDetails.activityLog.map(log => (
                        <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{log.action}</span>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(log.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">활동 내역이 없습니다.</p>
                  )}
                </div>
              )}

              {activeTab === 'flags' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">플래그된 활동</h4>
                    {customerDetails.permissions.canFlagActivities && (
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        새 플래그 추가
                      </button>
                    )}
                  </div>
                  
                  {customerDetails.customer.flaggedActivities.length > 0 ? (
                    <div className="space-y-3">
                      {customerDetails.customer.flaggedActivities.map(flag => (
                        <div key={flag.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(flag.severity)}`}>
                                  {flag.severity.toUpperCase()}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {formatDateTime(flag.detectedAt)}
                                </span>
                              </div>
                              <p className="font-medium text-gray-900">{flag.type}</p>
                              <p className="text-sm text-gray-700 mt-1">{flag.description}</p>
                            </div>
                            {customerDetails.permissions.canResolveFlags && flag.status === 'pending' && (
                              <button className="text-sm text-green-600 hover:text-green-800">
                                해결 완료
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">플래그된 활동이 없습니다.</p>
                  )}
                </div>
              )} 
             {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">노트</h4>
                  </div>

                  {/* 노트 추가 폼 */}
                  {customerDetails.permissions.canAddNotes && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-3">
                        <div className="flex space-x-3">
                          <select
                            value={noteType}
                            onChange={(e) => setNoteType(e.target.value as CustomerNote['type'])}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="general">일반</option>
                            <option value="administrative">관리</option>
                            {customerDetails.permissions.canViewMedicalNotes && (
                              <option value="medical">의료</option>
                            )}
                            <option value="security">보안</option>
                          </select>
                        </div>
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="노트를 입력하세요..."
                          className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={handleAddNote}
                            disabled={!newNote.trim() || isAddingNote}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isAddingNote ? '추가 중...' : '노트 추가'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 기존 노트 목록 */}
                  {customerDetails.customer.notes.length > 0 ? (
                    <div className="space-y-3">
                      {customerDetails.customer.notes.map(note => (
                        <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                note.type === 'medical' ? 'bg-red-100 text-red-800' :
                                note.type === 'security' ? 'bg-orange-100 text-orange-800' :
                                note.type === 'administrative' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {note.type}
                              </span>
                              {note.isPrivate && (
                                <span className="text-xs text-gray-500">🔒 비공개</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(note.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{note.content}</p>
                          <p className="text-xs text-gray-500">작성자: {note.doctorName}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">작성된 노트가 없습니다.</p>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )

  function getStatusLabel(status: CustomerInfo['status']) {
    switch (status) {
      case 'active': return '활성'
      case 'inactive': return '비활성'
      case 'suspended': return '정지'
      default: return '알 수 없음'
    }
  }
}