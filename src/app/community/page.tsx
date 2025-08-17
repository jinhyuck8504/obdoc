'use client'
import React, { useState } from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import BackButton from '@/components/common/BackButton'
import PostList from '@/components/community/PostList'
import PostForm from '@/components/community/PostForm'
import PostDetail from '@/components/community/PostDetail'
import { Post, CreatePostRequest } from '@/types/community'
import { createPost, updatePost } from '@/lib/communityService'
import { useAuth } from '@/contexts/AuthContext'
import { useSession } from '@/hooks/useSession'

export default function CommunityPage() {
  const { user } = useAuth()
  const [showPostForm, setShowPostForm] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [showPostDetail, setShowPostDetail] = useState(false)
  const [detailPostId, setDetailPostId] = useState<string | null>(null)

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // 세션 관리
  useSession({
    onSessionExpiry: () => {
      alert('세션이 만료되었습니다. 다시 로그인해주세요.')
    }
  })

  const handleCreatePost = async (data: CreatePostRequest) => {
    try {
      if (editingPost) {
        // 수정 모드
        await updatePost(editingPost.id, data)
      } else {
        // 생성 모드
        await createPost({
          ...data,
          authorId: user?.id || 'user1'
        })
      }
      // PostList 새로고침 트리거
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('게시글 저장 실패:', error)
      throw error
    }
  }

  const handlePostClick = (post: Post) => {
    setDetailPostId(post.id)
    setShowPostDetail(true)
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setShowPostForm(true)
  }

  const handleClosePostForm = () => {
    setShowPostForm(false)
    setEditingPost(null)
  }

  const handlePostDelete = (postId: string) => {
    // PostList 새로고침 트리거
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <BackButton className="mb-2" />
        <PostList 
          onPostClick={handlePostClick}
          onCreatePost={() => setShowPostForm(true)}
          onEditPost={handleEditPost}
          refreshTrigger={refreshTrigger}
        />
        
        <PostForm
          isOpen={showPostForm}
          onClose={handleClosePostForm}
          onSave={handleCreatePost}
          initialData={editingPost ? {
            title: editingPost.title,
            content: editingPost.content,
            category: editingPost.category,
            tags: editingPost.tags
          } : undefined}
        />

        {detailPostId && (
          <PostDetail
            postId={detailPostId}
            isOpen={showPostDetail}
            onClose={() => {
              setShowPostDetail(false)
              setDetailPostId(null)
            }}
            onEdit={handleEditPost}
            onDelete={handlePostDelete}
          />
        )}
      </div>
    </AuthGuard>
  )
}