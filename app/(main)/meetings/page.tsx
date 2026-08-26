'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Loader2, Calendar, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  // Получаем пользователя и загружаем встречи
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
    loadMeetings()
  }, [])

  const loadMeetings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('date', { ascending: true })
    
    if (error) {
      console.error('Ошибка загрузки:', error)
    } else {
      setMeetings(data || [])
    }
    setLoading(false)
  }

  // Добавление встречи
  const addMeeting = async () => {
    if (!title.trim()) {
      alert('Введите название встречи')
      return
    }

    if (!date) {
      alert('Выберите дату')
      return
    }

    if (!userId) {
      alert('Вы не авторизованы')
      return
    }

    setSaving(true)

    // Формируем дату и время
    const meetingDate = time ? `${date}T${time}:00` : `${date}T00:00:00`

    const { data, error } = await supabase
      .from('meetings')
      .insert({ 
        title: title.trim(),
        date: meetingDate,
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
      setMeetings([...meetings, data[0]])
      setTitle('')
      setDate('')
      setTime('')
    }
    setSaving(false)
  }

  // Удаление встречи
  const deleteMeeting = async (id: string) => {
    if (!confirm('Удалить встречу?')) return

    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка: ' + error.message)
      return
    }

    setMeetings(meetings.filter(meeting => meeting.id !== id))
  }

  // Начать редактирование
  const startEdit = (meeting: any) => {
    setEditingId(meeting.id)
    setTitle(meeting.title)
    const meetingDate = new Date(meeting.date)
    setDate(meetingDate.toISOString().split('T')[0])
    setTime(meetingDate.toTimeString().slice(0, 5))
  }

  // Сохранить редактирование
  const saveEdit = async () => {
    if (!title.trim()) {
      alert('Введите название встречи')
      return
    }

    if (!date) {
      alert('Выберите дату')
      return
    }

    const meetingDate = time ? `${date}T${time}:00` : `${date}T00:00:00`

    const { error } = await supabase
      .from('meetings')
      .update({ 
        title: title.trim(),
        date: meetingDate
      })
      .eq('id', editingId)

    if (error) {
      console.error('Ошибка редактирования:', error)
      alert('Ошибка: ' + error.message)
      return
    }

    setMeetings(meetings.map(meeting => 
      meeting.id === editingId ? { ...meeting, title: title.trim(), date: meetingDate } : meeting
    ))
    cancelEdit()
  }

  // Отмена редактирования
  const cancelEdit = () => {
    setEditingId(null)
    setTitle('')
    setDate('')
    setTime('')
  }

  // Форматирование даты
  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Проверка, прошла ли встреча
  const isPast = (date: string) => {
    return new Date(date) < new Date()
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-400 text-sm">MEETINGS</p>
          <h1 className="text-2xl font-bold">Встречи</h1>
        </div>
        <span className="text-xs text-gray-400">{meetings.length} шт</span>
      </div>

      {/* Форма добавления */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название встречи"
          className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-3"
          disabled={saving}
        />
        
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              disabled={saving}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Время</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              disabled={saving}
            />
          </div>
        </div>

        <button
          onClick={editingId ? saveEdit : addMeeting}
          disabled={saving || !title.trim() || !date}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-3 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              {editingId ? 'Обновить встречу' : 'Добавить встречу'}
            </>
          )}
        </button>

        {editingId && (
          <button
            onClick={cancelEdit}
            className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors mt-2"
          >
            Отменить редактирование
          </button>
        )}
      </div>

      {/* Список встреч */}
      <div className="space-y-3">
        {meetings.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
            <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Нет встреч</p>
            <p className="text-gray-500 text-xs mt-1">Запланируй первую встречу</p>
          </div>
        ) : (
          meetings.map((meeting) => (
            <div
              key={meeting.id}
              className={`bg-white/5 rounded-xl p-4 border transition-colors ${
                isPast(meeting.date) 
                  ? 'border-gray-600/30 opacity-60' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isPast(meeting.date) ? 'text-gray-400' : 'text-white'}`}>
                    {meeting.title}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(meeting.date)}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(meeting.date)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => startEdit(meeting)}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMeeting(meeting.id)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}