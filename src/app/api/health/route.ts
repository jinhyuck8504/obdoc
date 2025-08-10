import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Database health check
    const { data: dbHealth, error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    const dbStatus = dbError ? 'unhealthy' : 'healthy'
    const responseTime = Date.now() - startTime
    
    // System health metrics
    const health = {
      status: dbStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      services: {
        database: {
          status: dbStatus,
          responseTime: `${responseTime}ms`,
          error: dbError?.message || null
        },
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external
        }
      }
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503
    
    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error',
        services: {
          database: { status: 'unknown' }
        }
      },
      { status: 503 }
    )
  }
}

export async function HEAD() {
  // Simple health check for load balancers
  try {
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    return new Response(null, { 
      status: error ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
  } catch {
    return new Response(null, { status: 503 })
  }
}