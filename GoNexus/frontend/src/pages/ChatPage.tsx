import { Link } from "react-router-dom"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { MessageList } from "@/components/chat/MessageList"
import { ChatInput } from "@/components/chat/ChatInput"
import { ArrowLeft } from "lucide-react"

export function ChatPage() {
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
