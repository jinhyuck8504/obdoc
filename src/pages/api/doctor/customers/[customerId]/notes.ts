/**
 * 고객 노트 관리 API
 * POST /api/doctor/customers/[customerId]/notes - 노트 추가
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { customerManagementService } from '@/lib/customerManagementService'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rateLimiter'
import { withSecurity } from '@/lib/middleware/security'
import { z } from 'zod'

// 노트 추가 요청 스키마
const addNoteSchema = z.object({
  content: z.string().min(1, '노트 내용을 입력해주세요.').max(2000, '노트는 2000자를 초과할 수 없습니다.'),
  type: z.enum(['general', 'medical', 'administrative', 'security']),
  isPrivate: z.boolean().default(false)
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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
    const validationResult = addNoteSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: '입력 데이터가 유효하지 않습니다.',
        details: validationResult.error.errors
      })
    }

    const noteData = validationResult.data

    // 노트 추가
    await customerManagementService.addCustomerNote(
      customerId,
      user.id,
      noteData
    )

    res.status(201).json({
      success: true,
      message: '노트가 성공적으로 추가되었습니다.'
    })

  } catch (error) {
    console.error('고객 노트 추가 API 오류:', error)
    
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