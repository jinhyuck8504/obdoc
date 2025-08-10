import { hydrationErrorLogger } from './errorLogger'

export interface RecoveryStrategy {
  name: string
  execute: () => Promise<boolean>
  description: string
}

/**
 * Hydration 오류 복구를 위한 유틸리티 클래스
 */
export class HydrationRecoveryManager {
  private strategies: RecoveryStrategy[] = []

  constructor() {
    this.initializeDefaultStrategies()
  }

  /**
   * 기본 복구 전략들을 초기화합니다.
   */
  private initializeDefaultStrategies(): void {
    this.strategies = [
      {
        name: 'soft-refresh',
        description: '컴포넌트 상태 재설정',
        execute: async () => {
          try {
            // React의 상태를 강제로 재설정
            if (typeof window !== 'undefined') {
              // 현재 페이지의 React 컴포넌트들을 다시 마운트
              const event = new CustomEvent('hydration-recovery', {
                detail: { strategy: 'soft-refresh' }
              })
              window.dispatchEvent(event)
              return true
            }
            return false
          } catch (error) {
            hydrationErrorLogger.logError(error as Error, 'RecoveryManager.soft-refresh')
            return false
          }
        }
      },
      {
        name: 'clear-cache',
        description: '브라우저 캐시 정리',
        execute: async () => {
          try {
            if (typeof window !== 'undefined' && 'caches' in window) {
              const cacheNames = await caches.keys()
              await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
              )
              return true
            }
            return false
          } catch (error) {
            hydrationErrorLogger.logError(error as Error, 'RecoveryManager.clear-cache')
            return false
          }
        }
      },
      {
        name: 'reload-page',
        description: '페이지 새로고침',
        execute: async () => {
          try {
            if (typeof window !== 'undefined') {
              window.location.reload()
              return true
            }
            return false
          } catch (error) {
            hydrationErrorLogger.logError(error as Error, 'RecoveryManager.reload-page')
            return false
          }
        }
      }
    ]
  }

  /**
   * 복구 전략을 추가합니다.
   */
  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy)
  }

  /**
   * 복구 전략을 실행합니다.
   */
  async executeRecovery(strategyName?: string): Promise<boolean> {
    const strategy = strategyName 
      ? this.strategies.find(s => s.name === strategyName)
      : this.strategies[0] // 기본적으로 첫 번째 전략 사용

    if (!strategy) {
      console.warn(`Recovery strategy '${strategyName}' not found`)
      return false
    }

    try {
      console.log(`Executing recovery strategy: ${strategy.name}`)
      const result = await strategy.execute()
      
      if (result) {
        console.log(`Recovery strategy '${strategy.name}' succeeded`)
      } else {
        console.warn(`Recovery strategy '${strategy.name}' failed`)
      }
      
      return result
    } catch (error) {
      console.error(`Error executing recovery strategy '${strategy.name}':`, error)
      hydrationErrorLogger.logError(error as Error, `RecoveryManager.${strategy.name}`)
      return false
    }
  }

  /**
   * 모든 복구 전략을 순차적으로 시도합니다.
   */
  async executeAllStrategies(): Promise<boolean> {
    for (const strategy of this.strategies) {
      const success = await this.executeRecovery(strategy.name)
      if (success) {
        return true
      }
      
      // 각 전략 사이에 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    return false
  }

  /**
   * 사용 가능한 복구 전략 목록을 반환합니다.
   */
  getAvailableStrategies(): RecoveryStrategy[] {
    return [...this.strategies]
  }
}

/**
 * Hydration 오류 감지 및 자동 복구를 위한 유틸리티 함수들
 */
export const hydrationUtils = {
  /**
   * 현재 환경이 hydration 중인지 확인합니다.
   */
  isHydrating(): boolean {
    if (typeof window === 'undefined') return false
    
    // React의 hydration 상태를 확인하는 여러 방법
    const hasReactRoot = document.querySelector('[data-reactroot]') !== null
    const hasHydrationMarkers = document.querySelector('[data-react-hydrate]') !== null
    
    return hasReactRoot || hasHydrationMarkers
  },

  /**
   * DOM 불일치를 감지합니다.
   */
  detectDOMInconsistency(): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      // 서버에서 렌더링된 HTML과 클라이언트에서 예상되는 HTML 비교
      const serverHTML = document.documentElement.outerHTML
      const clientHTML = document.cloneNode(true)
      
      // 간단한 불일치 감지 (실제로는 더 정교한 비교가 필요)
      return serverHTML.length !== (clientHTML as Document).documentElement.outerHTML.length
    } catch (error) {
      hydrationErrorLogger.logError(error as Error, 'hydrationUtils.detectDOMInconsistency')
      return false
    }
  },

  /**
   * Hydration 오류 리스너를 설정합니다.
   */
  setupHydrationErrorListener(): void {
    if (typeof window === 'undefined') return

    // React의 hydration 오류를 감지
    const originalError = console.error
    console.error = (...args) => {
      const message = args[0]
      if (typeof message === 'string' && 
          (message.includes('Hydration') || message.includes('hydration'))) {
        hydrationErrorLogger.logError(
          new Error(message), 
          'HydrationErrorListener'
        )
      }
      originalError.apply(console, args)
    }

    // 전역 오류 핸들러
    window.addEventListener('error', (event) => {
      if (event.error && 
          (event.error.message.includes('Hydration') || 
           event.error.message.includes('hydration'))) {
        hydrationErrorLogger.logError(event.error, 'GlobalErrorHandler')
      }
    })

    // Promise rejection 핸들러
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && 
          typeof event.reason.message === 'string' &&
          (event.reason.message.includes('Hydration') || 
           event.reason.message.includes('hydration'))) {
        hydrationErrorLogger.logError(event.reason, 'UnhandledRejection')
      }
    })
  }
}

// 싱글톤 인스턴스
export const recoveryManager = new HydrationRecoveryManager()

// 자동으로 오류 리스너 설정
if (typeof window !== 'undefined') {
  hydrationUtils.setupHydrationErrorListener()
}