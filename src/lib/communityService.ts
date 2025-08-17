/**
 * 커뮤니티 서비스
 */
import { supabase } from './supabase'

// HTML 간단 정리 함수
const sanitizeHtml = (html: string): string => {
  // 기본적인 HTML 태그 제거
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * 게시글 목록 조회
 */
export const getPosts = async (filters: any = {}, page = 1, limit = 20) => {
  try {
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      posts: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('게시글 목록 조회 오류:', error)
    return { posts: [], total: 0 }
  }
}

/**
 * 게시글 상세 조회
 */
export const getPost = async (postId: string) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('게시글 조회 오류:', error)
    return null
  }
}

/**
 * 게시글 생성
 */
export const createPost = async (postData: any) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...postData,
        content: sanitizeHtml(postData.content),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('게시글 생성 오류:', error)
    return { success: false, error: '게시글 생성 중 오류가 발생했습니다.' }
  }
}

/**
 * 게시글 수정
 */
export const updatePost = async (postId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update({
        ...updates,
        content: updates.content ? sanitizeHtml(updates.content) : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('게시글 수정 오류:', error)
    return { success: false, error: '게시글 수정 중 오류가 발생했습니다.' }
  }
}

/**
 * 게시글 삭제
 */
export const deletePost = async (postId: string) => {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('게시글 삭제 오류:', error)
    return { success: false, error: '게시글 삭제 중 오류가 발생했습니다.' }
  }
}

/**
 * 댓글 목록 조회
 */
export const getComments = async (postId: string, page = 1, limit = 20) => {
  try {
    const { data, error, count } = await supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    return {
      comments: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('댓글 조회 오류:', error)
    return { comments: [], total: 0 }
  }
}

/**
 * 댓글 생성
 */
export const createComment = async (commentData: any) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        ...commentData,
        content: sanitizeHtml(commentData.content),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('댓글 생성 오류:', error)
    return { success: false, error: '댓글 생성 중 오류가 발생했습니다.' }
  }
}

/**
 * 댓글 삭제
 */
export const deleteComment = async (commentId: string) => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('댓글 삭제 오류:', error)
    return { success: false, error: '댓글 삭제 중 오류가 발생했습니다.' }
  }
}

/**
 * 게시글 좋아요 토글
 */
export const togglePostLike = async (postId: string, userId: string) => {
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
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)

      if (error) throw error
      return { success: true, liked: false }
    } else {
      // 좋아요 추가
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId,
          created_at: new Date().toISOString()
        })

      if (error) throw error
      return { success: true, liked: true }
    }
  } catch (error) {
    console.error('좋아요 토글 오류:', error)
    return { success: false, error: '좋아요 처리 중 오류가 발생했습니다.' }
  }
}

/**
 * 댓글 좋아요 토글
 */
export const toggleCommentLike = async (commentId: string, userId: string) => {
  try {
    // 기존 좋아요 확인
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      // 좋아요 취소
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId)

      if (error) throw error
      return { success: true, liked: false }
    } else {
      // 좋아요 추가
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId,
          created_at: new Date().toISOString()
        })

      if (error) throw error
      return { success: true, liked: true }
    }
  } catch (error) {
    console.error('댓글 좋아요 토글 오류:', error)
    return { success: false, error: '좋아요 처리 중 오류가 발생했습니다.' }
  }
}

/**
 * 인기 태그 조회
 */
export const getPopularTags = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('tags')
      .eq('status', 'active')
      .not('tags', 'is', null)

    if (error) throw error

    // 태그 빈도 계산
    const tagCounts: Record<string, number> = {}
    data?.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })

    // 빈도순 정렬
    const popularTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }))

    return popularTags
  } catch (error) {
    console.error('인기 태그 조회 오류:', error)
    return []
  }
}

export default {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getComments,
  createComment,
  deleteComment,
  togglePostLike,
  toggleCommentLike,
  getPopularTags
}