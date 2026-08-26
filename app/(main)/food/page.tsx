'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Camera, Droplet, Utensils, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function FoodPage() {
  const [foodLogs, setFoodLogs] = useState<any[]>([])
  const [dishName, setDishName] = useState('')
  const [calories, setCalories] = useState('')
  const [water, setWater] = useState(0)
  const [waterGoal, setWaterGoal] = useState(2500)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [totalCalories, setTotalCalories] = useState(0)
  const [dailyCalorieGoal] = useState(2000)
  const supabase = createClient()

  // Получаем пользователя и загружаем данные
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        // Загружаем цель по воде из профиля
        const { data: profile } = await supabase
          .from('profiles')
          .select('water_goal')
          .eq('user_id', user.id)
          .single()
        if (profile?.water_goal) {
          setWaterGoal(profile.water_goal)
        }
      }
    }
    getUser()
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    // Загружаем записи еды за сегодня
    const today = new Date().toISOString().split('T')[0]
    const { data: foodData, error: foodError } = await supabase
      .from('food_logs')
      .select('*')
      .gte('logged_at', today)
      .lt('logged_at', today + 'T23:59:59')
      .order('logged_at', { ascending: false })
    
    if (foodError) {
      console.error('Ошибка загрузки еды:', foodError)
    } else {
      setFoodLogs(foodData || [])
      // Считаем калории
      const total = (foodData || []).reduce((sum, f) => sum + (f.calories || 0), 0)
      setTotalCalories(total)
    }

    // Загружаем воду за сегодня
    const { data: waterData, error: waterError } = await supabase
      .from('water_logs')
      .select('amount')
      .gte('logged_at', today)
      .lt('logged_at', today + 'T23:59:59')
    
    if (waterError) {
      console.error('Ошибка загрузки воды:', waterError)
    } else {
      const total = (waterData || []).reduce((sum, w) => sum + w.amount, 0)
      setWater(total)
    }

    setLoading(false)
  }

  // Добавление записи о еде
  const addFood = async () => {
    if (!dishName.trim()) {
      alert('Введите название блюда')
      return
    }

    if (!userId) {
      alert('Вы не авторизованы')
      return
    }

    setSaving(true)

    const { data, error } = await supabase
      .from('food_logs')
      .insert({ 
        dish_name: dishName.trim(),
        calories: parseInt(calories) || 0,
        user_id: userId
      })
      .select()

    if (error) {
      console.error('Ошибка добавления:', error)
      alert('Ошибка: ' + error.message)
      setSaving(false)
      return
    }

    if (data && data.length > 0) {
      setFoodLogs([data[0], ...foodLogs])
      setTotalCalories(totalCalories + (parseInt(calories) || 0))
      setDishName('')
      setCalories('')
    }
    setSaving(false)
  }

  // Добавление воды
  const addWater = async (amount: number) => {
    if (!userId) {
      alert('Вы не авторизованы')
      return
    }

    const { error } = await supabase
      .from('water_logs')
      .insert({ 
        amount: amount,
        user_id: userId
      })

    if (error) {
      console.error('Ошибка добавления воды:', error)
      alert('Ошибка: ' + error.message)
      return
    }

    setWater(water + amount)
  }

  // Удаление записи о еде
  const deleteFood = async (id: string, calories: number) => {
    if (!confirm('Удалить запись?')) return

    const { error } = await supabase
      .from('food_logs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка: ' + error.message)
      return
    }

    setFoodLogs(foodLogs.filter(f => f.id !== id))
    setTotalCalories(totalCalories - calories)
  }

  // Форматирование времени
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Прогресс калорий
  const calorieProgress = Math.min((totalCalories / dailyCalorieGoal) * 100, 100)
  const waterProgress = Math.min((water / waterGoal) * 100, 100)

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
      <div className="mb-6">
        <p className="text-gray-400 text-sm">FOOD</p>
        <h1 className="text-2xl font-bold">Питание</h1>
      </div>

      {/* Прогресс калорий */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Калории</span>
          <span className="text-sm font-medium">
            {totalCalories} / {dailyCalorieGoal} ккал
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${calorieProgress}%` }}
          />
        </div>
      </div>

      {/* Прогресс воды */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Вода</span>
          </div>
          <span className="text-sm font-medium">
            {water} / {waterGoal} мл
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all"
            style={{ width: `${waterProgress}%` }}
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => addWater(200)}
            className="flex-1 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors"
          >
            +200 мл
          </button>
          <button
            onClick={() => addWater(500)}
            className="flex-1 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors"
          >
            +500 мл
          </button>
          <button
            onClick={() => addWater(1000)}
            className="flex-1 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors"
          >
            +1 л
          </button>
        </div>
      </div>

      {/* Форма добавления еды */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Блюдо</label>
            <input
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="Название блюда"
              className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              disabled={saving}
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-gray-400 block mb-1">Калории</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="ккал"
              className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              disabled={saving}
            />
          </div>
        </div>

        <button
          onClick={addFood}
          disabled={saving || !dishName.trim()}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Добавление...
            </>
          ) : (
            <>
              <Utensils className="w-4 h-4" />
              Добавить приём пищи
            </>
          )}
        </button>
      </div>

      {/* Список записей о еде */}
      <div className="space-y-2">
        {foodLogs.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
            <Camera className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Нет записей о еде</p>
            <p className="text-gray-500 text-xs mt-1">Добавь свой первый приём пищи</p>
          </div>
        ) : (
          foodLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{log.dish_name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {log.calories > 0 && (
                      <span className="text-xs text-orange-400 flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {log.calories} ккал
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTime(log.logged_at)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteFood(log.id, log.calories || 0)}
                className="p-1 text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}