import { Link } from "react-router-dom"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { MessageList } from "@/components/chat/MessageList"
import { ChatInput } from "@/components/chat/ChatInput"
import { ArrowLeft, Clipboard } from "lucide-react"
import { chatApi } from "@/api/chat"
import { useChatStore } from "@/store/chatStore"
import { useRequireAuth } from "@/hooks/useRequireAuth"

export function ChatPage() {
  const { currentSessionId } = useChatStore()
  const requireAuth = useRequireAuth()

  const handleExtractMemory = async () => {
    if (!requireAuth() || !currentSessionId) return

    try {
      const res = await chatApi.extractMemory(currentSessionId)
      if (res.data?.status_code === 1000) {
        const memory = res.data.memory || ""
        const blob = new Blob([memory], { type: "text/markdown;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        link.href = url
        link.download = `gonexus-memory-${currentSessionId}-${timestamp}.md`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error("Failed to extract memory", err)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden p-4 gap-4">
      
      {/* Sidebar - Neo Brutalism */}
      <div className="h-full z-20 hidden md:block">
        <ChatSidebar />
      </div>

      {/* Main Area */}
      <main className="flex-1 flex flex-col bg-white border-4 border-black shadow-brutal z-10 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b-4 border-black flex items-center px-8 bg-secondary z-10">
          <Link to="/" className="comic-btn p-2 bg-white text-black mr-4 md:hidden">
            <ArrowLeft size={24} strokeWidth={3} />
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Chat <span className="text-white" style={{ textShadow: "2px 2px 0 #000" }}>Session</span></h1>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={handleExtractMemory}
              disabled={!currentSessionId}
              title="Extract current session memory"
              className="flex h-11 items-center justify-center gap-2 border-4 border-black bg-white px-3 font-black uppercase shadow-[4px_4px_0px_#000] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Clipboard size={19} strokeWidth={3} />
              <span className="hidden lg:inline">Extract</span>
            </button>
            <div className="px-4 py-2 bg-white border-4 border-black font-bold uppercase text-sm transform rotate-2">
              Online
            </div>
          </div>
        </header>

        {/* Messages */}
        <MessageList />

        {/* Input */}
        <ChatInput />
      </main>
    </div>
  )
}
