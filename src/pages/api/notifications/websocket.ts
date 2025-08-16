/**
 * WebSocket 기반 실시간 알림 API
 * 클라이언트와 실시간 알림 연결을 관리합니다.
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { notificationService } from '@/lib/notificationService'
import { monitoringService } from '@/lib/monitoringService'
import { createSecurityLog } from '@/lib/inviteCodeSecurity'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

// Socket.IO 서버 확장
interface NextApiResponseWithSocket extends NextApiResponse {
  socket: {
    server: HTTPServer & {
      io?: SocketIOServer
    }
  }
}

// 연결된 클라이언트 정보
interface ConnectedClient {
  userId: string
  userType: 'doctor' | 'admin'
  socketId: string
  connectedAt: string
  lastActivity: string
}

// 연결된 클라이언트 관리
const connectedClients = new Map<string, ConnectedClient>()

// JWT 토큰 검증
const verifyToken = (token: string): { userId: string; role: string } | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return { userId: decoded.sub, role: decoded.role }
  } catch (error) {
    return null
  }
}

// Socket.IO 서버 초기화
const initializeSocketIO = (server: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  })

  // 인증 미들웨어
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication token required'))
      }

      const tokenData = verifyToken(token)
      if (!tokenData) {
        return next(new Error('Invalid authentication token'))
      }

      // 사용자 정보를 소켓에 저장
      socket.data.userId = tokenData.userId
      socket.data.userType = tokenData.role === 'admin' ? 'admin' : 'doctor'
      
      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  // 연결 이벤트 처리
  io.on('connection', async (socket) => {
    const userId = socket.data.userId
    const userType = socket.data.userType
    const clientIP = socket.handshake.address

    console.log(`User ${userId} (${userType}) connected from ${clientIP}`)

    // 클라이언트 정보 저장
    const client: ConnectedClient = {
      userId,
      userType,
      socketId: socket.id,
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    }
    connectedClients.set(socket.id, client)

    // 사용자별 룸에 참가
    socket.join(`user:${userId}`)
    if (userType === 'admin') {
      socket.join('admins')
    } else if (userType === 'doctor') {
      socket.join('doctors')
    }

    // 연결 로그 기록
    await logWebSocketEvent('connection', userId, clientIP, {
      userType,
      socketId: socket.id
    })

    // 읽지 않은 알림 수 전송
    try {
      const unreadCount = await notificationService.getUnreadCount(userId)
      socket.emit('unread_count', { count: unreadCount })
    } catch (error) {
      console.error('Failed to send unread count:', error)
    }

    // 현재 시스템 상태 전송 (관리자만)
    if (userType === 'admin') {
      try {
        const currentMetrics = monitoringService.getCurrentMetrics()
        const monitoringStatus = monitoringService.getMonitoringStatus()
        
        socket.emit('system_status', {
          metrics: currentMetrics,
          monitoring: monitoringStatus
        })
      } catch (error) {
        console.error('Failed to send system status:', error)
      }
    }

    // 알림 구독
    const unsubscribe = notificationService.subscribe(userId, (notification) => {
      socket.emit('notification', notification)
    })

    // 알림 읽음 처리
    socket.on('mark_notification_read', async (data) => {
      try {
        const { notificationId } = data
        if (!notificationId) return

        const success = await notificationService.markAsRead(notificationId, userId)
        if (success) {
          const unreadCount = await notificationService.getUnreadCount(userId)
          socket.emit('unread_count', { count: unreadCount })
          socket.emit('notification_read', { notificationId, success: true })
        } else {
          socket.emit('notification_read', { notificationId, success: false })
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
        socket.emit('notification_read', { notificationId: data.notificationId, success: false })
      }
    })

    // 알림 목록 요청
    socket.on('get_notifications', async (data) => {
      try {
        const { limit = 20, offset = 0, unreadOnly = false } = data
        const result = await notificationService.getUserNotifications(userId, {
          limit,
          offset,
          unreadOnly
        })
        
        socket.emit('notifications_list', result)
      } catch (error) {
        console.error('Failed to get notifications:', error)
        socket.emit('notifications_list', { notifications: [], total: 0 })
      }
    })

    // 시스템 메트릭 요청 (관리자만)
    socket.on('get_system_metrics', async (data) => {
      if (userType !== 'admin') {
        socket.emit('error', { message: 'Admin permission required' })
        return
      }

      try {
        const { minutes = 60 } = data
        const metrics = monitoringService.getMetricsHistory(minutes)
        const status = monitoringService.getMonitoringStatus()
        
        socket.emit('system_metrics', {
          metrics,
          status,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Failed to get system metrics:', error)
        socket.emit('error', { message: 'Failed to get system metrics' })
      }
    })

    // 활동 시간 업데이트
    socket.on('ping', () => {
      const client = connectedClients.get(socket.id)
      if (client) {
        client.lastActivity = new Date().toISOString()
        connectedClients.set(socket.id, client)
      }
      socket.emit('pong')
    })

    // 연결 해제 처리
    socket.on('disconnect', async (reason) => {
      console.log(`User ${userId} disconnected: ${reason}`)
      
      // 구독 해제
      unsubscribe()
      
      // 클라이언트 정보 제거
      connectedClients.delete(socket.id)
      
      // 연결 해제 로그 기록
      await logWebSocketEvent('disconnection', userId, clientIP, {
        reason,
        socketId: socket.id,
        duration: Date.now() - new Date(client.connectedAt).getTime()
      })
    })

    // 에러 처리
    socket.on('error', async (error) => {
      console.error(`Socket error for user ${userId}:`, error)
      
      await logWebSocketEvent('error', userId, clientIP, {
        error: error.message,
        socketId: socket.id
      })
    })
  })

  // 주기적으로 시스템 메트릭 브로드캐스트 (관리자에게만)
  setInterval(() => {
    try {
      const currentMetrics = monitoringService.getCurrentMetrics()
      if (currentMetrics) {
        io.to('admins').emit('metrics_update', currentMetrics)
      }
    } catch (error) {
      console.error('Failed to broadcast metrics update:', error)
    }
  }, 30000) // 30초마다

  // 비활성 연결 정리
  setInterval(() => {
    const now = Date.now()
    const timeout = 5 * 60 * 1000 // 5분

    for (const [socketId, client] of connectedClients.entries()) {
      const lastActivity = new Date(client.lastActivity).getTime()
      if (now - lastActivity > timeout) {
        const socket = io.sockets.sockets.get(socketId)
        if (socket) {
          socket.disconnect(true)
        }
        connectedClients.delete(socketId)
      }
    }
  }, 60000) // 1분마다 정리

  return io
}

// WebSocket 이벤트 로그 기록
async function logWebSocketEvent(
  eventType: string,
  userId: string,
  ipAddress: string,
  details: any
): Promise<void> {
  try {
    const log = createSecurityLog(
      'websocket_event',
      userId,
      ipAddress,
      'websocket-client',
      {
        eventType,
        ...details
      },
      true
    )

    await supabase
      .from('audit_logs')
      .insert(log)
  } catch (error) {
    console.error('Failed to log WebSocket event:', error)
  }
}

// 연결된 클라이언트 통계 조회
export function getConnectionStats(): {
  totalConnections: number
  doctorConnections: number
  adminConnections: number
  clients: ConnectedClient[]
} {
  const clients = Array.from(connectedClients.values())
  
  return {
    totalConnections: clients.length,
    doctorConnections: clients.filter(c => c.userType === 'doctor').length,
    adminConnections: clients.filter(c => c.userType === 'admin').length,
    clients
  }
}

// 특정 사용자에게 알림 전송
export function sendNotificationToUser(userId: string, notification: any): void {
  const io = global.io as SocketIOServer
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification)
  }
}

// 모든 관리자에게 브로드캐스트
export function broadcastToAdmins(event: string, data: any): void {
  const io = global.io as SocketIOServer
  if (io) {
    io.to('admins').emit(event, data)
  }
}

// 모든 의사에게 브로드캐스트
export function broadcastToDoctors(event: string, data: any): void {
  const io = global.io as SocketIOServer
  if (io) {
    io.to('doctors').emit(event, data)
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...')
    
    const io = initializeSocketIO(res.socket.server)
    res.socket.server.io = io
    
    // 전역 참조 저장 (다른 모듈에서 사용하기 위해)
    global.io = io
    
    console.log('Socket.IO server initialized')
  }

  res.end()
}