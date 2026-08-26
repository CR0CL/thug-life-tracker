'use client'

import { useState, useEffect } from 'react'
import { Trash2, Edit2, Loader2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Загрузка заметок
  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Ошибка загрузки:', error)
    } else {
      setNotes(data || [])
    }
    setLoading(false)
  }

  // Добавление заметки
  const addNote = async () => {
    if (!newNote.trim()) {
      alert('Введите текст заметки')
      return
    }

    setSaving(true)
    
    // Получаем текущего пользователя
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('Вы не авторизованы')
      setSaving(false)
      return
    }

    const { data, error } = await supabase
      .from('notes')
      .insert([{ 
        content: newNote.trim(),
        user_id: user.id  // Явно указываем user_id
      }])
      .select()

    if (error) {
      console.error('Ошибка добавления:', error)
      alert('Ошибка: ' + error.message)
      setSaving(false)
      return
    }

    if (data && data.length > 0) {
      setNotes([data[0], ...notes])
      setNewNote('')
    }
    setSaving(false)
  }

  // Удаление заметки
  const deleteNote = async (id: string) => {
    if (!confirm('Удалить заметку?')) return

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка: ' + error.message)
      return
    }

    setNotes(notes.filter(note => note.id !== id))
  }

  // Начать редактирование
  const startEdit = (note: any) => {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  // Сохранить редактирование
  const saveEdit = async (id: string) => {
    if (!editContent.trim()) {
      alert('Введите текст')
      return
    }

    const { error } = await supabase
      .from('notes')
      .update({ content: editContent.trim() })
      .eq('id', id)

    if (error) {
      console.error('Ошибка редактирования:', error)
      alert('Ошибка: ' + error.message)
      return
    }

    setNotes(notes.map(note => 
      note.id === id ? { ...note, content: editContent.trim() } : note
    ))
    setEditingId(null)
    setEditContent('')
  }

  // Отмена редактирования
  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  // Форматирование даты
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <p className="text-gray-400 text-sm">NOTES</p>
          <h1 className="text-2xl font-bold">Заметки</h1>
        </div>
        <span className="text-xs text-gray-400">{notes.length} шт</span>
      </div>

      {/* Форма добавления */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Что хочешь запомнить?"
          className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          rows={3}
          disabled={saving}
        />
        <button
          onClick={addNote}
          disabled={saving || !newNote.trim()}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Сохранить заметку
            </>
          )}
        </button>
      </div>

      {/* Список заметок */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
            <p className="text-gray-400 text-sm">Нет заметок</p>
            <p className="text-gray-500 text-xs mt-1">Создай первую заметку</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors"
            >
              {editingId === note.id ? (
                // Режим редактирования
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => saveEdit(note.id)}
                      className="flex-1 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                // Режим просмотра
                <div>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                    <span className="text-xs text-gray-500">
                      {formatDate(note.created_at)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(note)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}