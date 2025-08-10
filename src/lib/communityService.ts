import { CommunityPost, CommunityComment, PostFormData, CommentFormData, PostFilters, PostCategory } from '@/types/community'

// Mock 데이터 저장소
let mockPosts: CommunityPost[] = [
  {
    id: '1',
    title: '3개월만에 10kg 감량 성공! 제가 한 방법들을 공유해요',
    content: `안녕하세요! 드디어 목표했던 10kg 감량에 성공해서 경험을 공유하고 싶어요.

**시작 체중**: 75kg → **현재 체중**: 65kg

## 제가 실천한 방법들:

### 1. 식단 관리
- 하루 3끼 규칙적으로 먹기
- 탄수화물 줄이고 단백질 늘리기
- 저녁 8시 이후 금식
- 물 하루 2L 이상 마시기

### 2. 운동
- 주 3회 헬스장 (근력운동 + 유산소)
- 매일 30분 이상 걷기
- 계단 이용하기

### 3. 생활습관
- 일찍 자고 일찍 일어나기
- 스트레스 관리
- 체중 매일 기록하기

정말 힘들었지만 포기하지 않고 꾸준히 했더니 결과가 나왔어요! 
여러분도 할 수 있습니다. 화이팅! 💪`,
    authorId: 'user1',
    authorNickname: '다이어터123',
    category: 'success-story',
    tags: ['성공후기', '10kg감량', '식단', '운동', '동기부여'],
    likes: 45,
    commentCount: 23,
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    title: '저칼로리 도시락 레시피 모음 (사진 많음)',
    content: `직장인이라 도시락을 싸가는데, 다이어트용 저칼로리 도시락 레시피들을 정리해봤어요!

## 🍱 월요일 도시락 (약 400kcal)
- 현미밥 100g
- 닭가슴살 구이 80g
- 브로콜리 무침
- 당근 볶음
- 방울토마토

## 🍱 화요일 도시락 (약 380kcal)
- 잡곡밥 90g
- 두부 스테이크
- 시금치 나물
- 오이 무침
- 삶은 달걀 1개

매주 메뉴를 바꿔가면서 만들고 있어요. 
맛도 좋고 포만감도 있어서 추천합니다!

궁금한 레시피 있으면 댓글로 물어보세요~ 😊`,
    authorId: 'user2',
    authorNickname: '건강요리사',
    category: 'diet-tips',
    tags: ['도시락', '레시피', '저칼로리', '식단', '직장인'],
    likes: 32,
    commentCount: 18,
    createdAt: '2024-01-19T14:15:00Z',
    updatedAt: '2024-01-19T14:15:00Z'
  },
  {
    id: '3',
    title: '집에서 할 수 있는 간단한 운동 루틴 추천',
    content: `헬스장 가기 어려운 분들을 위해 집에서 할 수 있는 운동 루틴을 공유해요!

## 🏃‍♀️ 20분 홈트레이닝

### 워밍업 (5분)
- 제자리 걷기 2분
- 팔 돌리기 1분
- 무릎 올리기 2분

### 메인 운동 (12분)
1. **스쿼트** - 15회 x 3세트
2. **푸시업** - 10회 x 3세트 (무릎 대고 해도 OK)
3. **플랭크** - 30초 x 3세트
4. **런지** - 각 다리 10회 x 2세트

### 쿨다운 (3분)
- 스트레칭

매일 하지 말고 격일로 하는 게 좋아요!
처음엔 힘들어도 2주 정도 하면 익숙해집니다 💪`,
    authorId: 'user3',
    authorNickname: '홈트레이너',
    category: 'exercise-tips',
    tags: ['홈트레이닝', '운동', '루틴', '초보자', '집에서'],
    likes: 28,
    commentCount: 15,
    createdAt: '2024-01-18T16:45:00Z',
    updatedAt: '2024-01-18T16:45:00Z'
  },
  {
    id: '4',
    title: '다이어트 중 스트레스 받을 때 어떻게 하시나요?',
    content: `다이어트 시작한 지 한 달 정도 됐는데요, 
요즘 스트레스를 받으면 자꾸 폭식하고 싶어져요 😭

특히 직장에서 힘든 일이 있으면 치킨이나 피자 같은 걸 
막 시켜먹고 싶어지는데... 

여러분은 이럴 때 어떻게 극복하시나요?
좋은 방법이 있다면 공유해주세요!`,
    authorId: 'user4',
    authorNickname: '다이어트초보',
    category: 'question',
    tags: ['스트레스', '폭식', '질문', '도움', '극복방법'],
    likes: 12,
    commentCount: 31,
    createdAt: '2024-01-17T20:20:00Z',
    updatedAt: '2024-01-17T20:20:00Z'
  },
  {
    id: '5',
    title: '오늘도 운동 완료! 함께 화이팅해요 🔥',
    content: `오늘 아침 6시에 일어나서 1시간 운동했어요!
처음엔 정말 일어나기 싫었는데 막상 하고 나니 기분이 너무 좋네요 😊

**오늘의 운동:**
- 러닝머신 30분 (5km)
- 근력운동 30분

다들 오늘 하루도 화이팅하세요! 
작은 실천이 모여서 큰 변화를 만든다고 믿어요 💪

#오늘의운동 #모닝운동 #화이팅`,
    authorId: 'user5',
    authorNickname: '모닝러너',
    category: 'motivation',
    tags: ['동기부여', '모닝운동', '화이팅', '실천', '운동완료'],
    likes: 19,
    commentCount: 8,
    createdAt: '2024-01-16T07:30:00Z',
    updatedAt: '2024-01-16T07:30:00Z'
  }
]

let mockComments: CommunityComment[] = [
  {
    id: '1',
    postId: '1',
    content: '정말 대단하세요! 저도 10kg가 목표인데 동기부여가 됩니다 👍',
    authorId: 'user6',
    authorNickname: '화이팅맨',
    likes: 5,
    createdAt: '2024-01-20T11:00:00Z',
    updatedAt: '2024-01-20T11:00:00Z'
  },
  {
    id: '2',
    postId: '1',
    content: '식단 관리가 정말 중요한 것 같아요. 저도 따라해보겠습니다!',
    authorId: 'user7',
    authorNickname: '다이어트중',
    likes: 3,
    createdAt: '2024-01-20T12:15:00Z',
    updatedAt: '2024-01-20T12:15:00Z'
  }
]

// 게시글 목록 조회
export async function getPosts(filters?: PostFilters): Promise<CommunityPost[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredPosts = [...mockPosts]

      // 카테고리 필터
      if (filters?.category) {
        filteredPosts = filteredPosts.filter(post => post.category === filters.category)
      }

      // 태그 필터
      if (filters?.tags && filters.tags.length > 0) {
        filteredPosts = filteredPosts.filter(post => 
          filters.tags!.some(tag => post.tags.includes(tag))
        )
      }

      // 검색 필터
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase()
        filteredPosts = filteredPosts.filter(post => 
          post.title.toLowerCase().includes(searchTerm) ||
          post.content.toLowerCase().includes(searchTerm) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        )
      }

      // 정렬
      switch (filters?.sortBy) {
        case 'popular':
          filteredPosts.sort((a, b) => (b.likes + b.commentCount) - (a.likes + a.commentCount))
          break
        case 'most-liked':
          filteredPosts.sort((a, b) => b.likes - a.likes)
          break
        case 'latest':
        default:
          filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          break
      }

      resolve(filteredPosts)
    }, 500)
  })
}

// 게시글 상세 조회
export async function getPost(postId: string): Promise<CommunityPost | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const post = mockPosts.find(p => p.id === postId)
      resolve(post || null)
    }, 300)
  })
}

// 게시글 작성
export async function createPost(userId: string, data: PostFormData): Promise<CommunityPost> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newPost: CommunityPost = {
        id: Date.now().toString(),
        title: data.title,
        content: data.content,
        authorId: userId,
        authorNickname: generateNickname(userId), // 익명 닉네임 생성
        category: data.category,
        tags: data.tags,
        imageUrl: data.image ? URL.createObjectURL(data.image) : undefined,
        likes: 0,
        commentCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      mockPosts.unshift(newPost)
      resolve(newPost)
    }, 800)
  })
}

// 게시글 수정
export async function updatePost(postId: string, data: Partial<PostFormData>): Promise<CommunityPost> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const postIndex = mockPosts.findIndex(p => p.id === postId)
      if (postIndex === -1) {
        reject(new Error('게시글을 찾을 수 없습니다'))
        return
      }

      mockPosts[postIndex] = {
        ...mockPosts[postIndex],
        ...data,
        updatedAt: new Date().toISOString()
      }

      resolve(mockPosts[postIndex])
    }, 800)
  })
}

// 게시글 삭제
export async function deletePost(postId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const postIndex = mockPosts.findIndex(p => p.id === postId)
      if (postIndex === -1) {
        reject(new Error('게시글을 찾을 수 없습니다'))
        return
      }

      mockPosts.splice(postIndex, 1)
      // 관련 댓글도 삭제
      mockComments = mockComments.filter(c => c.postId !== postId)
      resolve()
    }, 500)
  })
}

// 게시글 좋아요/취소
export async function togglePostLike(postId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const post = mockPosts.find(p => p.id === postId)
      if (post) {
        const isLiked = post.isLiked || false
        post.isLiked = !isLiked
        post.likes += isLiked ? -1 : 1
        
        resolve({
          liked: post.isLiked,
          likes: post.likes
        })
      }
    }, 300)
  })
}

// 댓글 목록 조회
export async function getComments(postId: string): Promise<CommunityComment[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const comments = mockComments
        .filter(c => c.postId === postId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      resolve(comments)
    }, 400)
  })
}

// 댓글 작성
export async function createComment(postId: string, userId: string, data: CommentFormData): Promise<CommunityComment> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newComment: CommunityComment = {
        id: Date.now().toString(),
        postId,
        content: data.content,
        authorId: userId,
        authorNickname: generateNickname(userId),
        likes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      mockComments.push(newComment)
      
      // 게시글의 댓글 수 증가
      const post = mockPosts.find(p => p.id === postId)
      if (post) {
        post.commentCount++
      }

      resolve(newComment)
    }, 600)
  })
}

// 댓글 삭제
export async function deleteComment(commentId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const commentIndex = mockComments.findIndex(c => c.id === commentId)
      if (commentIndex === -1) {
        reject(new Error('댓글을 찾을 수 없습니다'))
        return
      }

      const comment = mockComments[commentIndex]
      mockComments.splice(commentIndex, 1)

      // 게시글의 댓글 수 감소
      const post = mockPosts.find(p => p.id === comment.postId)
      if (post) {
        post.commentCount--
      }

      resolve()
    }, 400)
  })
}

// 댓글 좋아요/취소
export async function toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const comment = mockComments.find(c => c.id === commentId)
      if (comment) {
        const isLiked = comment.isLiked || false
        comment.isLiked = !isLiked
        comment.likes += isLiked ? -1 : 1
        
        resolve({
          liked: comment.isLiked,
          likes: comment.likes
        })
      } else {
        reject(new Error('댓글을 찾을 수 없습니다'))
      }
    }, 300)
  })
}

// 익명 닉네임 생성 (사용자 ID 기반)
function generateNickname(userId: string): string {
  const adjectives = ['행복한', '건강한', '열정적인', '긍정적인', '활기찬', '멋진', '용감한', '지혜로운']
  const nouns = ['다이어터', '운동러', '건강이', '파이터', '챌린저', '워리어', '러너', '트레이너']
  
  // userId를 기반으로 일관된 닉네임 생성
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const adjIndex = Math.abs(hash) % adjectives.length
  const nounIndex = Math.abs(hash >> 8) % nouns.length
  const number = Math.abs(hash >> 16) % 999 + 1
  
  return `${adjectives[adjIndex]}${nouns[nounIndex]}${number}`
}

// 인기 태그 조회
export async function getPopularTags(): Promise<string[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 실제로는 게시글에서 태그 빈도를 계산해야 함
      const tagCounts: { [key: string]: number } = {}
      
      mockPosts.forEach(post => {
        post.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      })
      
      const popularTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag)
      
      resolve(popularTags)
    }, 200)
  })
}