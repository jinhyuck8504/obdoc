// Google AI Service - 비용 효율적 기본 분석

import { AI_SERVICE_CONFIG } from '@/lib/challengeConstants'

interface GoogleAIResponse {
  data: any
  confidence: number
  cost: number
}

export class GoogleAIService {
  private apiKey: string
  private baseURL: string = 'https://generativelanguage.googleapis.com/v1beta'
  
  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Google AI API key not found')
    }
  }
  
  /**
   * 기본 음식 분석 (비용 효율적)
   */
  async analyzeFood(text: string, customerId: string): Promise<GoogleAIResponse> {
    const prompt = this.buildFoodAnalysisPrompt(text)
    
    try {
      const response = await this.callGoogleAI('gemini-pro', {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 800
        }
      })
      
      const result = this.parseFoodAnalysisResponse(response.candidates[0].content.parts[0].text)
      
      return {
        data: result,
        confidence: 0.75, // Google AI는 기본 분석에 적합
        cost: AI_SERVICE_CONFIG.PROVIDERS.google.costPerRequest
      }
    } catch (error) {
      console.error('Google AI food analysis failed:', error)
      throw new Error(`Google AI 음식 분석 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * 기본 DII 계산 (Claude 대체용)
   */
  async calculateDII(foods: any[], customerId: string): Promise<GoogleAIResponse> {
    const prompt = this.buildDIICalculationPrompt(foods)
    
    try {
      const response = await this.callGoogleAI('gemini-pro', {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000
        }
      })
      
      const result = this.parseDIIResponse(response.candidates[0].content.parts[0].text)
      
      return {
        data: result,
        confidence: 0.7, // Claude보다는 낮지만 기본적인 계산 가능
        cost: AI_SERVICE_CONFIG.PROVIDERS.google.costPerRequest
      }
    } catch (error) {
      console.error('Google AI DII calculation failed:', error)
      throw new Error(`Google AI DII 계산 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * 기본 건강 위험도 평가
   */
  async assessHealthRisk(customerData: any, customerId: string): Promise<GoogleAIResponse> {
    const prompt = this.buildHealthRiskPrompt(customerData)
    
    try {
      const response = await this.callGoogleAI('gemini-pro', {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800
        }
      })
      
      const result = this.parseHealthRiskResponse(response.candidates[0].content.parts[0].text)
      
      return {
        data: result,
        confidence: 0.65, // 기본적인 위험도 평가
        cost: AI_SERVICE_CONFIG.PROVIDERS.google.costPerRequest
      }
    } catch (error) {
      console.error('Google AI health risk assessment failed:', error)
      throw new Error(`Google AI 건강 위험도 평가 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * 기본 위험 신호 감지
   */
  async detectRiskSignals(dailyRecords: any[], customerId: string): Promise<GoogleAIResponse> {
    const prompt = this.buildRiskDetectionPrompt(dailyRecords)
    
    try {
      const response = await this.callGoogleAI('gemini-pro', {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 600
        }
      })
      
      const result = this.parseRiskDetectionResponse(response.candidates[0].content.parts[0].text)
      
      return {
        data: result,
        confidence: 0.68,
        cost: AI_SERVICE_CONFIG.PROVIDERS.google.costPerRequest
      }
    } catch (error) {
      console.error('Google AI risk detection failed:', error)
      throw new Error(`Google AI 위험 신호 감지 실패: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * 서비스 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.callGoogleAI('gemini-pro', {
        contents: [{
          parts: [{ text: 'Hello' }]
        }],
        generationConfig: {
          maxOutputTokens: 5
        }
      })
      
      return response.candidates && response.candidates.length > 0
    } catch (error) {
      console.error('Google AI health check failed:', error)
      return false
    }
  }
  
  /**
   * Google AI API 호출
   */
  private async callGoogleAI(model: string, payload: any): Promise<any> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), AI_SERVICE_CONFIG.PROVIDERS.google.timeout)
    
    try {
      const response = await fetch(`${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      
      if (!response.ok) {
        throw new Error(`Google AI API error: ${response.status} ${response.statusText}`)
      }
      
      return await response.json()
    } finally {
      clearTimeout(timeout)
    }
  }
  
  /**
   * 음식 분석 프롬프트 생성
   */
  private buildFoodAnalysisPrompt(text: string): string {
    return `
다음 한국어 텍스트에서 음식과 분량을 분석해주세요:

"${text}"

JSON 형식으로 응답해주세요:
{
  "foods": [
    {
      "name": "음식명",
      "amount": 분량,
      "unit": "단위",
      "calories": 칼로리
    }
  ],
  "total_calories": 총칼로리,
  "meal_type": "breakfast|lunch|dinner|snack"
}

간단하고 정확하게 분석해주세요.
    `.trim()
  }
  
  /**
   * DII 계산 프롬프트 생성
   */
  private buildDIICalculationPrompt(foods: any[]): string {
    const foodsText = foods.map(food => 
      `${food.name}: ${food.amount}${food.unit}`
    ).join(', ')
    
    return `
다음 음식들의 DII(Dietary Inflammatory Index) 점수를 계산해주세요:

음식: ${foodsText}

DII는 염증 지수입니다 (음수가 좋음, 양수가 나쁨).

JSON 형식으로 응답해주세요:
{
  "total_dii_score": DII점수,
  "interpretation": "excellent|good|fair|poor",
  "recommendations": ["개선방안"]
}
    `.trim()
  }
  
  /**
   * 건강 위험도 평가 프롬프트 생성
   */
  private buildHealthRiskPrompt(customerData: any): string {
    return `
다음 정보로 건강 위험도를 평가해주세요:

나이: ${customerData.age}세
체중: ${customerData.weight}kg
신장: ${customerData.height}cm
질환: ${customerData.medicalConditions?.join(', ') || '없음'}

JSON 형식으로 응답해주세요:
{
  "risk_level": "low|medium|high",
  "requires_doctor_approval": true/false,
  "recommendations": ["권장사항"]
}
    `.trim()
  }
  
  /**
   * 위험 신호 감지 프롬프트 생성
   */
  private buildRiskDetectionPrompt(dailyRecords: any[]): string {
    const recordsText = dailyRecords.slice(0, 5).map(record => 
      `${record.recordDate}: ${JSON.stringify(record.recordData)}`
    ).join('\n')
    
    return `
다음 기록에서 위험 신호를 찾아주세요:

${recordsText}

JSON 형식으로 응답해주세요:
{
  "risk_detected": true/false,
  "risk_level": "low|medium|high",
  "warning_signs": ["위험신호들"]
}
    `.trim()
  }
  
  /**
   * 음식 분석 응답 파싱
   */
  private parseFoodAnalysisResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다')
      }
      
      const parsed = JSON.parse(jsonMatch[0])
      
      // 기본값 설정
      return {
        foods: parsed.foods || [],
        total_calories: parsed.total_calories || 0,
        meal_type: parsed.meal_type || 'unknown',
        confidence: 0.75
      }
    } catch (error) {
      console.error('Failed to parse Google AI food analysis response:', error)
      return {
        foods: [],
        total_calories: 0,
        meal_type: 'unknown',
        confidence: 0.3
      }
    }
  }
  
  /**
   * DII 응답 파싱
   */
  private parseDIIResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다')
      }
      
      const parsed = JSON.parse(jsonMatch[0])
      
      return {
        total_dii_score: parsed.total_dii_score || 0,
        interpretation: parsed.interpretation || 'fair',
        recommendations: parsed.recommendations || [],
        confidence: 0.7
      }
    } catch (error) {
      console.error('Failed to parse Google AI DII response:', error)
      return {
        total_dii_score: 0,
        interpretation: 'fair',
        recommendations: ['분석 중 오류가 발생했습니다'],
        confidence: 0.3
      }
    }
  }
  
  /**
   * 건강 위험도 응답 파싱
   */
  private parseHealthRiskResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다')
      }
      
      const parsed = JSON.parse(jsonMatch[0])
      
      return {
        risk_level: parsed.risk_level || 'medium',
        requires_doctor_approval: parsed.requires_doctor_approval !== false,
        recommendations: parsed.recommendations || [],
        confidence: 0.65
      }
    } catch (error) {
      console.error('Failed to parse Google AI health risk response:', error)
      return {
        risk_level: 'medium',
        requires_doctor_approval: true,
        recommendations: ['의사와 상담하세요'],
        confidence: 0.3
      }
    }
  }
  
  /**
   * 위험 신호 감지 응답 파싱
   */
  private parseRiskDetectionResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다')
      }
      
      const parsed = JSON.parse(jsonMatch[0])
      
      return {
        risk_detected: parsed.risk_detected || false,
        risk_level: parsed.risk_level || 'low',
        warning_signs: parsed.warning_signs || [],
        confidence: 0.68
      }
    } catch (error) {
      console.error('Failed to parse Google AI risk detection response:', error)
      return {
        risk_detected: false,
        risk_level: 'low',
        warning_signs: [],
        confidence: 0.3
      }
    }
  }
}