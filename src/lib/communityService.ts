/**
 * 커뮤니티 서비스
 */
import { supabase } from './supabase'
import { Post, Comment, CreatePostRequest, UpdatePostRequest, CreateCommentRequest, PostFilters, Report } from '@/types/community'
import { withTimeout } from './timeoutUtils'
// HTML 간단 정리 함수
const sanitizeHtml = (html: string): string => {
  // 기본적인 HTML 태그 제거
  return html.replace(/<[^>]*>/g, '').trim()
}

class CommunityService {
  /**
   * 게시글 목록 조회
   */
  async getPosts(filters: PostFilters = {}, page = 1, limit = 20): Promise<{ posts: Post[], total: number }> {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:users(id, name, role),
          comments(id),
          post_likes(user_id)
        `, { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      // 필터 적용
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.authorId) {
        query = query.eq('author_id', filters.authorId)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
      }

      // 페이지네이션
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await withTimeout(query, 10000)

      if (error) throw error

      const posts = data?.map(this.mapPostData) || []
      
      return {
        posts,
        total: count || 0
      }
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error)
      throw error
    }
  }

  /**
   * 게시글 상세 조회
   */
  async getPost(id: string, userId?: string): Promise<Post | null> {
    try {
      // 조회수 증가
      await this.incrementViewCount(id)

      const { data, error } = await withTimeout(
        supabase
          .from('posts')
          .select(`
            *,
            author:users(id, name, role),
            comments(
              *,
              author:users(id, name, role),
              comment_likes(user_id)
            ),
            post_likes(user_id)
          `)
          .eq('id', id)
          .eq('status', 'active')
          .single(),
        10000
      )

      if (error) throw error

      return data ? this.mapPostData(data, userId) : null
    } catch (error) {
      console.error('게시글 상세 조회 실패:', error)
      throw error
    }
  }

  /**
   * 게시글 생성
   */
  async createPost(request: CreatePostRequest, authorId: string): Promise<Post> {
    try {
      // 익명 닉네임 생성
      const anonymousNickname = request.isAnonymous ? this.generateAnonymousNickname() : undefined

      const { data, error } = await withTimeout(
        supabase
          .from('posts')
          .insert({
            author_id: authorId,
            title: sanitizeHtml(request.title),
            content: sanitizeHtml(request.content),
            category: request.category,
            is_anonymous: request.isAnonymous,
            anonymous_nickname: anonymousNickname,
            status: 'active'
          })
          .select(`
            *,
            author:users(id, name, role)
          `)
          .single(),
        10000
      )

      if (error) throw error

      return this.mapPostData(data)
    } catch (error) {
      console.error('게시글 생성 실패:', error)
      throw error
    }
  }

  /**
   * 게시글 수정
   */
  async updatePost(id: string, request: UpdatePostRequest, authorId: string): Promise<Post> {
    try {
      const updateData: any = {}
      if (request.title) updateData.title = sanitizeHtml(request.title)
      if (request.content) updateData.content = sanitizeHtml(request.content)
      if (request.category) updateData.category = request.category

      const { data, error } = await withTimeout(
        supabase
          .from('posts')
          .update(updateData)
          .eq('id', id)
          .eq('author_id', authorId)
          .select(`
            *,
            author:users(id, name, role)
          `)
          .single(),
        10000
      )

      if (error) throw error

      return this.mapPostData(data)
    } catch (error) {
      console.error('게시글 수정 실패:', error)
      throw error
    }
  }

  /**
   * 게시글 삭제
   */
  async deletePost(id: string, authorId: string): Promise<void> {
    try {
      const { error } = await withTimeout(
        supabase
          .from('posts')
          .update({ status: 'deleted' })
          .eq('id', id)
          .eq('author_id', authorId),
        5000
      )

      if (error) throw error
    } catch (error) {
      console.error('게시글 삭제 실패:', error)
      throw error
    }
  }

  /**
   * 댓글 생성
   */
  async createComment(request: CreateCommentRequest, authorId: string): Promise<Comment> {
    try {
      const anonymousNickname = request.isAnonymous ? this.generateAnonymousNickname() : undefined

      const { data, error } = await withTimeout(
        supabase
          .from('comments')
          .insert({
            post_id: request.postId,
            author_id: authorId,
            content: sanitizeHtml(request.content),
            is_anonymous: request.isAnonymous,
            anonymous_nickname: anonymousNickname,
            status: 'active'
          })
          .select(`
            *,
            author:users(id, name, role)
          `)
          .single(),
        10000
      )

      if (error) throw error

      // 게시글 댓글 수 업데이트
      await this.updateCommentCount(request.postId)

      return this.mapCommentData(data)
    } catch (error) {
      console.error('댓글 생성 실패:', error)
      throw error
    }
  }

  /**
   * 게시글 좋아요 토글
   */
  async togglePostLike(postId: string, userId: string): Promise<boolean> {
    try {
      // 기존 좋아요 확인
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single()

      if (existingLike) {
        // 좋아요 취소
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
        
        await this.updateLikeCount(postId, 'post', -1)
        return false
      } else {
        // 좋아요 추가
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: userId
          })
        
        await this.updateLikeCount(postId, 'post', 1)
        return true
      }
    } catch (error) {
      console.error('게시글 좋아요 토글 실패:', error)
      throw error
    }
  }

  /**
   * 신고 생성
   */
  async createReport(
    targetType: 'post' | 'comment',
    targetId: string,
    reason: Report['reason'],
    description: string,
    reporterId: string
  ): Promise<void> {
    try {
      const { error } = await withTimeout(
        supabase
          .from('reports')
          .insert({
            reporter_id: reporterId,
            target_type: targetType,
            target_id: targetId,
            reason,
            description: sanitizeHtml(description),
            status: 'pending'
          }),
        5000
      )

      if (error) throw error
    } catch (error) {
      console.error('신고 생성 실패:', error)
      throw error
    }
  }

  /**
   * 익명 닉네임 생성
   */
  private generateAnonymousNickname(): string {
    const adjectives = ['건강한', '활기찬', '긍정적인', '열정적인', '차분한', '밝은', '따뜻한', '친근한']
    const nouns = ['사자', '호랑이', '독수리', '늑대', '여우', '곰', '토끼', '고양이']
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const number = Math.floor(Math.random() * 999) + 1
    
    return `${adjective}${noun}${number}`
  }

  /**
   * 조회수 증가
   */
  private async incrementViewCount(postId: string): Promise<void> {
    try {
      await supabase.rpc('increment_view_count', { post_id: postId })
    } catch (error) {
      console.error('조회수 증가 실패:', error)
    }
  }

  /**
   * 좋아요 수 업데이트
   */
  private async updateLikeCount(targetId: string, type: 'post' | 'comment', delta: number): Promise<void> {
    try {
      const rpcName = type === 'post' ? 'update_post_like_count' : 'update_comment_like_count'
      await supabase.rpc(rpcName, { target_id: targetId, delta })
    } catch (error) {
      console.error('좋아요 수 업데이트 실패:', error)
    }
  }

  /**
   * 댓글 수 업데이트
   */
  private async updateCommentCount(postId: string): Promise<void> {
    try {
      await supabase.rpc('update_comment_count', { post_id: postId })
    } catch (error) {
      console.error('댓글 수 업데이트 실패:', error)
    }
  }

  /**
   * 게시글 데이터 매핑
   */
  private mapPostData(data: any, userId?: string): Post {
    return {
      id: data.id,
      authorId: data.author_id,
      title: data.title,
      content: data.content,
      category: data.category,
      isAnonymous: data.is_anonymous,
      anonymousNickname: data.anonymous_nickname,
      status: data.status,
      viewCount: data.view_count || 0,
      likeCount: data.like_count || 0,
      commentCount: data.comment_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      author: data.author ? {
        id: data.author.id,
        name: data.author.name,
        role: data.author.role
      } : undefined,
      comments: data.comments?.map((c: any) => this.mapCommentData(c, userId)),
      isLiked: userId ? data.post_likes?.some((like: any) => like.user_id === userId) : false
    }
  }

  /**
   * 댓글 데이터 매핑
   */
  private mapCommentData(data: any, userId?: string): Comment {
    return {
      id: data.id,
      postId: data.post_id,
      authorId: data.author_id,
      content: data.content,
      isAnonymous: data.is_anonymous,
      anonymousNickname: data.anonymous_nickname,
      status: data.status,
      likeCount: data.like_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      author: data.author ? {
        id: data.author.id,
        name: data.author.name,
        role: data.author.role
      } : undefined,
      isLiked: userId ? data.comment_likes?.some((like: any) => like.user_id === userId) : false
    }
  }
}

export const communityService = new CommunityService()
export default communityService