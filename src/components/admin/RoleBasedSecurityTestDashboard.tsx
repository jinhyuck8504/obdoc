/**
 * 역할 기반 가입 플로우 보안 테스트 대시보드
 * 관리자용 보안 테스트 실행 및 결과 모니터링 인터페이스
 */

import React, { useState, useEffect } from 'react'
import {
  Shield,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  Download,
  Filter,
  Search
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { useToast } from '@/hooks/use-toast'
import { SecurityTestResult } from '@/lib/security/roleBasedSecurityTester'

// 임시 타입 정의
interface SecurityTestSuite {
  id?: string
  name?: string
  description?: string
  tests?: SecurityTestResult[]
  suiteName?: string
  totalTests?: number
  passedTests?: number
  failedTests?: number
  warningTests?: number
  errorTests?: number
  duration?: number
  timestamp?: Date
  overallScore?: number
  riskLevel?: string
  results?: SecurityTestResult[]
  executionTime?: number
}

interface SecurityTestDashboardProps {
  className?: string
}

// 테스트 카테고리 정의
const TEST_CATEGORIES = [
  { id: 'authentication', name: '인증', icon: '🔐', description: '로그인, 비밀번호, 세션 보안' },
  { id: 'authorization', name: '권한', icon: '👮', description: '역할 기반 접근 제어' },
  { id: 'data_validation', name: '데이터 검증', icon: '✅', description: '입력 데이터 유효성 검사' },
  { id: 'rate_limiting', name: '속도 제한', icon: '⏱️', description: 'API 호출 빈도 제한' },
  { id: 'injection', name: '인젝션', icon: '💉', description: 'SQL, XSS, CSRF 공격 방어' },
  { id: 'session_management', name: '세션 관리', icon: '🎫', description: '세션 보안 및 관리' }
] as const

type TestCategory = typeof TEST_CATEGORIES[number]['id']

const RoleBasedSecurityTestDashboard: React.FC<SecurityTestDashboardProps> = ({ 
  className = '' 
}) => {
  const { toast } = useToast()
  
  // 상태 관리
  const [isLoading, setIsLoading] = useState(false)
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<SecurityTestSuite | null>(null)
  const [testHistory, setTestHistory] = useState<SecurityTestSuite[]>([])
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | 'all'>('all')
  const [showDetails, setShowDetails] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SecurityTestResult | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pass' | 'fail' | 'warning' | 'error'>('all')

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    loadTestStatus()
  }, [])

  // 테스트 상태 로드
  const loadTestStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/security/role-based-test', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setIsTestRunning(data.data.isRunning)
          if (data.data.lastResults.length > 0) {
            // 마지막 테스트 결과로 현재 테스트 설정
            setCurrentTest({
              suiteName: 'Last Test Results',
              totalTests: data.data.lastTestCount,
              passedTests: data.data.lastResults.filter((r: SecurityTestResult) => r.passed).length,
              failedTests: data.data.lastResults.filter((r: SecurityTestResult) => !r.passed).length,
              warningTests: data.data.lastResults.filter((r: SecurityTestResult) => r.severity === 'medium').length,
              errorTests: data.data.lastResults.filter((r: SecurityTestResult) => r.severity === 'high' || r.severity === 'critical').length,
              overallScore: data.data.lastScore,
              riskLevel: data.data.lastRiskLevel,
              results: data.data.lastResults,
              executionTime: 0,
              timestamp: new Date()
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to load test status:', error)
      toast({
        title: "로드 실패",
        description: "테스트 상태를 불러오는데 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 전체 보안 테스트 실행
  const runFullSecurityTest = async () => {
    if (isTestRunning) {
      toast({
        title: "테스트 실행 중",
        description: "이미 보안 테스트가 실행 중입니다.",
        variant: "destructive"
      })
      return
    }

    setIsTestRunning(true)
    try {
      const response = await fetch('/api/admin/security/role-based-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({ testType: 'full' })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCurrentTest(data.data)
          setTestHistory(prev => [data.data, ...prev.slice(0, 9)]) // 최근 10개만 유지
          
          toast({
            title: "테스트 완료",
            description: `보안 테스트가 완료되었습니다. 점수: ${data.data.overallScore}점`,
          })
        } else {
          throw new Error(data.error)
        }
      } else {
        throw new Error('테스트 실행 실패')
      }
    } catch (error) {
      console.error('Security test failed:', error)
      toast({
        title: "테스트 실패",
        description: error instanceof Error ? error.message : "보안 테스트 실행에 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsTestRunning(false)
    }
  }

  // 카테고리별 테스트 실행
  const runCategoryTest = async (category: TestCategory) => {
    if (isTestRunning) {
      toast({
        title: "테스트 실행 중",
        description: "이미 보안 테스트가 실행 중입니다.",
        variant: "destructive"
      })
      return
    }

    setIsTestRunning(true)
    try {
      const response = await fetch('/api/admin/security/role-based-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({ testType: 'category', category })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCurrentTest(data.data)
          
          const categoryName = TEST_CATEGORIES.find(c => c.id === category)?.name || category
          toast({
            title: "카테고리 테스트 완료",
            description: `${categoryName} 테스트가 완료되었습니다. 점수: ${data.data.overallScore}점`,
          })
        } else {
          throw new Error(data.error)
        }
      } else {
        throw new Error('테스트 실행 실패')
      }
    } catch (error) {
      console.error('Category test failed:', error)
      toast({
        title: "테스트 실패",
        description: error instanceof Error ? error.message : "카테고리 테스트 실행에 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsTestRunning(false)
    }
  }

  // 심각도별 색상 반환
  const getSeverityColor = (severity: SecurityTestResult['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // 상태별 색상 반환
  const getStatusColor = (passed: boolean, severity: SecurityTestResult['severity']) => {
    if (passed) {
      return 'bg-green-100 text-green-800 border-green-200'
    } else {
      switch (severity) {
        case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200'
        case 'high': return 'bg-red-100 text-red-800 border-red-200'
        case 'critical': return 'bg-red-100 text-red-800 border-red-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }
  }

  // 위험 수준별 색상 반환
  const getRiskLevelColor = (riskLevel: SecurityTestSuite['riskLevel']) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  // 필터링된 결과 반환
  const getFilteredResults = () => {
    if (!currentTest) return []

    return (currentTest.results || []).filter(result => {
      const severityMatch = filterSeverity === 'all' || result.severity === filterSeverity
      const statusMatch = filterStatus === 'all' || 
        (filterStatus === 'pass' && result.passed) || 
        (filterStatus === 'fail' && !result.passed)
      const categoryMatch = selectedCategory === 'all' // 임시로 category 필터 비활성화
      
      return severityMatch && statusMatch && categoryMatch
    })
  }

  // 결과 내보내기
  const exportResults = () => {
    if (!currentTest) return

    const csvContent = [
      ['테스트명', '카테고리', '심각도', '상태', '설명', '세부사항', '권장사항', '시간'].join(','),
      ...(currentTest.results || []).map(result => [
        result.testName,
        'N/A', // category
        result.severity,
        result.passed ? 'pass' : 'fail', // status
        result.message, // description
        'N/A', // details
        'N/A', // recommendation
        result.timestamp.toISOString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `security_test_results_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } 
 if (isLoading) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-500">보안 테스트 상태를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-blue-600" />
            보안 테스트 대시보드
          </h1>
          <p className="text-gray-600 mt-1">
            역할 기반 가입 플로우의 보안 취약점을 검증하고 모니터링합니다.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTestStatus}
            disabled={isTestRunning}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button
            onClick={runFullSecurityTest}
            disabled={isTestRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isTestRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                테스트 실행 중...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                전체 테스트 실행
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 현재 테스트 결과 요약 */}
      {currentTest && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">전체 점수</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {currentTest.overallScore}점
                  </p>
                  <p className={`text-sm mt-1 font-medium ${getRiskLevelColor(currentTest.riskLevel)}`}>
                    위험도: {currentTest.riskLevel?.toUpperCase() || 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">통과한 테스트</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {currentTest.passedTests}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    / {currentTest.totalTests} 테스트
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">실패한 테스트</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    {currentTest.failedTests}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    경고: {currentTest.warningTests}개
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-100">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">실행 시간</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {Math.round((currentTest.executionTime || 0) / 1000)}초
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentTest.timestamp?.toLocaleString('ko-KR') || 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 카테고리별 테스트 실행 */}
      <Card>
        <CardHeader>
          <CardTitle>카테고리별 테스트</CardTitle>
          <CardDescription>
            특정 보안 영역에 대한 집중 테스트를 실행할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEST_CATEGORIES.map((category) => (
              <div
                key={category.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">{category.icon}</span>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runCategoryTest(category.id)}
                      disabled={isTestRunning}
                      className="w-full"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      테스트 실행
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 테스트 결과 상세 */}
      {currentTest && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>테스트 결과 상세</CardTitle>
                <CardDescription>
                  {getFilteredResults().length}개의 테스트 결과
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportResults}
                >
                  <Download className="w-4 h-4 mr-2" />
                  내보내기
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 필터 */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">필터:</span>
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as TestCategory | 'all')}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">모든 카테고리</option>
                {TEST_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">모든 심각도</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">모든 상태</option>
                <option value="pass">통과</option>
                <option value="fail">실패</option>
                <option value="warning">경고</option>
                <option value="error">오류</option>
              </select>
            </div>

            {/* 결과 목록 */}
            <div className="space-y-3">
              {getFilteredResults().map((result, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{result.testName}</h4>
                        <Badge className={getSeverityColor(result.severity)}>
                          {result.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(result.passed, result.severity)}>
                          {result.passed ? 'PASS' : 'FAIL'}
                        </Badge>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          테스트
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-2">{result.message}</p>
                      <p className="text-sm text-gray-600">테스트 결과: {result.passed ? '통과' : '실패'}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedResult(result)
                          setShowDetails(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {getFilteredResults().length === 0 && (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">필터 조건에 맞는 테스트 결과가 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 테스트 결과가 없는 경우 */}
      {!currentTest && !isTestRunning && (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              보안 테스트를 시작하세요
            </h3>
            <p className="text-gray-600 mb-6">
              역할 기반 가입 플로우의 보안 취약점을 검증하기 위해 테스트를 실행하세요.
            </p>
            <Button
              onClick={runFullSecurityTest}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              첫 번째 보안 테스트 실행
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 상세 결과 모달 (간단한 구현) */}
      {showDetails && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedResult.testName}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDetails(false)
                  setSelectedResult(null)
                }}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <strong>카테고리:</strong> 보안 테스트
              </div>
              <div>
                <strong>심각도:</strong> {selectedResult.severity}
              </div>
              <div>
                <strong>상태:</strong> {selectedResult.passed ? '통과' : '실패'}
              </div>
              <div>
                <strong>설명:</strong> {selectedResult.message}
              </div>
              <div>
                <strong>세부사항:</strong> 테스트 실행 완료
              </div>
              <div>
                <strong>권장사항:</strong> 보안 정책을 준수하세요.
              </div>
              <div>
                <strong>타임스탬프:</strong> {selectedResult.timestamp.toLocaleString('ko-KR')}
              </div>
              <div>
                <strong>실행 시간:</strong> {selectedResult.timestamp.toLocaleString('ko-KR')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoleBasedSecurityTestDashboard