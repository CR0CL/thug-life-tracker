import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { text, userId } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Текст не найден' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Пользователь не авторизован' },
        { status: 401 }
      )
    }

    console.log('Получен текст:', text)

    // Категоризация текста
    const parsed = categorizeText(text)

    // Сохраняем в базу
    const supabase = createClient()
    let savedData = null

    switch (parsed.type) {
      case 'task': {
        const result = await supabase
          .from('tasks')
          .insert({
            title: parsed.title,
            user_id: userId,
            is_done: false,
            due_date: parsed.extra?.due_date || null,
            priority: parsed.extra?.priority || 'medium'
          })
          .select()
          .single()
        savedData = result.data
        break
      }

      case 'note': {
        const result = await supabase
          .from('notes')
          .insert({
            content: parsed.description,
            user_id: userId
          })
          .select()
          .single()
        savedData = result.data
        break
      }

      case 'money': {
        const result = await supabase
          .from('transactions')
          .insert({
            amount: parsed.extra?.amount || 0,
            category: parsed.extra?.category || 'Другое',
            type: parsed.extra?.type || 'expense',
            description: parsed.description,
            user_id: userId
          })
          .select()
          .single()
        savedData = result.data
        break
      }

      case 'food': {
        const result = await supabase
          .from('food_logs')
          .insert({
            dish_name: parsed.extra?.dish_name || parsed.title,
            calories: parsed.extra?.calories || 0,
            user_id: userId
          })
          .select()
          .single()
        savedData = result.data
        break
      }

      case 'meeting': {
        const meetingDate = parsed.extra?.date || new Date().toISOString().split('T')[0]
        const meetingTime = parsed.extra?.time || '00:00'
        const result = await supabase
          .from('meetings')
          .insert({
            title: parsed.title,
            date: `${meetingDate}T${meetingTime}:00`,
            user_id: userId
          })
          .select()
          .single()
        savedData = result.data
        break
      }

      case 'ritual': {
        const result = await supabase
          .from('rituals')
          .insert({
            name: parsed.extra?.name || parsed.title,
            done: false,
            streak: 0,
            user_id: userId
          })
          .select()
          .single()
        savedData = result.data
        break
      }

      default: {
        const result = await supabase
          .from('notes')
          .insert({
            content: parsed.description || parsed.title || text,
            user_id: userId
          })
          .select()
          .single()
        savedData = result.data
      }
    }

    return NextResponse.json({
      success: true,
      type: parsed.type,
      data: savedData,
      text: text
    })

  } catch (error) {
    console.error('Ошибка:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// ============================================
// КАТЕГОРИЗАЦИЯ ТЕКСТА
// ============================================
function categorizeText(text: string) {
  const lower = text.toLowerCase()

  // 1. ДЕНЬГИ
  if (lower.includes('потратил') || lower.includes('заплатил') || 
      lower.includes('купил') || lower.includes('руб') || 
      lower.includes('долг') || lower.includes('зарплат') ||
      lower.includes('доход') || lower.includes('расход') ||
      lower.includes('₽') || lower.includes('$')) {
    
    const amountMatch = text.match(/(\d+)/)
    const amount = amountMatch ? parseInt(amountMatch[1]) : 0
    
    const categories = ['еда', 'транспорт', 'развлечения', 'покупки', 'связь', 'жильё', 'здоровье']
    let category = 'Другое'
    for (const cat of categories) {
      if (lower.includes(cat)) {
        category = cat.charAt(0).toUpperCase() + cat.slice(1)
        break
      }
    }
    
    return {
      type: 'money',
      title: text.slice(0, 50),
      description: text,
      extra: {
        amount: amount,
        category: category,
        type: lower.includes('доход') || lower.includes('зарплат') ? 'income' : 'expense'
      }
    }
  }

  // 2. ЕДА
  if (lower.includes('съел') || lower.includes('выпил') || 
      lower.includes('поел') || lower.includes('завтрак') ||
      lower.includes('обед') || lower.includes('ужин') ||
      lower.includes('калори') || lower.includes('блюдо')) {
    
    const caloriesMatch = text.match(/(\d+)\s*кал/i)
    const calories = caloriesMatch ? parseInt(caloriesMatch[1]) : 0
    
    const dishMatch = text.match(/съел\s+([а-яё\s]+)/i) ||
                      text.match(/поел\s+([а-яё\s]+)/i) ||
                      text.match(/блюдо\s+([а-яё\s]+)/i)
    const dishName = dishMatch ? dishMatch[1].trim() : 'Блюдо'
    
    return {
      type: 'food',
      title: dishName,
      description: text,
      extra: {
        dish_name: dishName,
        calories: calories
      }
    }
  }

  // 3. ВСТРЕЧА
  if (lower.includes('встреч') || lower.includes('созвон') ||
      lower.includes('позвони') || lower.includes('встретиться') ||
      lower.includes('созвониться') || lower.includes('запланирова')) {
    
    let date = null
    let time = null
    
    const dateMatch = text.match(/(\d{2})[.\/](\d{2})[.\/](\d{4})/) ||
                      text.match(/(\d{2})[.\/](\d{2})/)
    if (dateMatch) {
      const day = dateMatch[1]
      const month = dateMatch[2]
      const year = dateMatch[3] || new Date().getFullYear()
      date = `${year}-${month}-${day}`
    }
    
    const timeMatch = text.match(/(\d{1,2}):(\d{2})/)
    if (timeMatch) {
      time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`
    }
    
    return {
      type: 'meeting',
      title: text.slice(0, 50),
      description: text,
      extra: {
        date: date || new Date().toISOString().split('T')[0],
        time: time || '12:00'
      }
    }
  }

  // 4. ПРИВЫЧКА
  if (lower.includes('привычк') || lower.includes('каждый день') ||
      lower.includes('ежедневно') || lower.includes('каждое утро') ||
      lower.includes('каждый вечер') || lower.includes('ритуал')) {
    
    const nameMatch = text.match(/привычк[ау]\s+([а-яё\s]+)/i) ||
                      text.match(/ритуал\s+([а-яё\s]+)/i) ||
                      text.match(/каждый день\s+([а-яё\s]+)/i)
    const name = nameMatch ? nameMatch[1].trim() : text.slice(0, 30)
    
    return {
      type: 'ritual',
      title: name,
      description: text,
      extra: {
        name: name
      }
    }
  }

  // 5. ЗАДАЧА
  if (lower.includes('сделать') || lower.includes('купить') ||
      lower.includes('завтра') || lower.includes('сегодня') ||
      lower.includes('нужно') || lower.includes('надо')) {
    
    let dueDate = null
    if (lower.includes('завтра')) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      dueDate = tomorrow.toISOString().split('T')[0]
    } else if (lower.includes('сегодня')) {
      dueDate = new Date().toISOString().split('T')[0]
    }
    
    return {
      type: 'task',
      title: text.slice(0, 50),
      description: text,
      extra: {
        due_date: dueDate,
        priority: lower.includes('срочно') ? 'high' : 
                  lower.includes('важно') ? 'high' : 'medium'
      }
    }
  }

  // 6. ПО УМОЛЧАНИЮ — ЗАМЕТКА
  return {
    type: 'note',
    title: text.slice(0, 50),
    description: text,
    extra: {}
  }
}