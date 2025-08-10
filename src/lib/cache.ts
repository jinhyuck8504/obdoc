// 캐싱 시스템

import React from "react"

// 캐시 엔트리 인터페이스
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

// 캐시 옵션
interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
  strategy?: 'LRU' | 'LFU' | 'FIFO' // Eviction strategy
}

// 메모리 캐시 클래스
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private readonly maxSize: number
  private readonly defaultTTL: number
  private readonly strategy: 'LRU' | 'LFU' | 'FIFO'

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100
    this.defaultTTL = options.ttl || 5 * 60 * 1000 // 5분
    this.strategy = options.strategy || 'LRU'
  }

  // 데이터 저장
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: now
    }

    // 캐시 크기 제한 확인
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evict()
    }

    this.cache.set(key, entry)
  }

  // 데이터 가져오기
  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()

    // TTL 확인
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    // 접근 통계 업데이트
    entry.accessCount++
    entry.lastAccessed = now

    return entry.data
  }

  // 데이터 존재 확인
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  // 데이터 삭제
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // 캐시 비우기
  clear(): void {
    this.cache.clear()
  }

  // 만료된 엔트리 정리
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // 캐시 통계
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0
    let totalAccessCount = 0

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++
      } else {
        validEntries++
        totalAccessCount += entry.accessCount
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: totalAccessCount > 0 ? validEntries / totalAccessCount : 0,
      memoryUsage: this.getMemoryUsage()
    }
  }

  // 메모리 사용량 추정
  private getMemoryUsage(): number {
    let size = 0
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2 // UTF-16
      size += JSON.stringify(entry.data).length * 2
      size += 64 // 메타데이터 추정
    }
    return size
  }

  // 캐시 제거 전략 실행
  private evict(): void {
    if (this.cache.size === 0) return

    let keyToEvict: string | null = null

    switch (this.strategy) {
      case 'LRU': // Least Recently Used
        let oldestAccess = Date.now()
        for (const [key, entry] of this.cache.entries()) {
          if (entry.lastAccessed < oldestAccess) {
            oldestAccess = entry.lastAccessed
            keyToEvict = key
          }
        }
        break

      case 'LFU': // Least Frequently Used
        let lowestCount = Infinity
        for (const [key, entry] of this.cache.entries()) {
          if (entry.accessCount < lowestCount) {
            lowestCount = entry.accessCount
            keyToEvict = key
          }
        }
        break

      case 'FIFO': // First In, First Out
        let oldestTimestamp = Date.now()
        for (const [key, entry] of this.cache.entries()) {
          if (entry.timestamp < oldestTimestamp) {
            oldestTimestamp = entry.timestamp
            keyToEvict = key
          }
        }
        break
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict)
    }
  }
}

// 로컬 스토리지 캐시 클래스
export class LocalStorageCache<T = any> {
  protected readonly prefix: string
  protected readonly defaultTTL: number

  constructor(prefix = 'obdoc_cache_', defaultTTL = 24 * 60 * 60 * 1000) {
    this.prefix = prefix
    this.defaultTTL = defaultTTL
  }

  // 데이터 저장
  set(key: string, data: T, ttl?: number): void {
    if (typeof window === 'undefined') return

    const entry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    }

    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(entry))
    } catch (error) {
      console.warn('LocalStorage cache set failed:', error)
      // 스토리지가 가득 찬 경우 오래된 항목 정리
      this.cleanup()
      try {
        localStorage.setItem(this.prefix + key, JSON.stringify(entry))
      } catch (retryError) {
        console.error('LocalStorage cache set failed after cleanup:', retryError)
      }
    }
  }

  // 데이터 가져오기
  get(key: string): T | null {
    if (typeof window === 'undefined') return null

    try {
      const item = localStorage.getItem(this.prefix + key)
      if (!item) return null

      const entry = JSON.parse(item)
      const now = Date.now()

      if (now - entry.timestamp > entry.ttl) {
        localStorage.removeItem(this.prefix + key)
        return null
      }

      return entry.data
    } catch (error) {
      console.warn('LocalStorage cache get failed:', error)
      return null
    }
  }

  // 데이터 존재 확인
  has(key: string): boolean {
    return this.get(key) !== null
  }

  // 데이터 삭제
  delete(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.prefix + key)
  }

  // 캐시 비우기
  clear(): void {
    if (typeof window === 'undefined') return

    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
      }
    })
  }

  // 만료된 엔트리 정리
  cleanup(): void {
    if (typeof window === 'undefined') return

    const now = Date.now()
    const keys = Object.keys(localStorage)

    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const item = localStorage.getItem(key)
          if (item) {
            const entry = JSON.parse(item)
            if (now - entry.timestamp > entry.ttl) {
              localStorage.removeItem(key)
            }
          }
        } catch (error) {
          // 파싱 실패한 항목 제거
          localStorage.removeItem(key)
        }
      }
    })
  }
}

// 세션 스토리지 캐시 클래스
export class SessionStorageCache<T = any> extends LocalStorageCache<T> {
  set(key: string, data: T, ttl?: number): void {
    if (typeof window === 'undefined') return

    const entry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    }

    try {
      sessionStorage.setItem(this.prefix + key, JSON.stringify(entry))
    } catch (error) {
      console.warn('SessionStorage cache set failed:', error)
    }
  }

  get(key: string): T | null {
    if (typeof window === 'undefined') return null

    try {
      const item = sessionStorage.getItem(this.prefix + key)
      if (!item) return null

      const entry = JSON.parse(item)
      const now = Date.now()

      if (now - entry.timestamp > entry.ttl) {
        sessionStorage.removeItem(this.prefix + key)
        return null
      }

      return entry.data
    } catch (error) {
      console.warn('SessionStorage cache get failed:', error)
      return null
    }
  }

  delete(key: string): void {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(this.prefix + key)
  }

  clear(): void {
    if (typeof window === 'undefined') return

    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key)
      }
    })
  }
}

// 캐시 매니저 클래스
export class CacheManager {
  private memoryCache: MemoryCache
  private localStorageCache: LocalStorageCache
  private sessionStorageCache: SessionStorageCache

  constructor() {
    this.memoryCache = new MemoryCache({ maxSize: 200, ttl: 5 * 60 * 1000 })
    this.localStorageCache = new LocalStorageCache()
    this.sessionStorageCache = new SessionStorageCache()

    // 주기적으로 정리
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.memoryCache.cleanup()
        this.localStorageCache.cleanup()
      }, 10 * 60 * 1000) // 10분마다
    }
  }

  // 메모리 캐시 사용
  memory = {
    set: <T>(key: string, data: T, ttl?: number) => this.memoryCache.set(key, data, ttl),
    get: <T>(key: string): T | null => this.memoryCache.get(key),
    has: (key: string) => this.memoryCache.has(key),
    delete: (key: string) => this.memoryCache.delete(key),
    clear: () => this.memoryCache.clear(),
    stats: () => this.memoryCache.getStats()
  }

  // 로컬 스토리지 캐시 사용
  local = {
    set: <T>(key: string, data: T, ttl?: number) => this.localStorageCache.set(key, data, ttl),
    get: <T>(key: string): T | null => this.localStorageCache.get(key),
    has: (key: string) => this.localStorageCache.has(key),
    delete: (key: string) => this.localStorageCache.delete(key),
    clear: () => this.localStorageCache.clear()
  }

  // 세션 스토리지 캐시 사용
  session = {
    set: <T>(key: string, data: T, ttl?: number) => this.sessionStorageCache.set(key, data, ttl),
    get: <T>(key: string): T | null => this.sessionStorageCache.get(key),
    has: (key: string) => this.sessionStorageCache.has(key),
    delete: (key: string) => this.sessionStorageCache.delete(key),
    clear: () => this.sessionStorageCache.clear()
  }

  // 다층 캐시 (메모리 -> 로컬 스토리지 순서로 확인)
  multilayer = {
    get: <T>(key: string): T | null => {
      // 먼저 메모리 캐시 확인
      let data = this.memoryCache.get(key) as T | null
      if (data !== null) return data

      // 로컬 스토리지 확인
      data = this.localStorageCache.get(key) as T | null
      if (data !== null) {
        // 메모리 캐시에도 저장
        this.memoryCache.set(key, data, 5 * 60 * 1000)
        return data
      }

      return null
    },

    set: <T>(key: string, data: T, ttl?: number) => {
      this.memoryCache.set(key, data, Math.min(ttl || 5 * 60 * 1000, 5 * 60 * 1000))
      this.localStorageCache.set(key, data, ttl)
    },

    delete: (key: string) => {
      this.memoryCache.delete(key)
      this.localStorageCache.delete(key)
    }
  }
}

// 캐시 데코레이터
export function cached(
  keyGenerator: (...args: any[]) => string,
  ttl: number = 5 * 60 * 1000,
  cacheType: 'memory' | 'local' | 'session' | 'multilayer' = 'memory'
) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const cache = cacheManager[cacheType]

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(...args)

      // 캐시에서 확인
      const cachedResult = cache.get(cacheKey)
      if (cachedResult !== null) {
        return cachedResult
      }

      // 캐시 미스 시 원본 메서드 실행
      const result = await originalMethod.apply(this, args)

      // 결과를 캐시에 저장
      cache.set(cacheKey, result, ttl)

      return result
    }

    return descriptor
  }
}

// React 캐시 훅
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number
    cacheType?: 'memory' | 'local' | 'session' | 'multilayer'
    enabled?: boolean
  } = {}
) {
  const { ttl = 5 * 60 * 1000, cacheType = 'memory', enabled = true } = options
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const cache = cacheManager[cacheType]

  const fetchData = React.useCallback(async (forceRefresh = false) => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      // 강제 새로고침이 아닌 경우 캐시 확인
      if (!forceRefresh) {
        const cachedData = cache.get(key) as T | null
        if (cachedData !== null) {
          setData(cachedData)
          setLoading(false)
          return cachedData
        }
      }

      // 데이터 페치
      const result = await fetcher()

      // 캐시에 저장
      cache.set(key, result, ttl)
      setData(result)

      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, ttl, enabled, cache])

  // 초기 로드
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const invalidate = React.useCallback(() => {
    cache.delete(key)
    return fetchData(true)
  }, [key, cache, fetchData])

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    invalidate
  }
}

// 전역 캐시 매니저 인스턴스
export const cacheManager = new CacheManager()

export default cacheManager