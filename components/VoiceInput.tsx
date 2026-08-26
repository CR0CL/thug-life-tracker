'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface VoiceInputProps {
  userId: string
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export default function VoiceInput({ userId, onSuccess, onError }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        await sendAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Ошибка доступа к микрофону:', error)
      onError?.('Нет доступа к микрофону')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)

    const formData = new FormData()
    formData.append('audio', audioBlob, 'voice.webm')
    formData.append('userId', userId)

    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        onSuccess?.(data)
      } else {
        onError?.(data.error || 'Ошибка распознавания')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      onError?.('Ошибка отправки голоса')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      className={`p-4 rounded-full transition-all ${
        isRecording
          ? 'bg-red-600 animate-pulse'
          : isProcessing
          ? 'bg-gray-600'
          : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      {isProcessing ? (
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      ) : isRecording ? (
        <MicOff className="w-6 h-6 text-white" />
      ) : (
        <Mic className="w-6 h-6 text-white" />
      )}
    </button>
  )
}