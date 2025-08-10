import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateSchema, ValidationResult } from './utils'

// API 검증 미들웨어 타입
export interface ValidationMiddlewareOptions {
  body?: z.ZodSchema<any>
  query?: z.ZodSchema<any>
  params?: z.ZodSchema<any>
  headers?: z.ZodSchema<any>
}

// 검증된 요청 타입
export interface ValidatedRequest<
  TBody = any,
  TQuery = any,
  TParams = any,
  THeaders = any
> extends NextRequest {
  validatedBody?: TBody
  validatedQuery?: TQuery
  validatedParams?: TParams
  validatedHeaders?: THeaders
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

// 검증 미들웨어 생성
export function createValidationMiddleware(options: ValidationMiddlewareOptions) {
  return async function validationMiddleware(
    request: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse | null> {
    try {
      const validatedRequest = request as ValidatedRequest

      // Body 검증
      if (options.body) {
        let body: any
        try {
          const contentType = request.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            body = await request.json()
          } else if (contentType?.includes('application/x-www-form-urlencoded')) {
            const formData = await request.formData()
            body = Object.fromEntries(formData.entries())
          } else {
            body = {}
          }
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              message: '요청 본문을 파싱할 수 없습니다',
              errors: { body: ['올바른 JSON 형식이 아닙니다'] }
            } as ApiResponse,
            { status: 400 }
          )
        }

        const bodyResult = validateSchema(options.body, body)
        if (!bodyResult.success) {
          return NextResponse.json(
            {
              success: false,
              message: '요청 본문이 올바르지 않습니다',
              errors: bodyResult.errors
            } as ApiResponse,
            { status: 400 }
          )
        }
        validatedRequest.validatedBody = bodyResult.data
      }

      // Query 검증
      if (options.query) {
        const url = new URL(request.url)
        const query = Object.fromEntries(url.searchParams.entries())
        
        const queryResult = validateSchema(options.query, query)
        if (!queryResult.success) {
          return NextResponse.json(
            {
              success: false,
              message: '쿼리 파라미터가 올바르지 않습니다',
              errors: queryResult.errors
            } as ApiResponse,
            { status: 400 }
          )
        }
        validatedRequest.validatedQuery = queryResult.data
      }

      // Params 검증
      if (options.params && context?.params) {
        const paramsResult = validateSchema(options.params, context.params)
        if (!paramsResult.success) {
          return NextResponse.json(
            {
              success: false,
              message: '경로 파라미터가 올바르지 않습니다',
              errors: paramsResult.errors
            } as ApiResponse,
            { status: 400 }
          )
        }
        validatedRequest.validatedParams = paramsResult.data
      }

      // Headers 검증
      if (options.headers) {
        const headers = Object.fromEntries(request.headers.entries())
        const headersResult = validateSchema(options.headers, headers)
        if (!headersResult.success) {
          return NextResponse.json(
            {
              success: false,
              message: '요청 헤더가 올바르지 않습니다',
              errors: headersResult.errors
            } as ApiResponse,
            { status: 400 }
          )
        }
        validatedRequest.validatedHeaders = headersResult.data
      }

      return null // 검증 통과, 다음 미들웨어로
    } catch (error) {
      console.error('Validation middleware error:', error)
      return NextResponse.json(
        {
          success: false,
          message: '서버 내부 오류가 발생했습니다'
        } as ApiResponse,
        { status: 500 }
      )
    }
  }
}

// API 핸들러 래퍼
export function withValidation<
  TBody = any,
  TQuery = any,
  TParams = any,
  THeaders = any
>(
  options: ValidationMiddlewareOptions,
  handler: (
    request: ValidatedRequest<TBody, TQuery, TParams, THeaders>,
    context?: { params?: Record<string, string> }
  ) => Promise<NextResponse>
) {
  return async function validatedHandler(
    request: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse> {
    const middleware = createValidationMiddleware(options)
    const validationResult = await middleware(request, context)
    
    if (validationResult) {
      return validationResult // 검증 실패
    }
    
    return handler(request as ValidatedRequest<TBody, TQuery, TParams, THeaders>, context)
  }
}

// 성공 응답 헬퍼
export function successResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message
  } as ApiResponse<T>)
}

// 오류 응답 헬퍼
export function errorResponse(
  message: string,
  errors?: Record<string, string[]>,
  status: number = 400
): NextResponse {
  return NextResponse.json({
    success: false,
    message,
    errors
  } as ApiResponse, { status })
}

// 검증 오류 응답 헬퍼
export function validationErrorResponse(
  result: ValidationResult<any>
): NextResponse {
  return NextResponse.json({
    success: false,
    message: result.message || '입력 데이터가 올바르지 않습니다',
    errors: result.errors
  } as ApiResponse, { status: 400 })
}

// 인증 검증 미들웨어
export function createAuthMiddleware(requiredRoles?: string[]) {
  return async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
    try {
      // Authorization 헤더 확인
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          {
            success: false,
            message: '인증 토큰이 필요합니다'
          } as ApiResponse,
          { status: 401 }
        )
      }

      const token = authHeader.substring(7)
      
      // 토큰 검증 로직 (실제 구현에서는 JWT 검증 등)
      if (!token || token === 'invalid') {
        return NextResponse.json(
          {
            success: false,
            message: '유효하지 않은 토큰입니다'
          } as ApiResponse,
          { status: 401 }
        )
      }

      // 역할 기반 접근 제어
      if (requiredRoles && requiredRoles.length > 0) {
        // 실제 구현에서는 토큰에서 사용자 역할 추출
        const userRole = 'user' // 예시
        
        if (!requiredRoles.includes(userRole)) {
          return NextResponse.json(
            {
              success: false,
              message: '접근 권한이 없습니다'
            } as ApiResponse,
            { status: 403 }
          )
        }
      }

      return null // 인증 통과
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        {
          success: false,
          message: '인증 처리 중 오류가 발생했습니다'
        } as ApiResponse,
        { status: 500 }
      )
    }
  }
}

// 미들웨어 체인 생성
export function createMiddlewareChain(
  ...middlewares: Array<(request: NextRequest, context?: any) => Promise<NextResponse | null>>
) {
  return async function middlewareChain(
    request: NextRequest,
    context?: any
  ): Promise<NextResponse | null> {
    for (const middleware of middlewares) {
      const result = await middleware(request, context)
      if (result) {
        return result // 미들웨어에서 응답 반환 시 체인 중단
      }
    }
    return null // 모든 미들웨어 통과
  }
}

// 속도 제한 미들웨어
export function createRateLimitMiddleware(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15분
) {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    
    const clientData = requests.get(clientIp)
    
    if (!clientData || now > clientData.resetTime) {
      // 새로운 윈도우 시작
      requests.set(clientIp, {
        count: 1,
        resetTime: now + windowMs
      })
      return null
    }
    
    if (clientData.count >= maxRequests) {
      return NextResponse.json(
        {
          success: false,
          message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
        } as ApiResponse,
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((clientData.resetTime - now) / 1000).toString()
          }
        }
      )
    }
    
    // 요청 수 증가
    clientData.count++
    return null
  }
}

// CORS 미들웨어
export function createCorsMiddleware(options: {
  origin?: string | string[]
  methods?: string[]
  headers?: string[]
  credentials?: boolean
} = {}) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
    credentials = false
  } = options

  return async function corsMiddleware(request: NextRequest): Promise<NextResponse | null> {
    // OPTIONS 요청 처리
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(', ') : origin,
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': headers.join(', '),
          'Access-Control-Allow-Credentials': credentials.toString()
        }
      })
    }

    return null // 다른 요청은 통과
  }
}

// 로깅 미들웨어
export function createLoggingMiddleware() {
  return async function loggingMiddleware(request: NextRequest): Promise<NextResponse | null> {
    const method = request.method
    const url = request.url
    const userAgent = request.headers.get('user-agent')
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')

    console.log(`[${new Date().toISOString()}] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`)

    return null
  }
}

// 보안 헤더 미들웨어
export function createSecurityHeadersMiddleware() {
  return async function securityHeadersMiddleware(_request: NextRequest): Promise<NextResponse | null> {
    // 보안 헤더는 응답에 추가되므로 여기서는 null 반환
    // 실제로는 응답 미들웨어에서 처리해야 함
    return null
  }
}

// 응답에 보안 헤더 추가하는 헬퍼
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  return response
}