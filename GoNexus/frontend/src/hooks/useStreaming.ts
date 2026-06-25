import { useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { apiUrl } from '@/api/base'

export function useStreaming() {
  const token = useAuthStore((state) => state.token)
  const logout = useAuthStore((state) => state.logout)
  const { addMessage, updateLastAssistantMessage, setIsStreaming, setCurrentSessionId, setSessions, upsertSession } = useChatStore()
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
      const response = await fetch(apiUrl(url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      if (response.headers.get('content-type')?.includes('application/json')) {
        const payload = await response.json()
        if (payload?.status_code === 2006) {
          logout()
          const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`
          window.location.assign(`/auth?returnTo=${encodeURIComponent(returnTo)}`)
          return
        }
        updateLastAssistantMessage(`Error: ${payload?.status_msg || 'AI request failed.'}`)
        return
      }

      if (!response.body) return

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''
      let currentEvent = 'message'

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
            continue
          }

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
                  upsertSession({
                    id: parsed.sessionId,
                    title: body.question,
                    updated_at: new Date().toISOString(),
                  })
                }
              } catch (e) {
                console.error("Failed to parse sessionId", e)
              }
              continue
            }

            if (currentEvent === 'error') {
              try {
                const parsed = JSON.parse(data)
                updateLastAssistantMessage(`Error: ${parsed.message || 'AI request failed.'}`)
              } catch {
                updateLastAssistantMessage(`Error: ${data}`)
              }
              currentEvent = 'message'
              continue
            }

            accumulatedContent += data
            updateLastAssistantMessage(accumulatedContent)
            currentEvent = 'message'
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user')
      } else {
        console.error('Streaming error:', error)
        updateLastAssistantMessage('Error: Connection lost.')
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null

      if (token) {
        try {
          const sessionsResponse = await fetch(apiUrl('/AI/chat/sessions'), {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          const payload = await sessionsResponse.json()
          if (payload?.status_code === 1000 && payload.sessions) {
            setSessions(payload.sessions.map((session: any) => ({
              id: session.sessionId,
              title: session.name,
              updated_at: session.updatedAt,
            })))
          }
        } catch (error) {
          console.error('Failed to refresh sessions after streaming:', error)
        }
      }
    }
  }

  return { startStream, stopStream }
}
