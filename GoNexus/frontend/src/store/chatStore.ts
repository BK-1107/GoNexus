import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Message {
  id?: number
  role: 'user' | 'assistant'
  content: string
}

export interface Session {
  id: string
  title: string
  updated_at: string
}

interface ChatState {
  sessions: Session[]
  currentSessionId: string | null
  messages: Message[]
  sessionMessageCache: Record<string, Message[]>
  streamingSessionId: string | null
  isStreaming: boolean
  modelType: string
  uploadedFiles: string[]
  
  setSessions: (sessions: Session[]) => void
  upsertSession: (session: Session) => void
  setCurrentSessionId: (id: string | null, skipClear?: boolean) => void
  setMessages: (messages: Message[]) => void
  cacheSessionMessages: (sessionId: string, messages: Message[]) => void
  setStreamingSessionId: (sessionId: string | null) => void
  addMessage: (message: Message) => void
  removeMessage: (index: number, id?: number) => void
  updateMessage: (index: number, content: string, id?: number) => void
  updateLastMessage: (content: string) => void
  updateLastAssistantMessage: (content: string) => void
  updateLastAssistantMessageForSession: (sessionId: string, content: string) => void
  setIsStreaming: (isStreaming: boolean) => void
  setModelType: (type: string) => void
  addUploadedFile: (filename: string) => void
  removeUploadedFile: (filename: string) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessions: [],
      currentSessionId: null,
      messages: [],
      sessionMessageCache: {},
      streamingSessionId: null,
      isStreaming: false,
      modelType: '1',
      uploadedFiles: [],

      setSessions: (sessions) => set({ sessions }),
      upsertSession: (session) => set((state) => ({
        sessions: [
          session,
          ...state.sessions.filter((existing) => existing.id !== session.id),
        ],
      })),
      setCurrentSessionId: (id, skipClear = false) => set((state) => ({ 
        currentSessionId: id, 
        messages: skipClear ? state.messages : [] 
      })),
      setMessages: (messages) => set({ messages }),
      cacheSessionMessages: (sessionId, messages) => set((state) => ({
        sessionMessageCache: {
          ...state.sessionMessageCache,
          [sessionId]: messages,
        },
      })),
      setStreamingSessionId: (streamingSessionId) => set({ streamingSessionId }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      removeMessage: (index, id) => set((state) => ({
        messages: state.messages.filter((message, messageIndex) => {
          if (id !== undefined && id > 0) {
            return message.id !== id
          }
          return messageIndex !== index
        })
      })),
      updateMessage: (index, content, id) => set((state) => ({
        messages: state.messages.map((message, messageIndex) => {
          const isTarget = id !== undefined && id > 0 ? message.id === id : messageIndex === index
          return isTarget ? { ...message, content } : message
        })
      })),
      updateLastMessage: (content) => set((state) => {
        const newMessages = [...state.messages]
        if (newMessages.length > 0) {
          newMessages[newMessages.length - 1] = { 
            ...newMessages[newMessages.length - 1], 
            content 
          }
        }
        return { messages: newMessages }
      }),
      updateLastAssistantMessage: (content) => set((state) => {
        const newMessages = [...state.messages]
        const assistantIndex = [...newMessages].reverse().findIndex((message) => message.role === 'assistant')
        if (assistantIndex === -1) return { messages: newMessages }

        const index = newMessages.length - 1 - assistantIndex
        newMessages[index] = {
          ...newMessages[index],
          content,
        }
        return { messages: newMessages }
      }),
      updateLastAssistantMessageForSession: (sessionId, content) => set((state) => {
        const cachedMessages = state.sessionMessageCache[sessionId] || []
        const sourceMessages = cachedMessages.length > 0 ? cachedMessages : state.messages
        const newMessages = [...sourceMessages]
        const assistantIndex = [...newMessages].reverse().findIndex((message) => message.role === 'assistant')
        if (assistantIndex === -1) {
          return {
            sessionMessageCache: {
              ...state.sessionMessageCache,
              [sessionId]: newMessages,
            },
          }
        }

        const index = newMessages.length - 1 - assistantIndex
        newMessages[index] = {
          ...newMessages[index],
          content,
        }
        const nextCache = {
          ...state.sessionMessageCache,
          [sessionId]: newMessages,
        }

        if (state.currentSessionId !== sessionId) {
          return { sessionMessageCache: nextCache }
        }

        return {
          messages: newMessages,
          sessionMessageCache: nextCache,
        }
      }),
      setIsStreaming: (isStreaming) => set({ isStreaming }),
      setModelType: (modelType) => set({ modelType }),
      addUploadedFile: (filename) => set((state) => ({ 
        uploadedFiles: [filename, ...state.uploadedFiles] 
      })),
      removeUploadedFile: (filename) => set((state) => ({ 
        uploadedFiles: state.uploadedFiles.filter(f => f !== filename) 
      })),
    }),
    {
      name: 'gopher-chat-storage',
      partialize: (state) => ({ 
        currentSessionId: state.currentSessionId,
        sessions: state.sessions,
        messages: state.messages,
        modelType: state.modelType,
        uploadedFiles: state.uploadedFiles
      }), 
    }
  )
)
