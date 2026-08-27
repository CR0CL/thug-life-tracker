'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Инициализация Telegram WebApp
    if (typeof window !== 'undefined') {
      const tg = (window as any).Telegram?.WebApp
      if (tg) {
        tg.ready()
        tg.expand()
        console.log('✅ Telegram WebApp инициализирован')
      } else {
        console.log('⚠️ Запуск вне Telegram')
      }
    }
    
    // Редирект на главную
    router.replace('/digest')
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Загрузка Thug Life Tracker...</p>
      </div>
    </div>
  )
}