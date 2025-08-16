'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { AuditLogger } from '@/lib/security'
import { usePagination } from '@/components/common/Pagination'
import Pagination from '@/components/common/Pagination'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  Info, 
  Clock,
  User,
  Activity,
  Eye,
  RefreshCw
} from 'lucide-react'

interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  details: any
  ipAddress: string
  userAgent: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface AuditLogFilters {
  userId: string
  action: string
  severity: string
  startDate: string
  endDate: string
  search: string
}

export default function AuditLogDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<AuditLogFilters>({
    userId: '',
    action: '',
    severity: '',
    startDate: '',
    endDate: '',
    search: ''
  })
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  // 로그 데이터 로드
  const loadLogs = React.useCallback(async () => {
    setLoading(true)
    try {
      // 실제 환경에서는 API 호출
      const auditLogs = AuditLogger.getLogs(filters)
      setLogs(auditLogs)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // 필터링된 로그
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        return (
          log.userId.toLowerCase().includes(searchTerm) ||
          log.action.toLowerCase().includes(searchTerm) ||
          log.resource.toLowerCase().includes(searchTerm) ||
          JSON.stringify(log.details).toLowerCase().includes(searchTerm)
        )
      }
      return true
    })
  }, [logs, filters.search])

  // 페이지네이션
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    getPageData
  } = usePagination(filteredLogs.length, 20)

  const currentPageLogs = getPageData(filteredLogs)

  // 초기 로드
  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(loadLogs, 30000) // 30초마다
    return () => clearInterval(interval)
  }, [autoRefresh, loadLogs])

  // 필터 변경 핸들러
  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      userId: '',
      action: '',
      severity: '',
      startDate: '',
      endDate: '',
      search: ''
    })
  }

  // CSV 내보내기
  const exportToCSV = () => {
    const headers = ['시간', '사용자ID', '작업', '리소스', '심각도', 'IP주소', '상세정보']
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.userId,
        log.action,
        log.resource,
        log.severity,
        log.ipAddress,
        JSON.stringify(log.details).replace(/,/g, ';')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // 심각도 색상
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // 심각도 아이콘
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />
      case 'medium':
        return <Info className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  // 통계 계산
  const stats = useMemo(() => {
    const total = filteredLogs.length
    const severityCounts = filteredLogs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const recentLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length

    return {
      total,
      critical: severityCounts.critical || 0,
      high: severityCounts.high || 0,
      medium: severityCounts.medium || 0,
      low: severityCounts.low || 0,
      recent24h: recentLogs
    }
  }, [filteredLogs])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            감사 로그
          </h1>
          <p className="text-sm text-gray-600">
            시스템 보안 이벤트 및 사용자 활동 로그
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 text-green-700' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
            자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
          >
            <Download className="w-4 h-4 mr-1" />
            CSV 내보내기
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">전체 로그</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          <div className="text-sm text-gray-600">심각</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
          <div className="text-sm text-gray-600">높음</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
          <div className="text-sm text-gray-600">보통</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.low}</div>
          <div className="text-sm text-gray-600">낮음</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.recent24h}</div>
          <div className="text-sm text-gray-600">최근 24시간</div>
        </Card>
      </div>

      {/* 필터 */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            필터
          </h3>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            필터 초기화
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="검색..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Input
            type="text"
            placeholder="사용자 ID"
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
          />
          
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 작업</option>
            <option value="login">로그인</option>
            <option value="logout">로그아웃</option>
            <option value="create">생성</option>
            <option value="update">수정</option>
            <option value="delete">삭제</option>
            <option value="view">조회</option>
          </select>
          
          <select
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 심각도</option>
            <option value="critical">심각</option>
            <option value="high">높음</option>
            <option value="medium">보통</option>
            <option value="low">낮음</option>
          </select>
          
          <Input
            type="date"
            placeholder="시작일"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
          
          <Input
            type="date"
            placeholder="종료일"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
      </Card>

      {/* 로그 테이블 */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">시간</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">사용자</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">작업</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">리소스</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">심각도</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">IP 주소</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    로딩 중...
                  </td>
                </tr>
              ) : currentPageLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    로그가 없습니다.
                  </td>
                </tr>
              ) : (
                currentPageLogs.map(log => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(log.timestamp).toLocaleString('ko-KR')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        {log.userId}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {log.resource}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                        {getSeverityIcon(log.severity)}
                        <span className="ml-1">{log.severity}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredLogs.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}
      </Card>

      {/* 로그 상세 모달 */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                로그 상세 정보
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                닫기
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">시간</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {new Date(selectedLog.timestamp).toLocaleString('ko-KR')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">사용자 ID</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedLog.userId}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">작업</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedLog.action}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">리소스</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedLog.resource}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">심각도</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedLog.severity)}`}>
                      {getSeverityIcon(selectedLog.severity)}
                      <span className="ml-1">{selectedLog.severity}</span>
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">IP 주소</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedLog.ipAddress}</div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">User Agent</label>
                <div className="mt-1 text-sm text-gray-900 break-all">
                  {selectedLog.userAgent}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">상세 정보</label>
                <div className="mt-1 bg-gray-50 rounded-lg p-3">
                  <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}