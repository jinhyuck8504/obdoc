'use client'
import React, { useState, useEffect } from 'react'
import { X, Heart, MessageCircle, Clock, Tag, Edit, Trash2, MoreHorizontal, Share2 } from 'lucide-react'
import { CommunityPost, POST_CATEGORIES } from '@/types/community'
import { getPost, togglePostLike, deletePost } from '@/lib/communityService'
import { useAuth } from '@/contexts/AuthContext'
import CommentSection from './CommentSection'

interface PostDetailProps {
  postId: string
  isOpen: boolean
  onClose: () => void
  onEdit: (post: CommunityPost) => void
  onDelete: (postId: string) => void
}

export default function PostDetail({ postId, isOpen, onClose, onEdit, onDelete }: PostDetailProps) {
  const { user } = useAuth()
  const [post, setPost] = useState<CommunityPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    if (isOpen && postId) {
      loadPost()
    }
  }, [isOpen, postId])

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenu(false)
    }
    
    if (showMenu && typeof document !== 'undefined') {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMenu])

  const loadPost = async () => {
    try {
      setLoading(true)
      const postData = await getPost(postId)
      setPost(postData)
    } catch (error) {
      console.error('게시글 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    console.log('게시글 좋아요 클릭:', { post: post?.id, user: user?.id })
    
    if (!post) {
      console.log('게시글 정보가 없음')
      return
    }
    
    // 개발 환경에서 임시 사용자 정보 사용
    const userId = user?.id || 'user1'
    console.log('사용할 사용자 ID:', userId)

    try {
      console.log('togglePostLike 호출 시작')
      const result = await togglePostLike(post.id, userId)
      console.log('좋아요 결과:', result)
      
      setPost(prev => prev ? {
        ...prev,
        isLiked: result.liked,
        likes: result.likes
      } : null)
      console.log('좋아요 UI 업데이트 완료')
    } catch (error) {
      console.error('좋아요 처리 실패:', error)
    }
  }

  const handleDelete = async () => {
    if (!post || !confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return
    }

    try {
      await deletePost(post.id)
      onDelete(post.id)
      onClose()
    } catch (error) {
      console.error('게시글 삭제 실패:', error)
      alert('게시글 삭제에 실패했습니다.')
    }
  }

  const handleEdit = () => {
    if (post) {
      onEdit(post)
      onClose()
    }
  }

  const handleShare = async () => {
    if (!post) return

    try {
      await navigator.share({
        title: post.title,
        text: post.content.substring(0, 100) + '...',
        url: window.location.href
      })
    } catch (error) {
      // Web Share API를 지원하지 않는 경우 URL 복사
      navigator.clipboard.writeText(window.location.href)
      alert('링크가 클립보드에 복사되었습니다!')
    }
  }

  const handleCommentCountChange = (count: number) => {
    setPost(prev => {
      if (prev) {
        const updatedPost = { ...prev, commentCount: count }
        // 부모 컴포넌트에도 업데이트 알림 (필요시)
        return updatedPost
      }
      return null
    })
  }

  const isMyPost = () => {
    const userId = user?.id || 'user1'
    return post?.authorId === userId
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return '방금 전'
    if (diffInHours < 24) return `${diffInHours}시간 전`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}일 전`
    
    return date.toLocaleDateString('ko-KR')
  }

  const getCategoryInfo = (category: string) => {
    return POST_CATEGORIES.find(cat => cat.value === category) || POST_CATEGORIES[POST_CATEGORIES.length - 1]
  }

  const renderContent = (content: string) => {
    // 간단한 마크다운 렌더링
    return content
      .split('\n')
      .map((line, index) => {
        // 제목 처리
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-semibold text-gray-900 mt-4 mb-2">{line.substring(4)}</h3>
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold text-gray-900 mt-4 mb-2">{line.substring(3)}</h2>
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold text-gray-900 mt-4 mb-2">{line.substring(2)}</h1>
        }
        
        // 리스트 처리
        if (line.startsWith('- ')) {
          return <li key={index} className="ml-4 list-disc">{line.substring(2)}</li>
        }
        
        // 굵은 글씨 처리
        const boldText = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        return (
          <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: boldText }} />
        )
      })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">게시글</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="공유"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          ) : !post ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">게시글을 찾을 수 없습니다.</p>
            </div>
          ) : (
            <div className="p-6">
              {/* 작성자 정보 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                    {post.authorNickname.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{post.authorNickname}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryInfo(post.category).color}`}>
                        {getCategoryInfo(post.category).label}
                      </span>
                      {isMyPost() && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          내 글
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimeAgo(post.createdAt)}
                    </div>
                  </div>
                </div>

                {/* 메뉴 버튼 (내 글인 경우만) */}
                {isMyPost() && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(!showMenu)
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    
                    {showMenu && (
                      <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                        <button
                          onClick={handleEdit}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          수정
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 제목 */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>

              {/* 내용 */}
              <div className="prose max-w-none mb-6 text-gray-700 leading-relaxed">
                {renderContent(post.content)}
              </div>

              {/* 이미지 */}
              {post.imageUrl && (
                <div className="mb-6">
                  <img
                    src={post.imageUrl}
                    alt="게시글 이미지"
                    className="max-w-full h-auto rounded-lg border border-gray-300"
                  />
                </div>
              )}

              {/* 태그 */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 좋아요/댓글 버튼 */}
              <div className="flex items-center space-x-6 py-4 border-t border-b border-gray-200 mb-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    post.isLiked 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                  <span className="font-medium">{post.likes}</span>
                  <span className="text-sm">좋아요</span>
                </button>
                <div className="flex items-center space-x-2 text-gray-600">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{post.commentCount}</span>
                  <span className="text-sm">댓글</span>
                </div>
              </div>

              {/* 댓글 섹션 */}
              <CommentSection 
                postId={post.id}
                commentCount={post.commentCount}
                onCommentCountChange={handleCommentCountChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}