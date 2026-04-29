import { MessageSquare, Plus, Settings, Home } from "lucide-react"
import { Link } from "react-router-dom"

export function ChatSidebar() {
  return (
    <aside className="w-80 flex flex-col h-full bg-white border-4 border-black shadow-brutal p-6 gap-6 relative z-20">
      
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-primary border-4 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
            <span className="text-black font-black text-2xl">G</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">GopherAI</h1>
        </Link>
        <Link to="/" className="comic-btn w-10 h-10 bg-secondary">
          <Home size={20} strokeWidth={3} />
        </Link>
      </div>

      <button className="comic-btn bg-primary text-black py-4 px-4 w-full gap-2 text-xl">
        <Plus size={24} strokeWidth={4} />
        <span>New Chat</span>
      </button>
      
      <div className="flex-1 flex flex-col gap-4 mt-6 overflow-y-auto pr-2">
        <h3 className="text-sm font-black text-black uppercase tracking-widest bg-secondary inline-block self-start px-2 py-1 border-2 border-black transform -rotate-2">Sessions</h3>
        
        {[1, 2, 3].map((i) => (
          <button 
            key={i}
            className={`flex items-center gap-3 px-4 py-3 border-4 border-black transition-all font-bold text-left ${
              i === 1 
                ? "bg-accent text-black shadow-brutal translate-y-[-2px] translate-x-[-2px]" 
                : "bg-white text-black hover:bg-muted hover:shadow-brutal-active"
            }`}
          >
            <MessageSquare size={20} strokeWidth={i === 1 ? 3 : 2} />
            <span className="truncate">Comic AI Chat {i}</span>
          </button>
        ))}
      </div>

      <div className="pt-4 border-t-4 border-black mt-auto">
        <button className="comic-card w-full flex items-center justify-center gap-2 py-4 bg-white text-black hover:bg-primary">
          <Settings size={20} strokeWidth={3} />
          <span className="font-black uppercase text-lg">Settings</span>
        </button>
      </div>
    </aside>
  )
}
