/**
 * 보안 스캔 대시보드 컴포넌트
 * 관리자용 보안 취약점 스캔 및 결과 관리
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { SecurityScanReport, VulnerabilityResult, VulnerabilityTest } from '@/lib/security/vulnerabilityScanner'

interface SecurityScanDashboardProps {
  className?: string
}

export default function SecurityScanDashboard({ className = '' }: SecurityScanDashboardProps) {
  const { user } = useAuth()
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [latestScan, setLatestScan] = useState<SecurityScanReport | null>(null)
  const [availableTests, setAvailableTests] = useState<VulnerabilityTest[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [selectedScan, setSelectedScan] = useState<SecurityScanReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role === 'admin') {
      loadScanData()
    }
  }, [user])

  const loadScanData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = await user?.getIdToken()
      if (!token) throw new Error('인증 토큰이 없습니다')

      // 스캔 기록 조회
      const historyResponse = await fetch('/api/admin/security/vulnerability-scan', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!historyResponse.ok) {
        throw new Error('스캔 기록 조회 실패')
      }

      const historyData = await historyResponse.json()
      setScanHistory(historyData.scanHistory || [])

      // 최신 스캔 결과 조회
      const latestResponse = await fetch('/api/admin/security/vulnerability-scan?latest=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (latestResponse.ok) {
        const latestData = await latestResponse.json()
        setLatestScan(latestData.scanReport)
      }

    } catch (err) {
      console.error('스캔 데이터 로드 실패:', err)
      setError(err instanceof Error ? err.message : '데이터를 불러올 수 없습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const runFullScan = async () => {
    setIsScanning(true)
    setError(null)

    try {
      const token = await user?.getIdToken()
      if (!token) throw new Error('인증 토큰이 없습니다')

      const response = await fetch('/api/admin/security/vulnerability-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullScan: true })
      })

      if (!response.ok) {
        throw new Error('보안 스캔 실행 실패')
      }

      const data = await response.json()
      setLatestScan(data.scanReport)
      
      // 스캔 기록 새로고침
      await loadScanData()

    } catch (err) {
      console.error('보안 스캔 실행 실패:', err)
      setError(err instanceof Error ? err.message : '보안 스캔 실행에 실패했습니다')
    } finally {
      setIsScanning(false)
    }
  }

  const runSpecificTest = async (testId: string) => {
    try {
      const token = await user?.getIdToken()
      if (!token) throw new Error('인증 토큰이 없습니다')

      const response = await fetch('/api/admin/security/vulnerability-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ testId, fullScan: false })
      })

      if (!response.ok) {
        throw new Error('테스트 실행 실패')
      }

      const data = await response.json()
      console.log('테스트 결과:', data.result)
      
      // 최신 스캔 새로고침
      await loadScanData()

    } catch (err) {
      console.error('테스트 실행 실패:', err)
      setError(err instanceof Error ? err.message : '테스트 실행에 실패했습니다')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('ko-KR')
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">관리자 권한이 필요합니다.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">보안 스캔</h2>
          <p className="text-gray-600 mt-1">
            시스템 보안 취약점을 스캔하고 관리합니다
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={loadScanData}
            disabled={isScanning}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            새로고침
          </button>
          <button
            onClick={runFullScan}
            disabled={isScanning}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isScanning ? '스캔 중...' : '전체 스캔 실행'}
          </button>
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-medium text-red-900">오류 발생</h4>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 최신 스캔 결과 요약 */}
      {latestScan && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  latestScan.overallScore >= 90 ? 'bg-green-100' :
                  latestScan.overallScore >= 70 ? 'bg-yellow-100' :
                  latestScan.overallScore >= 50 ? 'bg-orange-100' : 'bg-red-100'
                }`}>
                  <span className={`text-sm font-bold ${getScoreColor(latestScan.overallScore)}`}>
                    {latestScan.overallScore}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">보안 점수</p>
                <p className={`text-2xl font-semibold ${getScoreColor(latestScan.overallScore)}`}>
                  {latestScan.overallScore}점
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">심각한 이슈</p>
                <p className="text-2xl font-semibold text-red-600">{latestScan.criticalIssues}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">높은 위험</p>
                <p className="text-2xl font-semibold text-orange-600">{latestScan.highIssues}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">통과한 테스트</p>
                <p className="text-2xl font-semibold text-green-600">
                  {latestScan.passedTests}/{latestScan.totalTests}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 최신 스캔 상세 결과 */}
      {latestScan && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                최신 스캔 결과
              </h3>
              <span className="text-sm text-gray-500">
                {formatDate(latestScan.timestamp)}
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {latestScan.results.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          result.passed ? 'bg-green-100 text-green-800' : getSeverityColor(result.severity)
                        }`}>
                          {result.passed ? '통과' : result.severity.toUpperCase()}
                        </span>
                        <h4 className="font-medium text-gray-900">
                          {result.testId.replace(/_/g, ' ').toUpperCase()}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                      
                      {result.recommendations && result.recommendations.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-600 mb-1">권장사항:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {result.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start space-x-1">
                                <span>•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {result.passed ? (
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 스캔 기록 */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">스캔 기록</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  스캔 ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  실행 시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  보안 점수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  심각한 이슈
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  높은 위험
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scanHistory.map((scan) => (
                <tr key={scan.scan_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {scan.scan_id.split('_')[1]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(scan.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getScoreColor(scan.overall_score)}`}>
                      {scan.overall_score}점
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      scan.critical_issues > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {scan.critical_issues}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      scan.high_issues > 0 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {scan.high_issues}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {/* 상세 보기 구현 */}}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      상세보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {scanHistory.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-gray-600">스캔 기록이 없습니다.</p>
            <p className="text-sm text-gray-500 mt-1">
              보안 스캔을 실행하여 시스템 보안 상태를 확인하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}