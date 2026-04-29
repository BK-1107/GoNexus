import { motion } from "framer-motion"
import { useChatStore } from "@/store/chatStore"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export function MessageList() {
  const messages = useChatStore((state) => state.messages)

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 halftone-bg scroll-smooth">
      <div className="max-w-4xl mx-auto space-y-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
            <h2 className="text-4xl font-black uppercase tracking-widest text-black/20">Empty Space</h2>
            <p className="font-bold uppercase mt-4">Start a conversation below</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-12 h-12 bg-primary border-4 border-black shadow-brutal flex items-center justify-center mr-4 mt-2 shrink-0 transform -rotate-3">
                  <span className="text-black font-black text-xl">GN</span>
                </div>
              )}
              
              <div className="relative max-w-[85%]">
                {/* Comic bubble tail for assistant */}
                {msg.role === 'assistant' && (
                  <div className="absolute -left-3 top-6 w-6 h-6 bg-white border-b-4 border-l-4 border-black transform rotate-45" />
                )}
                {/* Comic bubble tail for user */}
                {msg.role === 'user' && (
                  <div className="absolute -right-3 top-6 w-6 h-6 bg-secondary border-t-4 border-r-4 border-black transform rotate-45" />
                )}
                
                <div
                  className={`relative z-10 px-6 py-4 text-[16px] leading-relaxed font-bold border-4 border-black shadow-brutal prose prose-stone max-w-none ${
                    msg.role === 'user' 
                      ? 'bg-secondary text-black' 
                      : 'bg-white text-black'
                  }`}
                >
                  {msg.content === '' ? (
                    <div className="flex gap-1 py-2">
                      {[0, 1, 2].map((dot) => (
                        <motion.div
                          key={dot}
                          animate={{ y: [0, -10, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: dot * 0.1,
                            ease: "easeInOut"
                          }}
                          className="w-2 h-2 bg-primary border-2 border-black"
                        />
                      ))}
                    </div>
                  ) : (
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <div className="border-2 border-black my-4 shadow-brutal-active">
                              <SyntaxHighlighter
                                style={vscDarkPlus as any}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className="bg-black/10 px-1 rounded font-black" {...props}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-12 h-12 bg-accent border-4 border-black shadow-brutal flex items-center justify-center ml-4 mt-2 shrink-0 transform rotate-3">
                  <span className="text-black font-black text-xl">U</span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
