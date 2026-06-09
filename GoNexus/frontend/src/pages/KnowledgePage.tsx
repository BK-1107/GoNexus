import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { KnowledgeBase } from "@/components/chat/KnowledgeBase"

export function KnowledgePage() {
  return (
    <div className="flex h-screen bg-[#ffffff]">
      <ChatSidebar />
      <main className="flex-1 overflow-y-auto px-12 py-8 halftone-bg">
        <KnowledgeBase />
      </main>
    </div>
  )
}
