/**
 * 이미지 관련 유틸리티 함수들
 * 프로필 이미지 기능이 제거되었으므로 텍스트 기반 아바타 관련 유틸리티만 제공합니다.
 */

/**
 * 사용자 이름에서 이니셜을 추출합니다.
 * @param name 사용자 이름
 * @returns 이니셜 문자열
 */
export function getInitials(name?: string): string {
  if (!name || !name.trim()) return '?'
  
  const trimmedName = name.trim()
  const names = trimmedName.split(/\s+/) // 하나 이상의 공백으로 분할
  
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase()
  }
  
  // 첫 번째와 마지막 이름의 첫 글자
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
}

/**
 * 이름을 기반으로 일관된 배경색을 생성합니다.
 * @param name 사용자 이름
 * @returns Tailwind CSS 클래스 문자열
 */
export function getAvatarColor(name?: string): string {
  if (!name) return 'bg-gray-100 text-gray-600'
  
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
    'bg-yellow-100 text-yellow-700',
    'bg-red-100 text-red-700',
    'bg-teal-100 text-teal-700'
  ]
  
  // 이름의 문자 코드 합을 사용하여 일관된 색상 선택
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

/**
 * 사용자 표시 이름을 정규화합니다.
 * @param name 원본 이름
 * @param email 이메일 (이름이 없을 경우 대체)
 * @returns 정규화된 표시 이름
 */
export function normalizeDisplayName(name?: string, email?: string): string {
  if (name && name.trim()) {
    return name.trim()
  }
  
  if (email) {
    // 이메일에서 @ 앞부분을 이름으로 사용
    const localPart = email.split('@')[0]
    return localPart.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  
  return '사용자'
}

/**
 * 아바타 크기에 따른 CSS 클래스를 반환합니다.
 * @param size 아바타 크기
 * @returns CSS 클래스 문자열
 */
export function getAvatarSizeClasses(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): string {
  const sizeMap = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  }
  
  return sizeMap[size] || sizeMap.md
}

/**
 * 프로필 이미지 관련 레거시 함수들 (더 이상 사용되지 않음)
 * 하위 호환성을 위해 빈 구현체로 유지
 */

/**
 * @deprecated 프로필 이미지 기능이 제거되었습니다. getInitials()를 사용하세요.
 */
export function getProfileImageUrl(): null {
  console.warn('getProfileImageUrl is deprecated. Profile images have been removed.')
  return null
}

/**
 * @deprecated 프로필 이미지 기능이 제거되었습니다. 텍스트 기반 아바타를 사용하세요.
 */
export function uploadProfileImage(): Promise<null> {
  console.warn('uploadProfileImage is deprecated. Profile images have been removed.')
  return Promise.resolve(null)
}

/**
 * @deprecated 프로필 이미지 기능이 제거되었습니다.
 */
export function deleteProfileImage(): Promise<void> {
  console.warn('deleteProfileImage is deprecated. Profile images have been removed.')
  return Promise.resolve()
}