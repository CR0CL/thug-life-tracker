import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Здесь будет интеграция с нейросетью для распознавания фото
    // Пока возвращаем заглушку
    return NextResponse.json({
      success: true,
      dish_name: 'Блюдо',
      calories: 200,
      message: 'Фото получено, обработка в разработке'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}