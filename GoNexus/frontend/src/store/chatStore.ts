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
  isStreaming: boolean
  modelType: string
  uploadedFiles: string[]
  
  setSessions: (sessions: Session[]) => void
  upsertSession: (session: Session) => void
  setCurrentSessionId: (id: string | null, skipClear?: boolean) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  removeMessage: (index: number, id?: number) => void
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
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      removeMessage: (index, id) => set((state) => ({
        messages: state.messages.filter((message, messageIndex) => {
          if (id !== undefined) {
            return message.id !== id
          }
          return messageIndex !== index
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
        if (state.currentSessionId !== sessionId) {
          return state
        }

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
