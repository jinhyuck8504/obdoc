import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30days'
    
    // CSV 데이터 생성 (더미 데이터)
    const csvData = [
      ['날짜', '활성 사용자', '신규 가입', '매출', '병원 수'],
      ['2024-01-15', '78', '5', '265000', '35'],
      ['2024-01-16', '82', '3', '169000', '35'],
      ['2024-01-17', '89', '7', '507000', '36'],
      ['2024-01-18', '85', '4', '338000', '37'],
      ['2024-01-19', '91', '6', '676000', '38']
    ]
    
    // CSV 문자열 생성
    const csvString = csvData
      .map(row => row.join(','))
      .join('\\n')
    
    // BOM 추가 (한글 깨짐 방지)
    const bom = '\\uFEFF'
    const csvWithBom = bom + csvString
    
    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`
      }
    })
    
  } catch (error) {
    console.error('분석 데이터 내보내기 오류:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}