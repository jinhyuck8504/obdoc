/**
 * 고객 상세 정보 조회 API
 * GET /api/doctor/customers/[customerId]
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { customerManagementService } from '@/lib/customerManagementService'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rateLimiter'
import { withSecurity } from '@/lib/middleware/security'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // 고객 상세 정보 조회
    const result = await customerManagementService.getCustomerDetails(
      customerId,
      user.id
    )

    res.status(200).json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('고객 상세 정보 조회 API 오류:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('권한이 없습니다') || error.message.includes('접근 권한이 없습니다')) {
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