'use client'

import React from 'react'
import { MessageCircle, Users, Heart, TrendingUp, ArrowRight, Plus } from 'lucide-react'

interface CommunityPost {
  id: string
  title: string
  author: string
  likes: number
  comments: number
  timeAgo: string
  category: string
}

interface CommunityShortcutProps {
  recentPosts: CommunityPost[]
  onGoToCommunity: () => void
  onCreatePost?: () => void
}

export default function CommunityShortcut({ 
  recentPosts, 
  onGoToCommunity, 
  onCreatePost 
}: CommunityShortcutProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case '성공후기':
        return 'bg-green-100 text-green-800'
      case '식단공유':
        return 'bg-orange-100 text-orange-800'
      case '운동팁':
        return 'bg-blue-100 text-blue-800'
      case '질문답변':
        return 'bg-purple-100 text-purple-800'
      case '일상공유':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">커뮤니티</h2>
        </div>
        <button
          onClick={onGoToCommunity}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          전체 보기
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* 커뮤니티 통계 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <Users className="w-6 h-6 text-purple-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-purple-600">1,234</p>
          <p className="text-xs text-purple-700">활성 회원</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <MessageCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-green-600">567</p>
          <p className="text-xs text-green-700">오늘 게시글</p>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-orange-600">89</p>
          <p className="text-xs text-orange-700">성공 후기</p>
        </div>
      </div>

      {/* 인기 게시글 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">인기 게시글</h3>
        {recentPosts.length === 0 ? (
          <div className="text-center py-6">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">아직 게시글이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPosts.slice(0, 3).map((post) => (
              <div
                key={post.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={onGoToCommunity}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(post.category)}`}>
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500">{post.timeAgo}</span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {post.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">by {post.author}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 빠른 액션 */}
      <div className="space-y-3">
        <button
          onClick={onGoToCommunity}
          className="w-full p-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="font-medium">커뮤니티 둘러보기</span>
        </button>

        {onCreatePost && (
          <button
            onClick={onCreatePost}
            className="w-full p-3 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">내 이야기 공유하기</span>
          </button>
        )}
      </div>

      {/* 커뮤니티 가이드 */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              함께 응원해요! 💪
            </h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              같은 목표를 가진 사람들과 경험을 나누고, 서로 격려하며 건강한 변화를 만들어가세요.
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">성공후기</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">식단공유</span>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">운동팁</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}