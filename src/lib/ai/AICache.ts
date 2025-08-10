// AI Cache - AI 분석 결과 캐싱 시스템

import { AIAnalysis } from '@/types/challenge'

interface CacheEntry {
  data: AIAnalysis
  timestamp: number
  ttl: number
}

export class AICache {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize: number = 1000 // 최대 캐시 항목 수
  private cleanupInterval: NodeJS.Timeout
  
  constructor() {
    // 5분마다 만료된 캐시 정리
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }
  
  /**
   * 캐시에서 데이터 조회
   */
  async get(key: string): Promise<AIAnalysis | null> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    // TTL 확인
    if (Date.now() > entry.timestamp + entry.ttl * 1000) {
      this.cache.delete(key)
      return null
    }
    
    // 캐시 히트 로그
    console.log(`Cache hit for key: ${key}`)
    
    return entry.data
  }
  
  /**
   * 캐시에 데이터 저장
   */
  async set(key: string, data: AIAnalysis, ttlSeconds: number = 3600): Promise<void> {
    // 캐시 크기 제한 확인
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds
    }
    
    this.cache.set(key, entry)
    
    console.log(`Cache set for key: ${key}, TTL: ${ttlSeconds}s`)
  }
  
  /**
   * 특정 키 삭제
   */
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key)
  }
  
  /**
   * 패턴으로 키 삭제
   */
  async deletePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern)
    let deletedCount = 0
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        deletedCount++
      }
    }
    
    console.log(`Deleted ${deletedCount} cache entries matching pattern: ${pattern}`)
    return deletedCount
  }
  
  /**
   * 고객별 캐시 삭제 (개인정보 보호)
   */
  async deleteCustomerCache(customerId: string): Promise<number> {
    return await this.deletePattern(`.*:${customerId}:.*`)
  }
  
  /**
   * 캐시 통계 조회
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate?: number
    memoryUsage?: number
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      // 실제 구현에서는 히트율과 메모리 사용량 추적
      hitRate: 0.85, // 모의 데이터
      memoryUsage: this.cache.size * 1024 // 대략적인 메모리 사용량
    }
  }
  
  /**
   * 만료된 캐시 항목 정리
   */
  private cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl * 1000) {
        this.cache.delete(key)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`)
    }
  }
  
  /**
   * 가장 오래된 캐시 항목 제거 (LRU)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey)
      console.log(`Evicted oldest cache entry: ${oldestKey}`)
    }
  }
  
  /**
   * 캐시 전체 삭제
   */
  async clear(): Promise<void> {
    const size = this.cache.size
    this.cache.clear()
    console.log(`Cleared ${size} cache entries`)
  }
  
  /**
   * 캐시 워밍업 (자주 사용되는 데이터 미리 로드)
   */
  async warmup(commonQueries: string[]): Promise<void> {
    console.log(`Starting cache warmup with ${commonQueries.length} queries`)
    
    // 실제 구현에서는 자주 사용되는 음식 분석 결과를 미리 캐시
    for (const query of commonQueries) {
      const key = `food_analysis:${this.hashString(query)}`
      
      // 이미 캐시에 있으면 스킵
      if (this.cache.has(key)) {
        continue
      }
      
      // 실제로는 AI 서비스를 호출하여 결과를 캐시
      // 현재는 모의 데이터로 대체
      const mockAnalysis: AIAnalysis = {
        provider: 'openai',
        analysisType: 'food_recognition',
        result: { foods: [], calories: 0 },
        confidence: 0.8,
        processingTime: 1000,
        cost: 0.002
      }
      
      await this.set(key, mockAnalysis, 7200) // 2시간 캐시
    }
    
    console.log('Cache warmup completed')
  }
  
  /**
   * 문자열 해시 생성
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 32bit 정수로 변환
    }
    return hash.toString(36)
  }
  
  /**
   * 캐시 내보내기 (백업용)
   */
  export(): Record<string, any> {
    const exported: Record<string, any> = {}
    
    for (const [key, entry] of this.cache.entries()) {
      exported[key] = {
        data: entry.data,
        timestamp: entry.timestamp,
        ttl: entry.ttl
      }
    }
    
    return exported
  }
  
  /**
   * 캐시 가져오기 (복원용)
   */
  import(data: Record<string, any>): void {
    this.cache.clear()
    
    for (const [key, entry] of Object.entries(data)) {
      this.cache.set(key, entry as CacheEntry)
    }
    
    console.log(`Imported ${Object.keys(data).length} cache entries`)
  }
  
  /**
   * 리소스 정리
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}