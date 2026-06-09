import { useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'

export function useStreaming() {
  const token = useAuthStore((state) => state.token)
  const { addMessage, updateLastMessage, setIsStreaming, setCurrentSessionId } = useChatStore()
  const abortControllerRef = useRef<AbortController | null>(null)

  const stopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
    }
  }

  const startStream = async (url: string, body: any) => {
    // 如果已有正在运行的流，先停止
    stopStream()
    
    const controller = new AbortController()
    abortControllerRef.current = controller
    
    setIsStreaming(true)
    
    addMessage({ role: 'user', content: body.question })
    addMessage({ role: 'assistant', content: '' })

    try {
      const response = await fetch(`/api/v1${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      if (!response.body) return

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            
            if (data === '[DONE]') {
              continue
            }

            if (data.startsWith('{') && data.includes('sessionId')) {
              try {
                const parsed = JSON.parse(data)
                if (parsed.sessionId) {
                  setCurrentSessionId(parsed.sessionId, true)
                }
              } catch (e) {
                console.error("Failed to parse sessionId", e)
              }
              continue
            }

            accumulatedContent += data
            updateLastMessage(accumulatedContent)
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user')
      } else {
        console.error('Streaming error:', error)
        updateLastMessage('Error: Connection lost.')
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  return { startStream, stopStream }
}
