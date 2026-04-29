import { MessageSquare, Plus, Settings, Home, LogOut, Trash2, Database, Zap } from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect } from "react"
import { useChatStore } from "@/store/chatStore"
import { useAuthStore } from "@/store/authStore"
import { chatApi } from "@/api/chat"

export function ChatSidebar() {
  const { sessions, setSessions, currentSessionId, setCurrentSessionId, messages, setMessages, modelType } = useChatStore()
  const { logout, username } = useAuthStore()

  // 加载会话列表
  useEffect(() => {
    const fetchSessions = async () => {
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
  }, [setSessions])

  // [修复] 刷新后自动加载当前会话的历史记录
  useEffect(() => {
    if (currentSessionId && sessions.length > 0 && messages.length === 0) {
      const exists = sessions.some(s => s.id === currentSessionId)
      if (exists) {
        loadSessionHistory(currentSessionId)
      }
    }
  }, [sessions, currentSessionId, messages.length])

  const loadSessionHistory = async (sessionId: string) => {
    try {
      const res = await chatApi.getHistory(sessionId)
      if (res.data?.status_code === 1000 && res.data.history) {
        const history = res.data.history.map((m: any) => ({
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
    setCurrentSessionId(sessionId)
    loadSessionHistory(sessionId)
  }

  const handleNewChat = () => {
    setCurrentSessionId(null)
    setMessages([])
  }

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this session?")) return

    try {
      const res = await chatApi.deleteSession(sessionId)
      if (res.data?.status_code === 1000) {
        setSessions(sessions.filter(s => s.id !== sessionId))
        if (currentSessionId === sessionId) {
          handleNewChat()
        }
      }
    } catch (err) {
      console.error("Failed to delete session", err)
    }
  }

  return (
    <aside className="w-80 flex flex-col h-full bg-white border-4 border-black shadow-brutal p-6 gap-6 relative z-20">
      
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-primary border-4 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
            <span className="text-black font-black text-2xl">GN</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">GoNexus</h1>
        </Link>
        <Link to="/" className="comic-btn w-10 h-10 bg-secondary">
          <Home size={20} strokeWidth={3} />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={handleNewChat}
          className="comic-btn bg-primary text-black py-4 px-4 w-full gap-2 text-xl"
        >
          <Plus size={24} strokeWidth={4} />
          <span>New Chat</span>
        </button>

        <Link 
          to="/knowledge"
          className="comic-btn bg-accent text-black py-3 px-4 w-full gap-2 text-lg hover:rotate-1"
        >
          <Database size={20} strokeWidth={3} />
          <span>Knowledge</span>
        </Link>
      </div>

      <div className="bg-muted border-4 border-black p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-black uppercase">
          <Zap size={14} className={modelType === '2' ? 'text-primary' : 'text-black/30'} />
          Mode: {modelType === '1' ? 'Standard' : 'RAG Core'}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-4 mt-2 overflow-y-auto pr-2">
        <div className="flex justify-between items-center bg-secondary self-start px-2 py-1 border-2 border-black transform -rotate-2">
          <h3 className="text-sm font-black text-black uppercase tracking-widest">Sessions</h3>
        </div>
        
        {sessions.length === 0 ? (
          <div className="text-center py-8 font-bold text-black/30 italic uppercase">No Sessions Yet</div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="group relative">
              <button 
                onClick={() => handleSessionSelect(s.id)}
                className={`flex items-center gap-3 px-4 py-3 border-4 border-black transition-all font-bold text-left w-full ${
                  currentSessionId === s.id 
                    ? "bg-accent text-black shadow-brutal translate-y-[-2px] translate-x-[-2px]" 
                    : "bg-white text-black hover:bg-muted hover:shadow-brutal-active"
                }`}
              >
                <MessageSquare size={20} strokeWidth={currentSessionId === s.id ? 3 : 2} />
                <span className="truncate pr-6">{s.title || "Untitled Chat"}</span>
              </button>
              <button 
                onClick={(e) => handleDeleteSession(e, s.id)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t-4 border-black mt-auto flex flex-col gap-3">
        <div className="bg-muted border-4 border-black p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-full" />
          <span className="font-black truncate uppercase text-sm">{username || "Guest User"}</span>
        </div>
        <div className="flex gap-2">
          <button className="comic-card flex-1 flex items-center justify-center gap-2 py-3 bg-white text-black hover:bg-primary transition-all">
            <Settings size={18} strokeWidth={3} />
          </button>
          <button 
            onClick={logout}
            className="comic-card flex-1 flex items-center justify-center gap-2 py-3 bg-destructive text-black hover:opacity-80 transition-all"
          >
            <LogOut size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </aside>
  )
}
