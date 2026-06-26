import { motion } from "framer-motion"
import { useChatStore } from "@/store/chatStore"
import { chatApi } from "@/api/chat"
import { Check, Edit3, Trash2, X } from "lucide-react"
import { useState } from "react"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAuthStore } from "@/store/authStore"
import { useRequireAuth } from "@/hooks/useRequireAuth"

export function MessageList() {
  const { messages, removeMessage, updateMessage } = useChatStore()
  const token = useAuthStore((state) => state.token)
  const requireAuth = useRequireAuth()
  const [deletingKey, setDeletingKey] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const visibleMessages = token ? messages : []
  const getPersistedId = (id?: number) => (id && id > 0 ? id : undefined)

  const handleDeleteMessage = async (index: number, messageId?: number) => {
    if (!requireAuth()) return

    const persistedId = getPersistedId(messageId)
    const deleteKey = persistedId ? String(persistedId) : `local-${index}`
    if (deletingKey) return

    setDeletingKey(deleteKey)
    try {
      if (persistedId) {
        const res = await chatApi.deleteMessage(persistedId)
        if (res.data?.status_code !== 1000) {
          return
        }
      }
      removeMessage(index, persistedId)
    } catch (err) {
      console.error("Failed to delete message", err)
    } finally {
      setDeletingKey(null)
    }
  }

  const startEditing = (index: number, content: string, messageId?: number) => {
    if (!requireAuth()) return
    const persistedId = getPersistedId(messageId)
    setEditingKey(persistedId ? String(persistedId) : `local-${index}`)
    setEditContent(content)
  }

  const cancelEditing = () => {
    setEditingKey(null)
    setEditContent("")
  }

  const saveMessage = async (index: number, messageId?: number) => {
    if (!requireAuth()) return

    const nextContent = editContent.trim()
    if (!nextContent) return

    try {
      const persistedId = getPersistedId(messageId)
      if (persistedId) {
        const res = await chatApi.updateMessage(persistedId, nextContent)
        if (res.data?.status_code !== 1000) {
          return
        }
      }
      updateMessage(index, nextContent, persistedId)
      cancelEditing()
    } catch (err) {
      console.error("Failed to update message", err)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 halftone-bg scroll-smooth">
      <div className="max-w-4xl mx-auto space-y-10">
        {visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
            <h2 className="text-4xl font-black uppercase tracking-widest text-black/20">Empty Space</h2>
            <p className="font-bold uppercase mt-4">Start a conversation below</p>
          </div>
        ) : (
          visibleMessages.map((msg, i) => (
            <motion.div
              key={msg.id ?? `${msg.role}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group/message flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {(() => {
                const persistedId = getPersistedId(msg.id)
                const messageKey = persistedId ? String(persistedId) : `local-${i}`
                const isEditing = editingKey === messageKey

                return (
                  <>
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
                      ? 'bg-secondary text-black pr-20' 
                      : 'bg-white text-black pr-20'
                  }`}
                >
                  {!isEditing && (
                    <div className="absolute right-3 top-3 z-20 flex gap-1 rounded-none bg-inherit opacity-0 transition-opacity group-hover/message:opacity-100">
                      <button
                        type="button"
                        onClick={() => startEditing(i, msg.content, persistedId)}
                        disabled={deletingKey !== null}
                        title="Edit message"
                        className="flex h-7 w-7 items-center justify-center bg-transparent text-black/70 transition-colors hover:bg-black/10 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Edit3 size={13} strokeWidth={3.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(i, persistedId)}
                        disabled={deletingKey !== null}
                        title="Delete message"
                        className="flex h-7 w-7 items-center justify-center bg-transparent text-black/70 transition-colors hover:bg-black/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={13} strokeWidth={3.5} />
                      </button>
                    </div>
                  )}
                  {isEditing ? (
                    <div className="flex flex-col gap-3">
                      <textarea
                        value={editContent}
                        onChange={(event) => setEditContent(event.target.value)}
                        className="min-h-32 w-full resize-y border-4 border-black bg-white p-3 font-bold text-black outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="flex h-9 w-9 items-center justify-center border-4 border-black bg-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                          title="Cancel edit"
                        >
                          <X size={16} strokeWidth={4} />
                        </button>
                        <button
                          type="button"
                          onClick={() => saveMessage(i, persistedId)}
                          className="flex h-9 w-9 items-center justify-center border-4 border-black bg-primary shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                          title="Save edit"
                        >
                          <Check size={18} strokeWidth={4} />
                        </button>
                      </div>
                    </div>
                  ) : msg.content === '' ? (
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
                  </>
                )
              })()}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
