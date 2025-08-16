/**
 * 역할 기반 가입 플로우 보안 테스트 API
 * 관리자만 접근 가능한 보안 테스트 실행 엔드포인트
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { roleBasedSecurityTester } from '@/lib/security/roleBasedSecurityTester'
import { supabase } from '@/lib/supabase'
import { createSecurityLog } from '@/lib/inviteCodeSecurity'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // 인증 확인
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      })
    }

    // 관리자 권한 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      await createSecurityLog(
        'unauthorized_security_test_access',
        'high',
        `User ${user.id} attempted to access security test API without admin privileges`,
        { userId: user.id, userRole: profile?.role || 'unknown' }
      )

      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      })
    }

    // 보안 로그 기록
    await createSecurityLog(
      'security_test_initiated',
      'info',
      `Admin ${user.id} initiated security test`,
      { userId: user.id, method: req.method, testType: req.body?.testType || 'full' }
    )

    if (req.method === 'GET') {
      // 테스트 상태 및 최근 결과 조회
      const isRunning = roleBasedSecurityTester.isTestRunning()
      const lastResults = roleBasedSecurityTester.getLastTestResults()

      return res.status(200).json({
        success: true,
        data: {
          isRunning,
          lastResults,
          lastTestCount: lastResults.length,
          lastScore: roleBasedSecurityTester.calculateSecurityScore(lastResults),
          lastRiskLevel: roleBasedSecurityTester.assessRiskLevel(lastResults)
        }
      })
    }

    if (req.method === 'POST') {
      const { testType, category } = req.body

      // 이미 테스트가 실행 중인지 확인
      if (roleBasedSecurityTester.isTestRunning()) {
        return res.status(409).json({
          success: false,
          error: 'Security test is already running'
        })
      }

      let testResult

      try {
        if (testType === 'full') {
          // 전체 보안 테스트 실행
          testResult = await roleBasedSecurityTester.runFullSecurityTest()
        } else if (testType === 'category' && category) {
          // 특정 카테고리 테스트 실행
          testResult = await roleBasedSecurityTester.runCategoryTest(category)
        } else {
          return res.status(400).json({
            success: false,
            error: 'Invalid test type. Use "full" or "category" with valid category name.'
          })
        }

        // 성공적인 테스트 완료 로그
        await createSecurityLog(
          'security_test_completed',
          'info',
          `Security test completed successfully`,
          {
            userId: user.id,
            testType,
            category,
            totalTests: testResult.totalTests,
            passedTests: testResult.passedTests,
            failedTests: testResult.failedTests,
            overallScore: testResult.overallScore,
            riskLevel: testResult.riskLevel,
            executionTime: testResult.executionTime
          }
        )

        return res.status(200).json({
          success: true,
          data: testResult
        })

      } catch (testError) {
        // 테스트 실행 오류 로그
        await createSecurityLog(
          'security_test_failed',
          'error',
          `Security test execution failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`,
          {
            userId: user.id,
            testType,
            category,
            error: testError instanceof Error ? testError.message : 'Unknown error'
          }
        )

        return res.status(500).json({
          success: false,
          error: 'Security test execution failed',
          details: testError instanceof Error ? testError.message : 'Unknown error'
        })
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })

  } catch (error) {
    console.error('Security test API error:', error)

    // 일반적인 오류 로그
    await createSecurityLog(
      'security_test_api_error',
      'error',
      `Security test API encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    )

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}