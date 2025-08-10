import { useMemo } from 'react'
import { useDensity, DensityLevel } from '@/contexts/DensityContext'

/**
 * 밀도 최적화를 위한 커스텀 훅
 */
export function useDensityOptimization() {
  const { density, config, setDensity, getDensityClass } = useDensity()

  // 반응형 밀도 조정
  const getResponsiveDensity = useMemo(() => {
    return (screenSize: 'mobile' | 'tablet' | 'desktop'): DensityLevel => {
      switch (screenSize) {
        case 'mobile':
          return density === 'spacious' ? 'comfortable' : density
        case 'tablet':
          return density
        case 'desktop':
          return density
        default:
          return density
      }
    }
  }, [density])

  // 컴포넌트별 최적화된 스타일 생성
  const getOptimizedStyles = useMemo(() => {
    return (component: string, variant?: string) => {
      const baseStyles = {
        padding: config.padding.md,
        margin: config.spacing.sm,
        fontSize: config.fontSize.base,
        lineHeight: config.lineHeight.normal,
        borderRadius: config.borderRadius.md
      }

      // 컴포넌트별 특별 처리
      switch (component) {
        case 'button':
          return {
            ...baseStyles,
            padding: `${config.padding.xs} ${config.padding.sm}`,
            fontSize: config.fontSize.sm,
            minHeight: density === 'compact' ? '2rem' : 
                      density === 'comfortable' ? '2.5rem' : '3rem'
          }
        
        case 'input':
          return {
            ...baseStyles,
            padding: `${config.padding.xs} ${config.padding.sm}`,
            minHeight: density === 'compact' ? '2rem' : 
                      density === 'comfortable' ? '2.5rem' : '3rem'
          }
        
        case 'card':
          return {
            ...baseStyles,
            padding: config.padding.md,
            gap: config.spacing.sm
          }
        
        case 'list-item':
          return {
            ...baseStyles,
            padding: `${config.padding.xs} ${config.padding.sm}`,
            minHeight: density === 'compact' ? '2.5rem' : 
                      density === 'comfortable' ? '3rem' : '4rem'
          }
        
        case 'table-cell':
          return {
            ...baseStyles,
            padding: `${config.padding.xs} ${config.padding.sm}`,
            fontSize: density === 'compact' ? config.fontSize.sm : config.fontSize.base
          }
        
        default:
          return baseStyles
      }
    }
  }, [config, density])

  // 밀도별 그리드 설정
  const getGridConfig = useMemo(() => {
    return (baseColumns: number) => {
      switch (density) {
        case 'compact':
          return {
            columns: Math.min(baseColumns + 1, 6),
            gap: config.spacing.xs,
            itemHeight: 'auto'
          }
        case 'comfortable':
          return {
            columns: baseColumns,
            gap: config.spacing.sm,
            itemHeight: 'auto'
          }
        case 'spacious':
          return {
            columns: Math.max(baseColumns - 1, 1),
            gap: config.spacing.md,
            itemHeight: 'auto'
          }
        default:
          return {
            columns: baseColumns,
            gap: config.spacing.sm,
            itemHeight: 'auto'
          }
      }
    }
  }, [config, density])

  // 텍스트 크기 최적화
  const getOptimizedTextSize = useMemo(() => {
    return (textType: 'heading' | 'body' | 'caption' | 'label') => {
      switch (textType) {
        case 'heading':
          return density === 'compact' ? config.fontSize.lg : 
                 density === 'comfortable' ? config.fontSize.xl : 
                 config.fontSize.xl
        case 'body':
          return config.fontSize.base
        case 'caption':
          return config.fontSize.xs
        case 'label':
          return config.fontSize.sm
        default:
          return config.fontSize.base
      }
    }
  }, [config, density])

  // 애니메이션 지속시간 조정
  const getAnimationDuration = useMemo(() => {
    return (baseMs: number) => {
      switch (density) {
        case 'compact':
          return Math.max(baseMs * 0.8, 150) // 더 빠른 애니메이션
        case 'comfortable':
          return baseMs
        case 'spacious':
          return baseMs * 1.2 // 더 느린 애니메이션
        default:
          return baseMs
      }
    }
  }, [density])

  // 접근성 고려사항
  const getAccessibilityProps = useMemo(() => {
    return (component: string) => {
      const baseProps: Record<string, any> = {}

      // 터치 타겟 크기 보장
      if (['button', 'input', 'select'].includes(component)) {
        baseProps.style = {
          ...baseProps.style,
          minHeight: '44px', // WCAG 권장 최소 터치 타겟 크기
          minWidth: '44px'
        }
      }

      // 고대비 모드 지원
      if (density === 'compact') {
        baseProps['data-high-contrast'] = 'true'
      }

      return baseProps
    }
  }, [density])

  return {
    density,
    config,
    setDensity,
    getDensityClass,
    getResponsiveDensity,
    getOptimizedStyles,
    getGridConfig,
    getOptimizedTextSize,
    getAnimationDuration,
    getAccessibilityProps
  }
}

export default useDensityOptimization