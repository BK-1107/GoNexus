import { Send, Square } from "lucide-react"
import { useState } from "react"
import { useChatStore } from "@/store/chatStore"
import { useStreaming } from "@/hooks/useStreaming"
import { useRequireAuth } from "@/hooks/useRequireAuth"

export function ChatInput() {
  const [content, setContent] = useState("")
  const { currentSessionId, isStreaming, modelType } = useChatStore()
  const { startStream, stopStream } = useStreaming()
  const requireAuth = useRequireAuth()

  const handleSend = async () => {
    if (!content.trim() || isStreaming) return
    if (!requireAuth()) return

    const messageContent = content
    setContent("")

    const url = currentSessionId 
      ? "/AI/chat/send-stream" 
      : "/AI/chat/send-stream-new-session"
    
    const body: any = { 
      question: messageContent, 
      modelType: modelType 
    }
    
    if (currentSessionId) {
      body.sessionId = currentSessionId
    }

    await startStream(url, body)
  }

  return (
    <div className="p-6 bg-white border-t-4 border-black relative z-10 shadow-[0_-4px_0_rgba(0,0,0,1)]">
      <div className="max-w-4xl mx-auto flex gap-4">
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={isStreaming ? "AI IS GENERATING..." : "TYPE SOMETHING EPIC..."}
          className="comic-input flex-1 min-h-[64px] max-h-48 resize-none font-bold text-lg uppercase placeholder:text-black/30"
          rows={1}
          disabled={isStreaming}
        />
        
        {isStreaming ? (
          <button 
            onClick={stopStream}
            className="comic-btn w-16 h-16 shrink-0 bg-destructive hover:opacity-80"
            title="Stop Generation"
          >
            <Square size={24} fill="currentColor" />
          </button>
        ) : (
          <button 
            onClick={handleSend}
            disabled={!content.trim()}
            className="comic-btn w-16 h-16 shrink-0 bg-primary hover:bg-secondary disabled:opacity-50"
          >
            <Send size={28} strokeWidth={3} className="relative top-[2px] right-[2px]" />
          </button>
        )}
      </div>
      <div className="text-center mt-4">
        <span className="bg-secondary px-2 border-2 border-black font-bold uppercase text-sm inline-block transform rotate-1">
          GoNexus is in Beta. Verify everything!
        </span>
      </div>
    </div>
  )
}
