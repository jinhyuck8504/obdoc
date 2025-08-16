/**
 * 커뮤니티 관련 타입 정의
 */

export interface Post {
  id: string
  authorId: string
  title: string
  content: string
  category: 'general' | 'diet' | 'exercise' | 'success' | 'question'
  isAnonymous: boolean
  anonymousNickname?: string
  status: 'active' | 'hidden' | 'deleted'
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
  
  // 관계 데이터
  author?: {
    id: string
    name: string
    role: 'doctor' | 'customer'
  }
  comments?: Comment[]
  isLiked?: boolean
}

export interface Comment {
  id: string
  postId: string
  authorId: string
  content: string
  isAnonymous: boolean
  anonymousNickname?: string
  status: 'active' | 'hidden' | 'deleted'
  likeCount: number
  createdAt: string
  updatedAt: string
  
  // 관계 데이터
  author?: {
    id: string
    name: string
    role: 'doctor' | 'customer'
  }
  isLiked?: boolean
}

export interface CreatePostRequest {
  title: string
  content: string
  category: Post['category']
  isAnonymous: boolean
}

export interface UpdatePostRequest {
  title?: string
  content?: string
  category?: Post['category']
}

export interface CreateCommentRequest {
  postId: string
  content: string
  isAnonymous: boolean
}

export interface PostFilters {
  category?: Post['category']
  authorId?: string
  search?: string
  status?: Post['status']
}

export interface Report {
  id: string
  reporterId: string
  targetType: 'post' | 'comment'
  targetId: string
  reason: 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'other'
  description?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  createdAt: string
  
  // 관계 데이터
  reporter?: {
    id: string
    name: string
  }
  target?: Post | Comment
}