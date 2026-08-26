'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface VoiceInputSimpleProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
}

export default function VoiceInputSimple({ onTranscript, onError }: VoiceInputSimpleProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    // Проверяем поддержку браузера
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
      onError?.('Ваш браузер не поддерживает голосовой ввод')
      return
    }

    const recognitionInstance = new SpeechRecognition()
    recognitionInstance.lang = 'ru-RU'
    recognitionInstance.continuous = false
    recognitionInstance.interimResults = false

    recognitionInstance.onstart = () => {
      setIsListening(true)
    }

    recognitionInstance.onresult = (event: any) => {
      const result = event.results[0][0].transcript
      onTranscript(result)
      setIsListening(false)
    }

    recognitionInstance.onerror = (event: any) => {
      console.error('Ошибка распознавания:', event.error)
      if (event.error === 'not-allowed') {
        onError?.('Разрешите доступ к микрофону в настройках браузера')
      } else if (event.error === 'no-speech') {
        onError?.('Речь не обнаружена. Попробуйте ещё раз.')
      } else {
        onError?.(`Ошибка: ${event.error}`)
      }
      setIsListening(false)
    }

    recognitionInstance.onend = () => {
      setIsListening(false)
    }

    setRecognition(recognitionInstance)

    return () => {
      if (recognitionInstance) {
        recognitionInstance.abort()
      }
    }
  }, [onTranscript, onError])

  const startListening = () => {
    if (recognition) {
      try {
        recognition.start()
      } catch (error) {
        console.error('Ошибка запуска:', error)
        onError?.('Не удалось запустить микрофон')
      }
    }
  }

  if (!isSupported) {
    return (
      <button
        disabled
        className="p-4 rounded-full bg-gray-600 cursor-not-allowed opacity-50"
        title="Голосовой ввод не поддерживается"
      >
        <Mic className="w-6 h-6 text-gray-400" />
      </button>
    )
  }

  return (
    <button
      onClick={startListening}
      disabled={isListening}
      className={`p-4 rounded-full transition-all ${
        isListening
          ? 'bg-red-600 animate-pulse'
          : 'bg-blue-600 hover:bg-blue-700'
      }`}
      title={isListening ? 'Идёт запись...' : 'Нажмите для голосового ввода'}
    >
      {isListening ? (
        <MicOff className="w-6 h-6 text-white" />
      ) : (
        <Mic className="w-6 h-6 text-white" />
      )}
    </button>
  )
}