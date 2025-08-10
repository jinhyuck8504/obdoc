'use client'

import React, { useState, useEffect } from 'react'

interface ClientOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * ClientOnly는 클라이언트에서만 렌더링되어야 하는 컴포넌트를 래핑합니다.
 * 서버에서는 fallback을 렌더링하고, 클라이언트에서만 실제 컴포넌트를 렌더링하여
 * hydration 불일치를 방지합니다.
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}