// ObDoc Hybrid AI Service
// OpenAI + Claude + Google AI를 활용한 하이브리드 AI 분석 시스템

import { AIProvider, AIAnalysis } from '@/types/challenge'
import { AI_SERVICE_CONFIG } from '@/lib/challengeConstants'
import { OpenAIService } from './providers/OpenAIService'
import { ClaudeService } from './providers/ClaudeService'
import { GoogleAIService } from './providers/GoogleAIService'
import { AIRouter } from './AIRouter'
import { AICache } from './AICache'
import { CostTracker } from './CostTracker'

export class HybridAIService {
  private providers: {
    openai: OpenAIService
    claude: ClaudeService
    google: GoogleAIService
  }
  
  private router: AIRouter
  private cache: AICache
  private costTracker: CostTracker
  
  constructor() {
    this.providers = {
      openai: new OpenAIService(),
      claude: new ClaudeService(),
      google: new GoogleAIService()
    }
    
    this.router = new AIRouter()
    this.cache = new AICache()
    this.costTracker = new CostTracker()
  }
  
  /**
   * 음식 텍스트를 분석하여 영양 정보 추출
   */
  async analyzeFood(text: string, customerId: string): Promise<AIAnalysis> {
    const cacheKey = `food_analysis:${this.hashText(text)}`
    
    // 1. 캐시 확인
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return {
        ...cached,
        provider: cached.provider as AIProvider,
        analysisType: 'food_recognition'
      }
    }
    
    // 2. 최적 AI 모델 선택
    const provider = await this.router.selectOptimalProvider('food_recognition', {
      language: 'korean',
      complexity: this.assessTextComplexity(text),
      costBudget: await this.costTracker.getRemainingDailyBudget()
    })
    
    // 3. AI 분석 실행 (fallback 포함)
    const startTime = Date.now()
    const result = await this.executeWithFallback(
      provider,
      'analyzeFood',
      [text, customerId]
    )
    const processingTime = Date.now() - startTime
    
    const analysis: AIAnalysis = {
      provider,
      analysisType: 'food_recognition',
      result: result.data,
      confidence: result.confidence || 0.8,
      processingTime,
      cost: result.cost || AI_SERVICE_CONFIG.PROVIDERS[provider].costPerRequest
    }
    
    // 4. 결과 캐싱 및 비용 추적
    await this.cache.set(cacheKey, analysis, 3600) // 1시간 캐시
    await this.costTracker.recordUsage(provider, analysis.cost, customerId)
    
    // 5. 사용 로그 기록
    await this.logAnalysis(customerId, analysis, text)
    
    return analysis
  }
  
  /**
   * DII(Dietary Inflammatory Index) 점수 계산
   */
  async calculateDII(foods: any[], customerId: string): Promise<AIAnalysis> {
    const cacheKey = `dii_calculation:${this.hashObject(foods)}`
    
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return {
        ...cached,
        provider: cached.provider as AIProvider,
        analysisType: 'dii_calculation'
      }
    }
    
    // DII 계산은 Claude가 특화되어 있음
    const provider = 'claude'
    const startTime = Date.now()
    
    try {
      const result = await this.providers[provider].calculateDII(foods, customerId)
      const processingTime = Date.now() - startTime
      
      const analysis: AIAnalysis = {
        provider,
        analysisType: 'dii_calculation',
        result: result.data,
        confidence: result.confidence || 0.9,
        processingTime,
        cost: result.cost || AI_SERVICE_CONFIG.PROVIDERS[provider].costPerRequest
      }
      
      await this.cache.set(cacheKey, analysis, 7200) // 2시간 캐시
      await this.costTracker.recordUsage(provider, analysis.cost, customerId)
      await this.logAnalysis(customerId, analysis, foods)
      
      return analysis
    } catch (error) {
      console.warn('Claude DII calculation failed, trying fallback')
      return await this.executeWithFallback('google', 'calculateDII', [foods, customerId])
    }
  }
  
  /**
   * 건강 위험도 평가
   */
  async assessHealthRisk(customerData: any, customerId: string): Promise<AIAnalysis> {
    const cacheKey = `health_assessment:${customerId}:${this.hashObject(customerData)}`
    
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return {
        ...cached,
        provider: cached.provider as AIProvider,
        analysisType: 'health_assessment'
      }
    }
    
    // 건강 위험도 평가는 Claude가 의료 추론에 특화
    const provider = 'claude'
    const startTime = Date.now()
    
    const result = await this.executeWithFallback(
      provider,
      'assessHealthRisk',
      [customerData, customerId]
    )
    const processingTime = Date.now() - startTime
    
    const analysis: AIAnalysis = {
      provider,
      analysisType: 'health_assessment',
      result: result.data,
      confidence: result.confidence || 0.85,
      processingTime,
      cost: result.cost || AI_SERVICE_CONFIG.PROVIDERS[provider].costPerRequest
    }
    
    await this.cache.set(cacheKey, analysis, 1800) // 30분 캐시 (건강 데이터는 짧게)
    await this.costTracker.recordUsage(provider, analysis.cost, customerId)
    await this.logAnalysis(customerId, analysis, customerData)
    
    return analysis
  }
  
  /**
   * 위험 신호 감지
   */
  async detectRiskSignals(dailyRecords: any[], customerId: string): Promise<AIAnalysis> {
    const provider = await this.router.selectOptimalProvider('risk_detection', {
      urgency: 'high',
      accuracy: 'high'
    })
    
    const startTime = Date.now()
    const result = await this.executeWithFallback(
      provider,
      'detectRiskSignals',
      [dailyRecords, customerId]
    )
    const processingTime = Date.now() - startTime
    
    const analysis: AIAnalysis = {
      provider,
      analysisType: 'risk_detection',
      result: result.data,
      confidence: result.confidence || 0.9,
      processingTime,
      cost: result.cost || AI_SERVICE_CONFIG.PROVIDERS[provider].costPerRequest
    }
    
    // 위험 신호는 캐시하지 않음 (실시간 분석 필요)
    await this.costTracker.recordUsage(provider, analysis.cost, customerId)
    await this.logAnalysis(customerId, analysis, dailyRecords)
    
    return analysis
  }
  
  /**
   * Fallback을 포함한 AI 실행
   */
  private async executeWithFallback(
    primaryProvider: AIProvider,
    method: string,
    args: any[]
  ): Promise<any> {
    const maxRetries = 3
    let lastError: Error | undefined
    
    // Primary provider 시도
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.providers[primaryProvider][method](...args)
        return result
      } catch (error) {
        lastError = error as Error
        console.warn(`${primaryProvider} attempt ${attempt} failed:`, error)
        
        if (attempt === maxRetries) break
        await this.delay(1000 * attempt) // 지수 백오프
      }
    }
    
    // Fallback providers 시도
    const fallbackProviders = AI_SERVICE_CONFIG.FALLBACK_ORDER.filter(p => p !== primaryProvider)
    
    for (const fallbackProvider of fallbackProviders) {
      try {
        console.log(`Trying fallback provider: ${fallbackProvider}`)
        const result = await this.providers[fallbackProvider][method](...args)
        return result
      } catch (error) {
        console.warn(`Fallback ${fallbackProvider} failed:`, error)
        lastError = error as Error
      }
    }
    
    // 모든 provider 실패
    throw new Error(`All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`)
  }
  
  /**
   * AI 분석 로그 기록
   */
  private async logAnalysis(
    customerId: string,
    analysis: AIAnalysis,
    inputData: any
  ): Promise<void> {
    try {
      // 실제 구현에서는 데이터베이스에 저장
      const logData = {
        customer_id: customerId,
        provider: analysis.provider,
        analysis_type: analysis.analysisType,
        input_data: inputData,
        output_data: analysis.result,
        processing_time_ms: analysis.processingTime,
        cost_usd: analysis.cost,
        success: true,
        created_at: new Date().toISOString()
      }
      
      // TODO: 데이터베이스에 ai_analysis_logs 테이블에 저장
      console.log('AI Analysis Log:', logData)
    } catch (error) {
      console.error('Failed to log AI analysis:', error)
    }
  }
  
  /**
   * 텍스트 복잡도 평가
   */
  private assessTextComplexity(text: string): 'low' | 'medium' | 'high' {
    const length = text.length
    const wordCount = text.split(/\s+/).length
    const hasSpecialChars = /[^\w\s가-힣]/.test(text)
    
    if (length > 200 || wordCount > 30 || hasSpecialChars) return 'high'
    if (length > 100 || wordCount > 15) return 'medium'
    return 'low'
  }
  
  /**
   * 텍스트 해시 생성
   */
  private hashText(text: string): string {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 32bit 정수로 변환
    }
    return hash.toString(36)
  }
  
  /**
   * 객체 해시 생성
   */
  private hashObject(obj: any): string {
    return this.hashText(JSON.stringify(obj))
  }
  
  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * 서비스 상태 확인
   */
  async getServiceStatus(): Promise<{
    provider: AIProvider
    status: 'healthy' | 'degraded' | 'down'
    responseTime?: number
  }[]> {
    const statuses: {
      provider: AIProvider
      status: 'healthy' | 'degraded' | 'down'
      responseTime?: number
    }[] = []
    
    for (const [provider, service] of Object.entries(this.providers)) {
      try {
        const startTime = Date.now()
        await service.healthCheck()
        const responseTime = Date.now() - startTime
        
        statuses.push({
          provider: provider as AIProvider,
          status: responseTime < 2000 ? 'healthy' : 'degraded',
          responseTime
        })
      } catch (error) {
        statuses.push({
          provider: provider as AIProvider,
          status: 'down'
        })
      }
    }
    
    return statuses
  }
}