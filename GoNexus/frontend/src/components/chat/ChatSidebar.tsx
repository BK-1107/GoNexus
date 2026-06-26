import { MessageSquare, Plus, Settings, Home, LogIn, LogOut, Trash2, Database, Zap, Upload } from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import { useChatStore } from "@/store/chatStore"
import { useAuthStore } from "@/store/authStore"
import { chatApi } from "@/api/chat"
import { NeoConfirm } from "@/components/ui/NeoConfirm"
import { useRequireAuth } from "@/hooks/useRequireAuth"

export function ChatSidebar() {
  const { sessions, setSessions, currentSessionId, setCurrentSessionId, messages, setMessages, modelType, isStreaming, streamingSessionId, sessionMessageCache } = useChatStore()
  const { logout, username, token } = useAuthStore()
  const requireAuth = useRequireAuth()
  
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteTitle, setDeleteTitle] = useState("")
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const initialSyncRef = useRef(false)
  const visibleSessions = token ? sessions : []

  // 加载会话列表
  useEffect(() => {
    if (!token) {
      initialSyncRef.current = false
      return
    }

    const fetchSessions = async () => {
      console.log(`[Sidebar] Fetching sessions... Restored ID: ${currentSessionId}`)
      try {
        const res = await chatApi.getSessions()
        if (res.data?.status_code === 1000 && res.data.sessions) {
          const mapped = res.data.sessions.map((s: any) => ({
            id: s.sessionId,
            title: s.name, 
            updated_at: s.updatedAt
          }))
          setSessions(mapped)
        }
      } catch (err) {
        console.error("Failed to fetch sessions", err)
      }
    }
    fetchSessions()
  }, [setSessions, token])

  // [优化] 自动恢复/选中逻辑：处理新浏览器登录或刷新后 currentSessionId 为空的情况
  useEffect(() => {
    if (!token || isStreaming) return

    const autoSelect = async () => {
      // 1. 如果有 ID 但没同步过（刷新场景），执行静默同步
      if (currentSessionId && !initialSyncRef.current) {
        if (messages.length > 0) {
          initialSyncRef.current = true
          return
        }

        console.log(`[Auto-Sync] Fetching latest history for: ${currentSessionId}`)
        loadSessionHistory(currentSessionId)
        initialSyncRef.current = true
        return
      }

      // 2. 如果没有 ID 但有会话列表（新登录场景），自动选中第一个
      if (!currentSessionId && sessions.length > 0 && !initialSyncRef.current) {
        const firstId = sessions[0].id
        console.log(`[Auto-Select] No active session, picking most recent: ${firstId}`)
        setCurrentSessionId(firstId)
        loadSessionHistory(firstId)
        initialSyncRef.current = true
      }
    }
    autoSelect()
  }, [sessions, currentSessionId, isStreaming, messages.length, token])

  const loadSessionHistory = async (sessionId: string) => {
    if (sessionId === streamingSessionId && sessionMessageCache[sessionId]?.length > 0) {
      setMessages(sessionMessageCache[sessionId])
      return
    }

    try {
      const res = await chatApi.getHistory(sessionId)
      if (res.data?.status_code === 1000 && res.data.history) {
        const history = res.data.history.map((m: any) => ({
          id: m.id,
          role: m.is_user ? 'user' : 'assistant', 
          content: m.content
        }))
        setMessages(history)
      }
    } catch (err) {
      console.error("Failed to fetch history", err)
    }
  }

  const handleSessionSelect = (sessionId: string) => {
    if (!requireAuth()) return
    if (sessionId === currentSessionId && messages.length > 0) return
    setCurrentSessionId(sessionId)
    loadSessionHistory(sessionId)
  }

  const handleNewChat = () => {
    if (!requireAuth()) return
    setCurrentSessionId(null)
    setMessages([])
  }

  const handleImportClick = () => {
    if (!requireAuth()) return
    importInputRef.current?.click()
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !requireAuth()) return

    try {
      const payload = JSON.parse(await file.text())
      const rawMessages = Array.isArray(payload) ? payload : payload.messages
      if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
        return
      }

      const importedMessages = rawMessages
        .map((message: any) => ({
          is_user: Boolean(message.is_user ?? message.isUser ?? message.role === "user"),
          content: String(message.content ?? "").trim(),
        }))
        .filter((message: any) => message.content)

      const title = String(payload.title ?? payload.name ?? "Imported Chat")
      const res = await chatApi.importSession(title, importedMessages)
      if (res.data?.status_code === 1000 && res.data.session) {
        const session = {
          id: res.data.session.sessionId,
          title: res.data.session.name,
          updated_at: "",
        }
        setSessions([session, ...sessions])
        setCurrentSessionId(session.id)
        setMessages(importedMessages.map((message: any) => ({
          role: message.is_user ? "user" : "assistant",
          content: message.content,
        })))
      }
    } catch (err) {
      console.error("Failed to import session", err)
    }
  }

  const openDeleteModal = (e: React.MouseEvent, s: any) => {
    e.stopPropagation()
    if (!requireAuth()) return
    setDeleteId(s.id)
    setDeleteTitle(s.title || "Untitled Chat")
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      const res = await chatApi.deleteSession(deleteId)
      if (res.data?.status_code === 1000) {
        setSessions(sessions.filter(s => s.id !== deleteId))
        if (currentSessionId === deleteId) {
          handleNewChat()
        }
      }
    } catch (err) {
      console.error("Failed to delete session", err)
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <aside className="w-80 flex flex-col h-full bg-white border-r-4 border-black pt-6 px-4 pb-4 gap-4 relative z-20">
      
      {/* Header Area */}
      <div className="flex items-center justify-between mb-2">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-[#4ade80] border-4 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center group-hover:translate-y-1 group-hover:translate-x-1 group-hover:shadow-none transition-all active:scale-95">
            <span className="text-black font-black text-2xl italic">G</span>
          </div>
          <h1 className="text-xl font-black uppercase tracking-tighter leading-none mt-1">GopherAI</h1>
        </Link>
        <Link to="/" className="w-10 h-10 flex items-center justify-center bg-white border-4 border-black shadow-[4px_4px_0px_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all active:scale-95">
          <Home size={20} strokeWidth={3} />
        </Link>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col gap-3">
        <button 
          onClick={handleNewChat}
          className="bg-[#4ade80] text-black py-4 px-4 w-full gap-2 text-lg border-4 border-black shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center font-black uppercase"
        >
          <Plus size={24} strokeWidth={4} />
          <span>New Chat</span>
        </button>

        <Link 
          to="/knowledge"
          className="bg-[#4ade80] text-black py-3 px-4 w-full gap-2 text-md border-4 border-black shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center font-black uppercase"
        >
          <Database size={20} strokeWidth={3} />
          <span>Knowledge</span>
        </Link>

        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportFile}
        />
        <button 
          onClick={handleImportClick}
          className="bg-white text-black py-3 px-4 w-full gap-2 text-md border-4 border-black shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center font-black uppercase"
        >
          <Upload size={20} strokeWidth={3} />
          <span>Import</span>
        </button>
      </div>

      {/* Mode Indicator */}
      <div className="bg-[#f1f5f9] border-4 border-black p-4 flex items-center shadow-[4px_4px_0px_#000] mt-1">
        <div className="flex items-center gap-3 text-sm font-black uppercase">
          <Zap size={18} className="text-[#4ade80] fill-[#4ade80]/20" strokeWidth={2.5} />
          <span>Mode: {modelType === '1' ? 'Standard' : 'RAG Core'}</span>
        </div>
      </div>
      
      {/* Sessions Area */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 mt-2">
        <div className="bg-[#FACC15] px-4 py-2 border-4 border-black w-fit shadow-[4px_4px_0px_#000] hover:-rotate-2 transition-transform">
          <h3 className="text-sm font-black text-black uppercase tracking-widest leading-none">Sessions</h3>
        </div>
        
        <div className="flex flex-col gap-3">
          {visibleSessions.length === 0 ? (
            <div className="text-center py-8 font-bold text-black/30 italic uppercase">No Sessions Yet</div>
          ) : (
            visibleSessions.map((s) => (
              <div key={s.id} className="group relative">
                <button 
                  onClick={() => handleSessionSelect(s.id)}
                  className={`flex items-center gap-3 px-4 py-4 border-4 border-black transition-all duration-200 font-bold text-left w-full relative ${
                    currentSessionId === s.id 
                      ? "bg-[#A855F7] text-black shadow-[4px_4px_0px_#000] translate-y-0 translate-x-0 active:translate-x-1 active:translate-y-1 active:shadow-none" 
                      : "bg-white text-black hover:bg-muted shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                  }`}
                >
                  <MessageSquare size={20} strokeWidth={currentSessionId === s.id ? 3 : 2} />
                  <span className="truncate pr-8 font-black uppercase text-sm">{s.title || "Untitled Chat"}</span>
                </button>
                <button 
                  onClick={(e) => openDeleteModal(e, s)}
                  title="Delete session"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-transparent text-black/60 opacity-0 transition-colors hover:bg-black/10 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 size={16} strokeWidth={3} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Area */}
      <div className="pt-4 mt-auto flex flex-col gap-3">
        <div className="bg-[#f1f5f9] border-4 border-black p-3 flex items-center gap-3 shadow-[4px_4px_0px_#000]">
          <div className="w-6 h-6 bg-black rounded-full" />
          <span className="font-black truncate uppercase text-xs">{username || "Guest User"}</span>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-black border-4 border-black shadow-[4px_4px_0px_#000] hover:bg-primary hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            <Settings size={18} strokeWidth={3} />
          </button>
          <button 
            onClick={() => token ? logout() : requireAuth()}
            title={token ? "Log out" : "Log in"}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#ef4444] text-black border-4 border-black shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            {token ? <LogOut size={18} strokeWidth={3} /> : <LogIn size={18} strokeWidth={3} />}
          </button>
        </div>
      </div>

      <NeoConfirm 
        isOpen={deleteId !== null}
        title="Delete Session?"
        message={`Are you sure you want to delete "${deleteTitle}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="Burn It!"
        cancelText="Keep It"
        type="danger"
      />
    </aside>
  )
}
