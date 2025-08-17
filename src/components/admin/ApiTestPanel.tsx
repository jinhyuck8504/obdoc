'use client'

import React, { useState } from 'react'
import Button from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

const ApiTestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({})
  const [loading, setLoading] = useState<string>('')

  const testApi = async (endpoint: string, name: string) => {
    setLoading(name)
    try {
      console.log(`Testing ${endpoint}...`)
      const response = await fetch(endpoint)
      console.log(`${name} Response:`, response.status, response.statusText)
      
      const result = await response.json()
      console.log(`${name} Result:`, result)
      
      setTestResults(prev => ({
        ...prev,
        [name]: {
          status: response.status,
          success: response.ok,
          data: result
        }
      }))
    } catch (error) {
      console.error(`${name} Error:`, error)
      setTestResults(prev => ({
        ...prev,
        [name]: {
          status: 'ERROR',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    } finally {
      setLoading('')
    }
  }

  const endpoints = [
    { url: '/api/test', name: 'Test API' },
    { url: '/api/admin/users', name: 'Users API' },
    { url: '/api/admin/hospitals', name: 'Hospitals API' },
    { url: '/api/admin/subscriptions', name: 'Subscriptions API' },
    { url: '/api/admin/analytics', name: 'Analytics API' }
  ]

  return (
    <Card className="m-4">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">API 테스트 패널</h3>
        <p className="text-sm text-gray-600">각 API 엔드포인트를 테스트해보세요</p>
      </div>
      <CardBody className="p-4">
        <div className="space-y-4">
          {endpoints.map((endpoint) => (
            <div key={endpoint.name} className="flex items-center justify-between p-3 border rounded">
              <div className="flex-1">
                <div className="font-medium">{endpoint.name}</div>
                <div className="text-sm text-gray-500">{endpoint.url}</div>
                {testResults[endpoint.name] && (
                  <div className="mt-2 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      testResults[endpoint.name].success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {testResults[endpoint.name].status}
                    </span>
                    {testResults[endpoint.name].error && (
                      <div className="text-red-600 mt-1">{testResults[endpoint.name].error}</div>
                    )}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => testApi(endpoint.url, endpoint.name)}
                disabled={loading === endpoint.name}
              >
                {loading === endpoint.name ? '테스트 중...' : '테스트'}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium text-yellow-800">개발 서버 재시작 필요</h4>
          <p className="text-sm text-yellow-700 mt-1">
            새로운 API 라우트가 인식되지 않는다면 개발 서버를 재시작해주세요:
          </p>
          <code className="block mt-2 p-2 bg-yellow-100 text-yellow-800 text-xs rounded">
            npm run dev 또는 yarn dev
          </code>
        </div>
      </CardBody>
    </Card>
  )
}

export default ApiTestPanel