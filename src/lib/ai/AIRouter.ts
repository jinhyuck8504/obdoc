// AI Router - 최적의 AI 모델 선택 로직

import { AIProvider, AIAnalysisType } from '@/types/challenge'
import { AI_SERVICE_CONFIG } from '@/lib/challengeConstants'

interface SelectionCriteria {
  language?: 'korean' | 'english'
  complexity?: 'low' | 'medium' | 'high'
  costBudget?: number
  urgency?: 'low' | 'medium' | 'high'
  accuracy?: 'low' | 'medium' | 'high'
}

export class AIRouter {
  /**
   * 분석 타입과 기준에 따라 최적의 AI 모델 선택
   */
  async selectOptimalProvider(
    analysisType: AIAnalysisType,
    criteria: SelectionCriteria = {}
  ): Promise<AIProvider> {
    // 분석 타입별 기본 선호도
    const typePreferences: Record<AIAnalysisType, AIProvider[]> = {
      food_recognition: ['openai', 'claude', 'google'], // OpenAI가 한국어 음식 인식에 특화
      dii_calculation: ['claude', 'openai', 'google'],  // Claude가 의료 계산에 특화
      health_assessment: ['claude', 'openai', 'google'], // Claude가 의료 추론에 특화
      risk_detection: ['claude', 'openai', 'google']     // Claude가 위험 감지에 특화
    }
    
    const preferredProviders = typePreferences[analysisType] || ['openai', 'claude', 'google']
    
    // 기준에 따른 가중치 계산
    const scores = await this.calculateProviderScores(preferredProviders, criteria)
    
    // 가장 높은 점수의 provider 선택
    const bestProvider = Object.entries(scores).reduce((best, [provider, score]) => 
      score > best.score ? { provider: provider as AIProvider, score } : best,
      { provider: preferredProviders[0], score: 0 }
    )
    
    return bestProvider.provider
  }
  
  /**
   * Provider별 점수 계산
   */
  private async calculateProviderScores(
    providers: AIProvider[],
    criteria: SelectionCriteria
  ): Promise<Record<AIProvider, number>> {
    const scores: Record<AIProvider, number> = {} as any
    
    for (const provider of providers) {
      let score = 100 // 기본 점수
      
      // 비용 기준
      if (criteria.costBudget) {
        const providerCost = AI_SERVICE_CONFIG.PROVIDERS[provider].costPerRequest
        if (providerCost > criteria.costBudget) {
          score -= 50 // 예산 초과 시 큰 감점
        } else {
          score += (criteria.costBudget - providerCost) * 10 // 저렴할수록 가점
        }
      }
      
      // 언어 기준
      if (criteria.language === 'korean') {
        if (provider === 'openai') score += 20 // OpenAI가 한국어에 특화
        if (provider === 'google') score -= 10 // Google이 상대적으로 약함
      }
      
      // 복잡도 기준
      if (criteria.complexity === 'high') {
        if (provider === 'claude') score += 15 // Claude가 복잡한 추론에 강함
        if (provider === 'google') score -= 15 // Google이 단순 분석에 특화
      } else if (criteria.complexity === 'low') {
        if (provider === 'google') score += 10 // Google이 비용 효율적
      }
      
      // 긴급도 기준
      if (criteria.urgency === 'high') {
        const timeout = AI_SERVICE_CONFIG.PROVIDERS[provider].timeout
        score += (15000 - timeout) / 100 // 빠른 응답일수록 가점
      }
      
      // 정확도 기준
      if (criteria.accuracy === 'high') {
        if (provider === 'claude') score += 25 // Claude가 의료 분야에서 정확도 높음
        if (provider === 'openai') score += 15 // OpenAI도 높은 정확도
        if (provider === 'google') score -= 10 // Google은 상대적으로 낮음
      }
      
      // 현재 서비스 상태 반영
      const healthScore = await this.getProviderHealthScore(provider)
      score *= healthScore
      
      scores[provider] = Math.max(0, score) // 음수 방지
    }
    
    return scores
  }
  
  /**
   * Provider 건강 상태 점수 (0.0 ~ 1.0)
   */
  private async getProviderHealthScore(provider: AIProvider): Promise<number> {
    try {
      // 실제 구현에서는 최근 성공률, 응답 시간 등을 확인
      // 현재는 간단한 모의 구현
      const recentSuccessRate = await this.getRecentSuccessRate(provider)
      const avgResponseTime = await this.getAverageResponseTime(provider)
      
      let score = recentSuccessRate // 성공률 기반 점수 (0.0 ~ 1.0)
      
      // 응답 시간이 너무 느리면 감점
      if (avgResponseTime > 10000) score *= 0.7 // 10초 이상이면 30% 감점
      else if (avgResponseTime > 5000) score *= 0.9 // 5초 이상이면 10% 감점
      
      return Math.max(0.1, score) // 최소 10% 점수는 보장
    } catch (error) {
      return 0.1 // 상태 확인 실패 시 최소 점수
    }
  }
  
  /**
   * 최근 성공률 조회 (모의 구현)
   */
  private async getRecentSuccessRate(provider: AIProvider): Promise<number> {
    // 실제 구현에서는 ai_analysis_logs 테이블에서 최근 24시간 성공률 조회
    const mockSuccessRates: Record<AIProvider, number> = {
      openai: 0.95,
      claude: 0.92,
      google: 0.88
    }
    
    return mockSuccessRates[provider] || 0.8
  }
  
  /**
   * 평균 응답 시간 조회 (모의 구현)
   */
  private async getAverageResponseTime(provider: AIProvider): Promise<number> {
    // 실제 구현에서는 ai_analysis_logs 테이블에서 최근 평균 응답 시간 조회
    const mockResponseTimes: Record<AIProvider, number> = {
      openai: 3000,  // 3초
      claude: 4000,  // 4초
      google: 2000   // 2초
    }
    
    return mockResponseTimes[provider] || 5000
  }
  
  /**
   * Fallback provider 선택
   */
  getFallbackProvider(failedProvider: AIProvider): AIProvider {
    const fallbackOrder = AI_SERVICE_CONFIG.FALLBACK_ORDER.filter(p => p !== failedProvider)
    return fallbackOrder[0] || 'google' // 기본 fallback
  }
  
  /**
   * 모든 provider가 실패했을 때의 최후 수단
   */
  getLastResortProvider(): AIProvider {
    return 'google' // 가장 안정적이고 저렴한 옵션
  }
  
  /**
   * Provider 우선순위 재계산 (학습 기능)
   */
  async updateProviderPreferences(
    analysisType: AIAnalysisType,
    provider: AIProvider,
    success: boolean,
    responseTime: number,
    userSatisfaction?: number
  ): Promise<void> {
    // 실제 구현에서는 성능 데이터를 수집하여 ML 모델 업데이트
    // 현재는 로그만 기록
    console.log('Provider performance update:', {
      analysisType,
      provider,
      success,
      responseTime,
      userSatisfaction,
      timestamp: new Date().toISOString()
    })
  }
}