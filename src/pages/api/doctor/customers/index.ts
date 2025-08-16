/**
 * 의사용 고객 목록 조회 API
 * GET /api/doctor/customers
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { customerManagementService } from '@/lib/customerManagementService'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rateLimiter'
import { withSecurity } from '@/lib/middleware/security'
import { CustomerFilter } from '@/types/customerManagement'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

  try {
    const { user } = req as any

    // 의사 권한 확인
    if (user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: '의사 권한이 필요합니다.'
      })
    }

    // 쿼리 파라미터에서 필터 추출
    const {
      status,
      searchTerm,
      sortBy = 'joinedAt',
      sortOrder = 'desc',
      page = '1',
      limit = '20',
      joinedDateStart,
      joinedDateEnd,
      lastActiveDateStart,
      lastActiveDateEnd,
      hasFlags
    } = req.query

    // 필터 객체 구성
    const filter: CustomerFilter = {
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 100) // 최대 100개로 제한
    }

    if (status) {
      filter.status = Array.isArray(status) ? status as any : [status as any]
    }

    if (searchTerm) {
      filter.searchTerm = searchTerm as string
    }

    if (joinedDateStart && joinedDateEnd) {
      filter.joinedDateRange = {
        start: new Date(joinedDateStart as string),
        end: new Date(joinedDateEnd as string)
      }
    }

    if (lastActiveDateStart && lastActiveDateEnd) {
      filter.lastActiveDateRange = {
        start: new Date(lastActiveDateStart as string),
        end: new Date(lastActiveDateEnd as string)
      }
    }

    if (hasFlags === 'true') {
      filter.hasFlags = true
    }

    // 고객 목록 조회
    const result = await customerManagementService.getCustomersByDoctor(
      user.id,
      filter
    )

    res.status(200).json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('고객 목록 조회 API 오류:', error)
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.'
    })
  }
}

export default withSecurity(withRateLimit(withAuth(handler)))