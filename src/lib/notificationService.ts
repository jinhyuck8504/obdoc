/**
 * 알림 서비스
 */

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  userId?: string
}

class NotificationService {
  private notifications: Notification[] = []
  private listeners: ((notifications: Notification[]) => void)[] = []

  /**
   * 알림 추가
   */
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    }

    this.notifications.unshift(newNotification)
    this.notifyListeners()
  }

  /**
   * 알림 읽음 처리
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      this.notifyListeners()
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true)
    this.notifyListeners()
  }

  /**
   * 알림 삭제
   */
  removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId)
    this.notifyListeners()
  }

  /**
   * 모든 알림 가져오기
   */
  getNotifications(): Notification[] {
    return [...this.notifications]
  }

  /**
   * 읽지 않은 알림 개수
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  /**
   * 알림 변경 구독
   */
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener)
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]))
  }

  /**
   * 성공 알림
   */
  success(title: string, message: string): void {
    this.addNotification({ type: 'success', title, message })
  }

  /**
   * 에러 알림
   */
  error(title: string, message: string): void {
    this.addNotification({ type: 'error', title, message })
  }

  /**
   * 정보 알림
   */
  info(title: string, message: string): void {
    this.addNotification({ type: 'info', title, message })
  }

  /**
   * 경고 알림
   */
  warning(title: string, message: string): void {
    this.addNotification({ type: 'warning', title, message })
  }
}

export const notificationService = new NotificationService()
export default notificationService