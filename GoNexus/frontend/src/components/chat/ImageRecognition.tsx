import { Upload, Image as ImageIcon, X, Loader2, CheckCircle2, Zap, Search, Info, Brain, MessageSquare, Wand2, Copy } from "lucide-react"
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { imageApi } from "@/api/image"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useChatStore } from "@/store/chatStore"
import { useNavigate } from "react-router-dom"

interface ImageMeta {
  name: string
  size: string
  dimensions: string
  type: string
  lastModified: string
}

interface GeneratedPrompt {
  prompt: string
}

export function ImageRecognition() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle')
  const [backendResult, setBackendResult] = useState<string | null>(null)
  const [memorySession, setMemorySession] = useState<{ id: string; title: string } | null>(null)
  const [isSavingMemory, setIsSavingMemory] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null)
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [isEditingPrompt, setIsEditingPrompt] = useState(false)
  const [meta, setMeta] = useState<ImageMeta | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const requireAuth = useRequireAuth()
  const navigate = useNavigate()
  const { sessions, setSessions, setCurrentSessionId, setMessages } = useChatStore()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setStatus('idle')
      setBackendResult(null)
      setMemorySession(null)
      setIsSavingMemory(false)
      setGeneratedPrompt(null)
      setIsGeneratingPrompt(false)
      setCopiedPrompt(false)
      setIsEditingPrompt(false)

      // Extract metadata
      const img = new Image()
      img.onload = () => {
        setMeta({
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2) + " MB",
          dimensions: `${img.width} x ${img.height}`,
          type: file.type.split('/')[1].toUpperCase(),
          lastModified: new Date(file.lastModified).toLocaleString()
        })
      }
      img.src = url
    }
  }

  const handleSelectImage = () => {
    if (!requireAuth()) return
    fileInputRef.current?.click()
  }

  const handleStartAnalysis = async () => {
    if (!selectedFile || status !== 'idle') return
    if (!requireAuth()) return
    
    setStatus('analyzing')
    try {
      const res = await imageApi.recognize(selectedFile)
      if (res.data?.status_code === 1000) {
        setBackendResult(res.data.class_name)
        setMemorySession(null)
        setGeneratedPrompt(null)
        setCopiedPrompt(false)
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch (err) {
      console.error("Backend Analysis failed", err)
      setStatus('error')
    }
  }

  const handleSaveToMemory = async () => {
    if (!selectedFile || !backendResult || isSavingMemory) return
    if (!requireAuth()) return

    setIsSavingMemory(true)
    try {
      const res = await imageApi.saveToMemory(selectedFile, backendResult)
      if (res.data?.status_code === 1000 && res.data.session) {
        const session = {
          id: res.data.session.sessionId,
          title: res.data.session.name,
          updated_at: "",
        }
        setSessions([session, ...sessions])
        setMemorySession(session)
      }
    } catch (err) {
      console.error("Failed to save vision result to memory", err)
    } finally {
      setIsSavingMemory(false)
    }
  }

  const handleOpenChat = () => {
    if (!memorySession) return
    setCurrentSessionId(memorySession.id)
    setMessages([])
    navigate("/chat")
  }

  const handleGeneratePrompt = async () => {
    if (!backendResult || isGeneratingPrompt) return
    if (!requireAuth()) return

    setIsGeneratingPrompt(true)
    setCopiedPrompt(false)
    try {
      const res = await imageApi.generatePrompt(backendResult)
      if (res.data?.status_code === 1000) {
        setGeneratedPrompt({
          prompt: res.data.prompt || "",
        })
        setIsEditingPrompt(false)
      }
    } catch (err) {
      console.error("Failed to generate prompt", err)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  const handleCopyPrompt = async () => {
    if (!generatedPrompt?.prompt) return
    await navigator.clipboard.writeText(generatedPrompt.prompt)
    setCopiedPrompt(true)
    window.setTimeout(() => setCopiedPrompt(false), 1600)
  }

  const reset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setStatus('idle')
    setBackendResult(null)
    setMemorySession(null)
    setIsSavingMemory(false)
    setGeneratedPrompt(null)
    setIsGeneratingPrompt(false)
    setCopiedPrompt(false)
    setIsEditingPrompt(false)
    setMeta(null)
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center gap-4 border-b-4 border-black pb-4">
        <div className="bg-primary p-2 border-4 border-black shadow-[2px_2px_0_#000] transform -rotate-3">
          <ImageIcon size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Vision Nexus</h2>
          <p className="font-bold text-black/60">Real-time Backend Image Recognition Engine</p>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />

      <AnimatePresence mode="wait">
        {status === 'idle' && !previewUrl ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-4 border-black border-dashed p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/20 transition-all"
            onClick={handleSelectImage}
          >
            <div className="bg-primary p-4 border-4 border-black shadow-brutal mb-4">
              <Upload size={48} />
            </div>
            <p className="text-xl font-black uppercase">DROP OR SELECT IMAGE</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
            <div className="flex h-full flex-col gap-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="comic-card p-4 bg-white relative">
                <button onClick={reset} className="absolute -top-4 -right-4 bg-destructive border-4 border-black p-2 z-10 shadow-brutal hover:translate-x-1 hover:translate-y-1 transition-all">
                  <X size={20} />
                </button>
                <div className="relative h-[260px] overflow-hidden border-4 border-black bg-muted md:h-[340px]">
                  <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" />
                  {status === 'analyzing' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={48} />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-between items-center gap-4">
                  <span className="font-black uppercase truncate flex-1">{selectedFile?.name}</span>
                  <button 
                    onClick={handleStartAnalysis}
                    disabled={status !== 'idle'}
                    className="comic-btn px-6 py-2 bg-primary flex gap-2 shrink-0"
                  >
                    <Zap size={18} fill="currentColor" /> ANALYZE
                  </button>
                </div>
              </motion.div>

              {/* Metadata Card */}
              <AnimatePresence>
                {meta && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="comic-card flex-1 bg-white p-5 border-4 border-black"
                  >
                    <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4">
                      <Info size={20} className="text-primary" />
                      <h4 className="font-black uppercase text-base">Image Properties</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                      {[
                        { label: "Dimensions", value: meta.dimensions },
                        { label: "File Size", value: meta.size },
                        { label: "Format", value: meta.type },
                        { label: "Modified", value: meta.lastModified },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <p className="text-xs font-black text-black/45 uppercase">{item.label}</p>
                          <p className="text-base font-black truncate">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="comic-card h-full p-6 bg-accent border-primary flex flex-col gap-4">
              <h3 className="text-xl font-black uppercase flex items-center gap-2">
                <Search size={20} /> Backend Intelligence
              </h3>
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                {status === 'idle' && <p className="font-bold text-black/30 italic">Ready for Backend Request...</p>}
                {status === 'analyzing' && <p className="font-black animate-pulse">BACKEND IS PROCESSING DATA...</p>}
                {status === 'done' && backendResult && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
                    <div className="h-[430px] overflow-y-auto bg-white border-4 border-black p-4 shadow-brutal text-left">
                      <p className="font-black text-left leading-tight text-lg">{backendResult}</p>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-black">
                      <CheckCircle2 size={24} /> 100% VERIFIED BY GONEXUS
                    </div>
                    <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={handleGeneratePrompt}
                        disabled={isGeneratingPrompt}
                        className="comic-btn w-full justify-center bg-primary px-4 py-2.5 text-sm font-black uppercase whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isGeneratingPrompt ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Wand2 size={18} strokeWidth={3} />
                        )}
                        Generate Prompt
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveToMemory}
                        disabled={isSavingMemory || Boolean(memorySession)}
                        className="comic-btn w-full justify-center bg-primary px-4 py-2.5 text-sm font-black uppercase whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingMemory ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Brain size={18} strokeWidth={3} />
                        )}
                        {memorySession ? "Saved to Memory" : "Save to Memory"}
                      </button>
                    </div>
                    <div className="flex justify-center">
                      {memorySession && (
                        <button
                          type="button"
                          onClick={handleOpenChat}
                          className="comic-btn bg-white px-5 py-3 font-black uppercase"
                        >
                          <MessageSquare size={18} strokeWidth={3} />
                          Open Chat
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
                {status === 'error' && <p className="text-destructive font-black">⚠️ API CALL FAILED!</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {generatedPrompt && (
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-6"
        >
          <div className="comic-card bg-white p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-4 border-black pb-3">
              <h3 className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter">
                <Wand2 size={24} strokeWidth={3} />
                Prompt Studio
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingPrompt((value) => !value)}
                  className="comic-btn bg-white px-4 py-2 text-sm font-black uppercase"
                >
                  {isEditingPrompt ? "Done" : "Edit Prompt"}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="comic-btn bg-primary px-4 py-2 text-sm font-black uppercase"
                >
                  <Copy size={16} strokeWidth={3} />
                  {copiedPrompt ? "Copied" : "Copy Prompt"}
                </button>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-black uppercase tracking-widest text-black/50">Prompt</h4>
              <textarea
                value={generatedPrompt.prompt}
                onChange={(event) => setGeneratedPrompt({ prompt: event.target.value })}
                readOnly={!isEditingPrompt}
                className={`min-h-[280px] w-full resize-y border-4 border-black p-5 text-xl font-black leading-9 outline-none ${isEditingPrompt ? "bg-white" : "bg-[#f8fafc]"}`}
              />
            </div>
          </div>
        </motion.section>
      )}
    </div>
  )
}
