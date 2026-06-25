import { useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { apiUrl } from '@/api/base'

export function useStreaming() {
  const token = useAuthStore((state) => state.token)
  const logout = useAuthStore((state) => state.logout)
  const { addMessage, updateLastAssistantMessage, updateLastAssistantMessageForSession, setIsStreaming, setCurrentSessionId, setSessions, upsertSession, cacheSessionMessages, setStreamingSessionId } = useChatStore()
  const abortControllerRef = useRef<AbortController | null>(null)

  const stopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
      setStreamingSessionId(null)
    }
  }

  const startStream = async (url: string, body: any) => {
    // 如果已有正在运行的流，先停止
    stopStream()
    
    const controller = new AbortController()
    abortControllerRef.current = controller
    
    setIsStreaming(true)
    let streamSessionId: string | null = body.sessionId || null
    setStreamingSessionId(streamSessionId)
    
    addMessage({ role: 'user', content: body.question })
    addMessage({ role: 'assistant', content: '' })
    if (streamSessionId) {
      cacheSessionMessages(streamSessionId, useChatStore.getState().messages)
    }

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
        const errorMessage = `Error: ${payload?.status_msg || 'AI request failed.'}`
        if (streamSessionId) {
          updateLastAssistantMessageForSession(streamSessionId, errorMessage)
        } else {
          updateLastAssistantMessage(errorMessage)
        }
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
                  streamSessionId = parsed.sessionId
                  setStreamingSessionId(parsed.sessionId)
                  setCurrentSessionId(parsed.sessionId, true)
                  cacheSessionMessages(parsed.sessionId, useChatStore.getState().messages)
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
              let errorMessage = `Error: ${data}`
              try {
                const parsed = JSON.parse(data)
                errorMessage = `Error: ${parsed.message || 'AI request failed.'}`
              } catch {
                errorMessage = `Error: ${data}`
              }

              if (streamSessionId) {
                updateLastAssistantMessageForSession(streamSessionId, errorMessage)
              } else {
                updateLastAssistantMessage(errorMessage)
              }
              currentEvent = 'message'
              continue
            }

            accumulatedContent += data
            if (streamSessionId) {
              updateLastAssistantMessageForSession(streamSessionId, accumulatedContent)
            } else {
              updateLastAssistantMessage(accumulatedContent)
            }
            currentEvent = 'message'
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user')
      } else {
        console.error('Streaming error:', error)
        if (streamSessionId) {
          updateLastAssistantMessageForSession(streamSessionId, 'Error: Connection lost.')
        } else {
          updateLastAssistantMessage('Error: Connection lost.')
        }
      }
    } finally {
      setIsStreaming(false)
      setStreamingSessionId(null)
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
