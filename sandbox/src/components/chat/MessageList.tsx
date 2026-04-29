import { motion } from "framer-motion"

export function MessageList() {
  const messages = [
    { role: "user", content: "Hey! What's the plan for today?" },
    { role: "assistant", content: "BOOM! We are going full Neo-Brutalism today. Get ready for some loud colors and heavy borders!" },
    { role: "user", content: "That sounds awesome. Let's do it!" }
  ]

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 halftone-bg">
      <div className="max-w-4xl mx-auto space-y-10">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.1 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-12 h-12 bg-primary border-4 border-black shadow-brutal flex items-center justify-center mr-4 mt-2 shrink-0 transform -rotate-3">
                <span className="text-black font-black text-xl">G</span>
              </div>
            )}
            
            <div className="relative">
              {/* Comic bubble tail for assistant */}
              {msg.role === 'assistant' && (
                <div className="absolute -left-3 top-6 w-6 h-6 bg-white border-b-4 border-l-4 border-black transform rotate-45" />
              )}
              {/* Comic bubble tail for user */}
              {msg.role === 'user' && (
                <div className="absolute -right-3 top-6 w-6 h-6 bg-secondary border-t-4 border-r-4 border-black transform rotate-45" />
              )}
              
              <div
                className={`relative z-10 max-w-[80%] px-6 py-4 text-[16px] leading-relaxed font-bold border-4 border-black shadow-brutal ${
                  msg.role === 'user' 
                    ? 'bg-secondary text-black' 
                    : 'bg-white text-black'
                }`}
              >
                {msg.content}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-12 h-12 bg-accent border-4 border-black shadow-brutal flex items-center justify-center ml-4 mt-2 shrink-0 transform rotate-3">
                <span className="text-black font-black text-xl">U</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
