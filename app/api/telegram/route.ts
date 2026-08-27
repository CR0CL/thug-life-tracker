import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📨 Telegram update:', body)

    // Обработка команды /start
    if (body.message?.text === '/start') {
      const chatId = body.message.chat.id
      const botToken = process.env.TELEGRAM_BOT_TOKEN

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '🔥 Привет! Открой приложение:',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 Открыть Thug Life Tracker',
                  web_app: { url: 'https://thug-life-tracker.vercel.app' }
                }
              ]
            ]
          }
        })
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Ошибка:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}