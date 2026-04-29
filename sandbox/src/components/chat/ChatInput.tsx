import { Send } from "lucide-react"

export function ChatInput() {
  return (
    <div className="p-6 bg-white border-t-4 border-black relative z-10 shadow-[0_-4px_0_rgba(0,0,0,1)]">
      <div className="max-w-4xl mx-auto flex gap-4">
        <textarea 
          placeholder="TYPE SOMETHING EPIC..."
          className="comic-input flex-1 min-h-[64px] max-h-48 resize-none font-bold text-lg uppercase placeholder:text-black/30"
          rows={1}
        />
        <button className="comic-btn w-16 h-16 shrink-0 bg-primary hover:bg-secondary">
          <Send size={28} strokeWidth={3} className="relative top-[2px] right-[2px]" />
        </button>
      </div>
      <div className="text-center mt-4">
        <span className="bg-secondary px-2 border-2 border-black font-bold uppercase text-sm inline-block transform rotate-1">
          GopherAI is in Beta. Verify everything!
        </span>
      </div>
    </div>
  )
}
