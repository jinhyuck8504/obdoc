/**
 * 고객 상태 변경 API
 * PUT /api/doctor/customers/[customerId]/status
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { customerManagementService } from '@/lib/customerManagementService'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rateLimiter'
import { withSecurity } from '@/lib/middleware/security'
import { z } from 'zod'

// 상태 변경 요청 스키마
const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']),
  reason: z.string().optional()
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

  try {
    const { user } = req as any
    const { customerId } = req.query

    // 의사 권한 확인
    if (user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: '의사 권한이 필요합니다.'
      })
    }

    // customerId 유효성 검사
    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 고객 ID입니다.'
      })
    }

    // 요청 데이터 검증
    const validationResult = updateStatusSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: '입력 데이터가 유효하지 않습니다.',
        details: validationResult.error.errors
      })
    }

    const { status, reason } = validationResult.data

    // 상태 변경
    await customerManagementService.updateCustomerStatus(
      customerId,
      user.id,
      status,
      reason
    )

    res.status(200).json({
      success: true,
      message: `고객 상태가 ${status}로 변경되었습니다.`
    })

  } catch (error) {
    console.error('고객 상태 변경 API 오류:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('권한이 없습니다')) {
        return res.status(403).json({
          success: false,
          error: error.message
        })
      }
      
      if (error.message.includes('찾을 수 없습니다')) {
        return res.status(404).json({
          success: false,
          error: error.message
        })
      }
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
    })
  }
}

export default withSecurity(withRateLimit(withAuth(handler)))