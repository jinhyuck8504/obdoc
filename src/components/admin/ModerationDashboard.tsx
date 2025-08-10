'use client'

import React, { useState, useEffect } from 'react'
import { Shield, Flag, AlertTriangle, CheckCircle, XCircle, Clock, Eye, MessageSquare, User, Calendar } from 'lucide-react'
import { Report } from '@/types/moderation'
import { moderationService } from '@/lib/moderationService'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function ModerationDashboard() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()
  }, [selectedStatus])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const data = await moderationService.getReports(selectedStatus)
      setReports(data)
    } catch (error) {
      console.error('신고 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessReport = async (
    reportId: string,
    action: 'dismiss' | 'warn_user' | 'remove_content' | 'suspend_user',
    notes?: string
  ) => {
    try {
      setProcessing(reportId)
      const updatedReport = await moderationService.processReport(
        reportId,
        'admin-1', // 실제로는 현재 관리자 ID
        '관리자', // 실제로는 현재 관리자 이름
        action,
        notes
      )
      
      setReports(prev => prev.map(report => 
        report.id === reportId ? updatedReport : report
      ))
      
      if (selectedReport?.id === reportId) {
        setSelectedReport(updatedReport)
      }
      
      alert('신고가 처리되었습니다.')
    } catch (error) {
      console.error('신고 처리 실패:', error)
      alert('신고 처리에 실패했습니다.')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'reviewing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'dismissed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '대기중'
      case 'reviewing':
        return '검토중'
      case 'resolved':
        return '처리완료'
      case 'dismissed':
        return '기각됨'
      default:
        return '알 수 없음'
    }
  }

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'spam':
        return 'bg-red-100 text-red-800'
      case 'inappropriate':
        return 'bg-orange-100 text-orange-800'
      case 'harassment':
        return 'bg-purple-100 text-purple-800'
      case 'misinformation':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'spam':
        return '스팸/광고'
      case 'inappropriate':
        return '부적절한 내용'
      case 'harassment':
        return '괴롭힘/혐오'
      case 'misinformation':
        return '잘못된 정보'
      case 'other':
        return '기타'
      default:
        return '알 수 없음'
    }
  }

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    resolved: reports.filter(r => r.status === 'resolved').length
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner size="lg" text="신고 목록을 불러오는 중..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">모더레이션 대시보드</h1>
            <p className="text-gray-600">커뮤니티 신고 및 콘텐츠 관리</p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">전체 신고</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <Flag className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">대기중</p>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">검토중</p>
              <p className="text-3xl font-bold">{stats.reviewed}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">처리완료</p>
              <p className="text-3xl font-bold">{stats.resolved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">상태 필터:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="pending">대기중</option>
            <option value="reviewing">검토중</option>
            <option value="resolved">처리완료</option>
            <option value="dismissed">기각됨</option>
          </select>
        </div>
      </div>

      {/* 신고 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <Flag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">신고가 없습니다</h3>
            <p className="text-gray-600">
              {selectedStatus === 'all' ? '아직 신고된 콘텐츠가 없습니다' : `${getStatusText(selectedStatus)} 상태의 신고가 없습니다`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* 신고 헤더 */}
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(report.status)}`}>
                        {getStatusText(report.status)}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getReasonColor(report.reason)}`}>
                        {getReasonText(report.reason)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {report.targetType === 'post' ? '게시글' : '댓글'}
                      </span>
                    </div>

                    {/* 신고 내용 */}
                    <div className="mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          신고자: {report.reporterName}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-600">
                          대상: {report.targetAuthorId}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg mb-2">
                        <p className="text-sm text-gray-800 line-clamp-3">
                          {report.targetContent}
                        </p>
                      </div>

                      {report.description && (
                        <div className="text-sm text-gray-600">
                          <strong>신고 사유:</strong> {report.description}
                        </div>
                      )}
                    </div>

                    {/* 처리 정보 */}
                    {report.status === 'resolved' && report.reviewerName && (
                      <div className="bg-green-50 p-3 rounded-lg mb-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            처리 완료 - {report.reviewerName}
                          </span>
                        </div>
                        {report.reviewNote && (
                          <p className="text-sm text-green-700">{report.reviewNote}</p>
                        )}
                        {report.action && (
                          <p className="text-xs text-green-600 mt-1">
                            조치: {report.action === 'none' ? '조치 없음' :
                                  report.action === 'warning' ? '사용자 경고' :
                                  report.action === 'content_removed' ? '콘텐츠 삭제' :
                                  report.action === 'user_suspended' ? '사용자 정지' : '알 수 없음'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 날짜 정보 */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>신고일: {new Date(report.createdAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                      {report.reviewedAt && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>처리일: {new Date(report.reviewedAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="ml-6 flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="상세 보기"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleProcessReport(report.id, 'dismiss', '검토 결과 문제없음')}
                          disabled={processing === report.id}
                          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50"
                        >
                          기각
                        </button>
                        <button
                          onClick={() => handleProcessReport(report.id, 'remove_content', '부적절한 콘텐츠로 판단하여 삭제')}
                          disabled={processing === report.id}
                          className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onProcess={handleProcessReport}
          processing={processing === selectedReport.id}
        />
      )}
    </div>
  )
}

// 신고 상세 모달 컴포넌트
interface ReportDetailModalProps {
  report: Report
  onClose: () => void
  onProcess: (reportId: string, action: 'dismiss' | 'warn_user' | 'remove_content' | 'suspend_user', notes?: string) => void
  processing: boolean
}

function ReportDetailModal({ report, onClose, onProcess, processing }: ReportDetailModalProps) {
  const [action, setAction] = useState<'dismiss' | 'warn_user' | 'remove_content' | 'suspend_user'>('dismiss')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onProcess(report.id, action, notes)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">신고 상세 정보</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* 신고 정보 */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">신고 정보</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div><strong>신고자:</strong> {report.reporterName}</div>
              <div><strong>대상 작성자:</strong> {report.targetAuthorName}</div>
              <div><strong>신고 사유:</strong> {report.reason}</div>
              <div><strong>신고 내용:</strong> {report.description || '없음'}</div>
              <div><strong>신고일:</strong> {new Date(report.createdAt).toLocaleString('ko-KR')}</div>
            </div>
          </div>

          {/* 신고된 콘텐츠 */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">신고된 콘텐츠</h3>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-gray-800">{report.targetContent}</p>
            </div>
          </div>

          {/* 처리 폼 */}
          {report.status === 'pending' && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  처리 방법
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dismiss">기각 (문제없음)</option>
                  <option value="warn_user">사용자 경고</option>
                  <option value="remove_content">콘텐츠 삭제</option>
                  <option value="suspend_user">사용자 정지</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  처리 메모
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="처리 사유나 추가 메모를 입력하세요..."
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  {processing ? '처리 중...' : '처리하기'}
                </button>
              </div>
            </form>
          )}

          {/* 처리 완료된 경우 */}
          {report.status === 'resolved' && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">처리 완료</span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <div><strong>처리자:</strong> {report.reviewerName}</div>
                <div><strong>처리일:</strong> {report.reviewedAt && new Date(report.reviewedAt).toLocaleString('ko-KR')}</div>
                <div><strong>조치:</strong> {report.action}</div>
                {report.reviewNote && <div><strong>메모:</strong> {report.reviewNote}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}