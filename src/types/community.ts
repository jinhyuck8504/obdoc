export interface CommunityPost {
  id: string
  title: string
  content: string
  authorId: string
  authorNickname: string
  category: PostCategory
  tags: string[]
  imageUrl?: string
  likes: number
  commentCount: number
  isLiked?: boolean
  createdAt: string
  updatedAt: string
}

export interface CommunityComment {
  id: string
  postId: string
  content: string
  authorId: string
  authorNickname: string
  likes: number
  isLiked?: boolean
  createdAt: string
  updatedAt: string
}

export type PostCategory = 
  | 'success-story'    // 성공후기
  | 'diet-tips'        // 식단팁
  | 'exercise-tips'    // 운동팁
  | 'motivation'       // 동기부여
  | 'question'         // 질문
  | 'general'          // 일반

export interface PostFormData {
  title: string
  content: string
  category: PostCategory
  tags: string[]
  image?: File
}

export interface CommentFormData {
  content: string
}

export interface PostFilters {
  category?: PostCategory
  tags?: string[]
  search?: string
  sortBy?: 'latest' | 'popular' | 'most-liked'
}

export const POST_CATEGORIES: { value: PostCategory; label: string; color: string }[] = [
  { value: 'success-story', label: '성공후기', color: 'bg-green-100 text-green-800' },
  { value: 'diet-tips', label: '식단팁', color: 'bg-blue-100 text-blue-800' },
  { value: 'exercise-tips', label: '운동팁', color: 'bg-purple-100 text-purple-800' },
  { value: 'motivation', label: '동기부여', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'question', label: '질문', color: 'bg-orange-100 text-orange-800' },
  { value: 'general', label: '일반', color: 'bg-gray-100 text-gray-800' }
]

export const POPULAR_TAGS = [
  '다이어트', '운동', '식단', '체중감량', '건강', '동기부여', 
  '성공후기', '팁', '질문', '도움', '상담', '경험담'
]