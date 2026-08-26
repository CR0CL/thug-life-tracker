'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check, ChevronDown, Save, Settings } from 'lucide-react'

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Доллар США' },
  { code: 'EUR', symbol: '€', name: 'Евро' },
  { code: 'GBP', symbol: '£', name: 'Британский фунт' },
  { code: 'RUB', symbol: '₽', name: 'Российский рубль' },
  { code: 'KZT', symbol: '₸', name: 'Казахстанский тенге' },
  { code: 'UAH', symbol: '₴', name: 'Украинская гривна' },
  { code: 'BYN', symbol: 'Br', name: 'Белорусский рубль' },
  { code: 'AMD', symbol: '֏', name: 'Армянский драм' },
  { code: 'GEL', symbol: '₾', name: 'Грузинский лари' },
  { code: 'AZN', symbol: '₼', name: 'Азербайджанский манат' },
  { code: 'BTC', symbol: '₿', name: 'Bitcoin' },
  { code: 'ETH', symbol: '⟠', name: 'Ethereum' },
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currency, setCurrency] = useState('USD')
  const [userId, setUserId] = useState<string | null>(null)
  const [waterGoal, setWaterGoal] = useState(2500)
  const [dailyVoiceLimit, setDailyVoiceLimit] = useState(3)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null)
  const supabase = createClient()

  // Загружаем настройки пользователя
  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('currency, water_goal, daily_voice_limit')
          .eq('user_id', user.id)
          .single()
        
        if (profile) {
          setCurrency(profile.currency || 'USD')
          setWaterGoal(profile.water_goal || 2500)
          setDailyVoiceLimit(profile.daily_voice_limit || 3)
        }
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  // Сохраняем настройки
  const saveSettings = async () => {
    if (!userId) return

    setSaving(true)
    
    const { error } = await supabase
      .from('profiles')
      .update({
        currency: currency,
        water_goal: waterGoal,
        daily_voice_limit: dailyVoiceLimit
      })
      .eq('user_id', userId)

    if (error) {
      setMessage('❌ Ошибка сохранения: ' + error.message)
      setMessageType('error')
    } else {
      setMessage('✅ Настройки сохранены!')
      setMessageType('success')
      // Обновляем валюту в localStorage для использования в других компонентах
      localStorage.setItem('user_currency', currency)
      localStorage.setItem('user_currency_symbol', getCurrencySymbol(currency))
    }

    setTimeout(() => {
      setMessage(null)
      setMessageType(null)
    }, 3000)

    setSaving(false)
  }

  const getCurrencySymbol = (code: string) => {
    const found = CURRENCIES.find(c => c.code === code)
    return found?.symbol || '$'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-blue-400" />
        <div>
          <p className="text-gray-400 text-sm">SETTINGS</p>
          <h1 className="text-2xl font-bold">Настройки</h1>
        </div>
      </div>

      {/* Сообщение */}
      {message && (
        <div className={`rounded-xl p-3 border mb-6 ${
          messageType === 'success' 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Валюта */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <label className="text-sm text-gray-400 block mb-2">
            Основная валюта
          </label>
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-black">
                  {c.symbol} {c.code} — {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Текущая валюта: {getCurrencySymbol(currency)} {currency}
          </p>
        </div>

        {/* Цель по воде */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <label className="text-sm text-gray-400 block mb-2">
            Цель по воде (мл в день)
          </label>
          <input
            type="number"
            value={waterGoal}
            onChange={(e) => setWaterGoal(Number(e.target.value))}
            min={500}
            max={10000}
            step={100}
            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Рекомендуемая норма: 2500 мл
          </p>
        </div>

        {/* Лимит голосовых записей */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <label className="text-sm text-gray-400 block mb-2">
            Лимит голосовых записей в день
          </label>
          <input
            type="number"
            value={dailyVoiceLimit}
            onChange={(e) => setDailyVoiceLimit(Number(e.target.value))}
            min={1}
            max={20}
            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Бесплатный лимит: 3 записи в день
          </p>
        </div>
      </div>

      {/* Кнопка сохранения */}
      <button
        onClick={saveSettings}
        disabled={saving}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Сохранение...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Сохранить настройки
          </>
        )}
      </button>

      {/* Информация о версии */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-600">
          Thug Life Tracker v1.0.0
        </p>
        <p className="text-xs text-gray-600 mt-1">
          🎤 Голосовой ввод работает в браузере
        </p>
      </div>
    </div>
  )
}