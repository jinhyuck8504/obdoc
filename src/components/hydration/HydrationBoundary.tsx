'use client'

import React, { useState, useEffect } from 'react'

interface HydrationBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  suppressHydrationWarning?: boolean
}

/**
 * HydrationBoundary는 SSR과 CSR 간의 안전한 전환을 보장하는 컴포넌트입니다.
 * 서버에서 렌더링된 HTML과 클라이언트에서 렌더링된 HTML이 다를 수 있는 
 * 컴포넌트를 래핑하여 hydration 오류를 방지합니다.
 */
export default function HydrationBoundary({ 
  children, 
  fallback = null,
  suppressHydrationWarning = false 
}: HydrationBoundaryProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // 클라이언트에서만 실행되므로 hydration이 완료되었음을 의미
    setIsHydrated(true)
  }, [])

  // 서버에서는 fallback을 렌더링하고, 클라이언트에서는 실제 children을 렌더링
  if (!isHydrated) {
    return (
      <div suppressHydrationWarning={suppressHydrationWarning}>
        {fallback}
      </div>
    )
  }

  return <>{children}</>
}