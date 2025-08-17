'use client'

import React, { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  Database,
  Shield,
  Globe,
  Server
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface DiagnosticResult {
  component: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
  timestamp: string
}

interface DiagnosticResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  environment: {
    nodeEnv: string
    isDevelopment: boolean
    isDummySupabase: boolean
  }
  diagnostics: DiagnosticResult[]
  summary: {
    total: number
    passed: number
    warnings: number
    failed: number
  }
}

const DiagnosticPanel: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/diagnostic')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      setDiagnostics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '진단 실행 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 컴포넌트 마운트 시 자동으로 진단 실행
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'environment-variables':
        return <Globe className="h-4 w-4" />
      case 'supabase-connection':
        return <Database className="h-4 w-4" />
      case 'authentication-system':
        return <Shield className="h-4 w-4" />
      case 'database-schema':
        return <Database className="h-4 w-4" />
      case 'api-routes':
        return <Server className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시스템 진단</h1>
          <p className="text-gray-600">OBDoc 애플리케이션의 기본 기능 상태를 확인합니다</p>
        </div>
        <Button
          onClick={runDiagnostics}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? '진단 중...' : '다시 진단'}</span>
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 font-medium">진단 실행 실패</span>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
          </CardContent>
        </Card>
      )}

      {diagnostics && (
        <>
          {/* 전체 상태 요약 */}
          <Card className={`border-2 ${getStatusColor(diagnostics.status)}`}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getStatusIcon(diagnostics.status)}
                <span>전체 시스템 상태: {diagnostics.status.toUpperCase()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{diagnostics.summary.passed}</div>
                  <div className="text-sm text-gray-600">정상</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{diagnostics.summary.warnings}</div>
                  <div className="text-sm text-gray-600">경고</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{diagnostics.summary.failed}</div>
                  <div className="text-sm text-gray-600">실패</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{diagnostics.summary.total}</div>
                  <div className="text-sm text-gray-600">총 검사</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <div>환경: {diagnostics.environment.nodeEnv}</div>
                  <div>개발 모드: {diagnostics.environment.isDevelopment ? '예' : '아니오'}</div>
                  <div>더미 Supabase: {diagnostics.environment.isDummySupabase ? '예' : '아니오'}</div>
                  <div>마지막 검사: {new Date(diagnostics.timestamp).toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 개별 진단 결과 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">상세 진단 결과</h2>
            
            {diagnostics.diagnostics.map((result, index) => (
              <Card key={index} className={`border-l-4 ${
                result.status === 'pass' ? 'border-l-green-500' :
                result.status === 'warning' ? 'border-l-yellow-500' :
                'border-l-red-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center space-x-2">
                      {getComponentIcon(result.component)}
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 capitalize">
                        {result.component.replace(/-/g, ' ')}
                      </h3>
                      <p className="text-gray-600 mt-1">{result.message}</p>
                      
                      {result.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                            상세 정보 보기
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {loading && !diagnostics && (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">시스템 진단을 실행하고 있습니다...</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DiagnosticPanel