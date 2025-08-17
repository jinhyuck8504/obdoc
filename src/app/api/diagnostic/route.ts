import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getConfig, isDummySupabase, isDevelopment } from '@/lib/config'

interface DiagnosticResult {
  component: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
  timestamp: string
}

export async function GET() {
  const results: DiagnosticResult[] = []
  const timestamp = new Date().toISOString()

  try {
    // 1. 환경 변수 검증
    try {
      const config = getConfig()
      results.push({
        component: 'environment-variables',
        status: 'pass',
        message: '환경 변수가 올바르게 설정되었습니다',
        details: {
          hasSupabaseUrl: !!config.supabase.url,
          hasSupabaseKey: !!config.supabase.anonKey,
          hasAppUrl: !!config.app.url,
          environment: config.app.environment,
          isDummy: isDummySupabase()
        },
        timestamp
      })
    } catch (error) {
      results.push({
        component: 'environment-variables',
        status: 'fail',
        message: `환경 변수 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp
      })
    }

    // 2. Supabase 연결 테스트
    try {
      const startTime = Date.now()
      const { data, error } = await Promise.race([
        supabase.from('users').select('count').limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]) as any

      const responseTime = Date.now() - startTime

      if (error) {
        results.push({
          component: 'supabase-connection',
          status: 'fail',
          message: `Supabase 연결 실패: ${error.message}`,
          details: { responseTime, error: error.message },
          timestamp
        })
      } else {
        results.push({
          component: 'supabase-connection',
          status: 'pass',
          message: 'Supabase 연결 성공',
          details: { responseTime, dataReceived: !!data },
          timestamp
        })
      }
    } catch (error) {
      results.push({
        component: 'supabase-connection',
        status: 'fail',
        message: `Supabase 연결 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp
      })
    }

    // 3. 인증 시스템 테스트
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession()
      
      results.push({
        component: 'authentication-system',
        status: authError ? 'warning' : 'pass',
        message: authError ? `인증 시스템 경고: ${authError.message}` : '인증 시스템 정상',
        details: { 
          hasSession: !!authData?.session,
          authError: authError?.message 
        },
        timestamp
      })
    } catch (error) {
      results.push({
        component: 'authentication-system',
        status: 'fail',
        message: `인증 시스템 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp
      })
    }

    // 4. 데이터베이스 스키마 확인
    try {
      const tables = ['users', 'profiles', 'hospital_codes', 'invite_codes']
      const tableResults = []

      for (const table of tables) {
        try {
          const { error } = await supabase.from(table).select('*').limit(1)
          tableResults.push({
            table,
            exists: !error,
            error: error?.message
          })
        } catch (err) {
          tableResults.push({
            table,
            exists: false,
            error: err instanceof Error ? err.message : '알 수 없는 오류'
          })
        }
      }

      const allTablesExist = tableResults.every(t => t.exists)
      results.push({
        component: 'database-schema',
        status: allTablesExist ? 'pass' : 'warning',
        message: allTablesExist ? '데이터베이스 스키마 정상' : '일부 테이블이 누락되었습니다',
        details: { tables: tableResults },
        timestamp
      })
    } catch (error) {
      results.push({
        component: 'database-schema',
        status: 'fail',
        message: `데이터베이스 스키마 확인 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp
      })
    }

    // 5. API 라우트 테스트
    try {
      const apiRoutes = ['/api/health']
      const routeResults = []

      for (const route of apiRoutes) {
        try {
          const response = await fetch(`${getConfig().app.url}${route}`, {
            method: 'GET',
            headers: { 'User-Agent': 'diagnostic-check' }
          })
          routeResults.push({
            route,
            status: response.status,
            ok: response.ok
          })
        } catch (err) {
          routeResults.push({
            route,
            status: 0,
            ok: false,
            error: err instanceof Error ? err.message : '알 수 없는 오류'
          })
        }
      }

      const allRoutesOk = routeResults.every(r => r.ok)
      results.push({
        component: 'api-routes',
        status: allRoutesOk ? 'pass' : 'warning',
        message: allRoutesOk ? 'API 라우트 정상' : '일부 API 라우트에 문제가 있습니다',
        details: { routes: routeResults },
        timestamp
      })
    } catch (error) {
      results.push({
        component: 'api-routes',
        status: 'fail',
        message: `API 라우트 테스트 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp
      })
    }

    // 전체 상태 결정
    const hasFailures = results.some(r => r.status === 'fail')
    const hasWarnings = results.some(r => r.status === 'warning')
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (hasFailures) {
      overallStatus = 'unhealthy'
    } else if (hasWarnings) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    const response = {
      status: overallStatus,
      timestamp,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isDevelopment: isDevelopment(),
        isDummySupabase: isDummySupabase()
      },
      diagnostics: results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'pass').length,
        warnings: results.filter(r => r.status === 'warning').length,
        failed: results.filter(r => r.status === 'fail').length
      }
    }

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 206 : 503

    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Diagnostic check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp,
      error: '진단 검사 중 치명적 오류 발생',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}