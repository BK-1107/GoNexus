import { useState, useRef } from "react"
import { Upload, FileText, CheckCircle2, Loader2, X, Brain, Database, Shield, ArrowLeft, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { fileApi } from "@/api/file"
import { useChatStore } from "@/store/chatStore"
import { NeoConfirm } from "@/components/ui/NeoConfirm"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useAuthStore } from "@/store/authStore"

export function KnowledgeBase() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const requireAuth = useRequireAuth()
  const token = useAuthStore((state) => state.token)
  
  const { modelType, setModelType, uploadedFiles, addUploadedFile, removeUploadedFile } = useChatStore()
  const visibleUploadedFiles = token ? uploadedFiles : []

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setStatus('idle')
      setError(null)
    }
  }

  const handleSelectFile = () => {
    if (!requireAuth()) return
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (!file) return
    if (!requireAuth()) return
    setStatus('uploading')
    try {
      const res = await fileApi.upload(file)
      if (res.data?.status_code === 1000) {
        setStatus('done')
        addUploadedFile(file.name)
        setModelType('2')
        setTimeout(() => {
          setStatus('idle')
          setFile(null)
        }, 2000)
      } else {
        setStatus('error')
        setError(res.data?.status_msg || "Upload failed")
      }
    } catch (err) {
      setStatus('error')
      setError("Server connection failed")
    }
  }

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return
    if (!requireAuth()) return
    try {
      const res = await fileApi.deleteKnowledge(fileToDelete)
      if (res.data?.status_code === 1000) {
        removeUploadedFile(fileToDelete)
      }
    } catch (err) {
      console.error("Delete failed", err)
    } finally {
      setFileToDelete(null)
    }
  }

  const handleModelChange = (type: string) => {
    if (!requireAuth()) return
    setModelType(type)
  }

  const requestDeleteFile = (filename: string) => {
    if (!requireAuth()) return
    setFileToDelete(filename)
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto py-8">
      {/* Navigation */}
      <motion.button 
        whileHover={{ x: -5 }}
        onClick={() => navigate('/chat')}
        className="flex items-center gap-2 font-black uppercase text-sm self-start group"
      >
        <ArrowLeft size={18} />
        <span className="group-hover:underline decoration-2">Back to Chat</span>
      </motion.button>

      {/* Header */}
      <div className="flex items-center gap-4 border-b-4 border-black pb-6">
        <div className="bg-accent p-3 border-4 border-black shadow-brutal transform -rotate-3">
          <Database size={40} />
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Knowledge Core</h1>
          <p className="font-bold text-black/60 uppercase">Inject documentation into AI neural networks</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Model Switcher */}
        <section className="comic-card p-6 bg-white space-y-6">
          <h2 className="text-2xl font-black uppercase flex items-center gap-2">
            <Brain size={24} /> Engine Mode
          </h2>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => handleModelChange('1')}
              className={`p-4 border-4 border-black text-left transition-all ${
                modelType === '1' ? 'bg-primary shadow-brutal translate-x-[-2px] translate-y-[-2px]' : 'bg-white hover:bg-muted'
              }`}
            >
              <h3 className="font-black uppercase">Standard Mode</h3>
              <p className="text-xs font-bold opacity-60 uppercase">General knowledge & reasoning</p>
            </button>
            <button 
              onClick={() => handleModelChange('2')}
              className={`p-4 border-4 border-black text-left transition-all ${
                modelType === '2' ? 'bg-primary shadow-brutal translate-x-[-2px] translate-y-[-2px]' : 'bg-white hover:bg-muted'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-black uppercase">RAG Mode (Knowledge Base)</h3>
                <Shield size={16} className="text-black" />
              </div>
              <p className="text-xs font-bold opacity-60 uppercase">Retrieval Augmented Generation from your files</p>
            </button>
          </div>
        </section>

        {/* Upload Area */}
        <section className="comic-card p-6 bg-secondary space-y-6">
          <h2 className="text-2xl font-black uppercase flex items-center gap-2">
            <Upload size={24} /> Data Injection
          </h2>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".txt,.md"
          />

          <div 
            onClick={handleSelectFile}
            className="border-4 border-black border-dashed bg-white p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/20 transition-all group"
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText size={48} className="text-primary" />
                <span className="font-black truncate max-w-[200px]">{file.name}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-xs font-bold underline hover:text-destructive"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <Upload size={48} className="mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-black uppercase">Click to Select Doc</p>
                <p className="text-[10px] font-bold opacity-40 uppercase mt-2">Support: TXT, MD</p>
              </>
            )}
          </div>

          <button 
            onClick={handleUpload}
            disabled={!file || status === 'uploading'}
            className="comic-btn w-full bg-black text-white py-4 font-black uppercase tracking-widest disabled:opacity-50"
          >
            {status === 'uploading' ? (
              <Loader2 className="animate-spin" />
            ) : status === 'done' ? (
              <div className="flex items-center gap-2"><CheckCircle2 /> Injected</div>
            ) : (
              "Start Knowledge Injection"
            )}
          </button>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive border-4 border-black p-3 text-white font-black text-xs uppercase flex justify-between items-center"
              >
                <span>⚠️ {error}</span>
                <X size={14} className="cursor-pointer" onClick={() => setError(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* Uploaded Files List */}
      <AnimatePresence>
        {visibleUploadedFiles.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="comic-card p-6 bg-white space-y-4"
          >
            <h3 className="font-black uppercase flex items-center gap-2 text-primary">
              <CheckCircle2 size={18} /> Injected Documents ({visibleUploadedFiles.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {visibleUploadedFiles.map((name, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted border-2 border-black group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText size={16} className="shrink-0" />
                    <span className="text-sm font-bold truncate">{name}</span>
                  </div>
                  <button 
                    onClick={() => requestDeleteFile(name)}
                    className="p-1 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NeoConfirm 
        isOpen={fileToDelete !== null}
        title="Delete File?"
        message={`Remove "${fileToDelete}" from AI Knowledge Core? This will delete its vector embeddings.`}
        onConfirm={confirmDeleteFile}
        onCancel={() => setFileToDelete(null)}
        confirmText="Erase"
        cancelText="Cancel"
        type="danger"
      />

      {/* Info Card */}
      <div className="bg-white border-4 border-black p-6 shadow-brutal-active relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 bg-black text-white text-[10px] font-black uppercase">System Notice</div>
        <h3 className="font-black uppercase mb-2">How RAG Works in GoNexus</h3>
        <p className="font-bold text-sm leading-relaxed">
          When you upload a document, GoNexus converts it into high-dimensional vectors and stores them in our Redis Knowledge Store. 
          In <span className="bg-primary px-1">RAG Mode</span>, the AI will perform a semantic search across your knowledge base for every query, 
          finding the most relevant fragments to provide accurate, context-aware answers.
        </p>
      </div>
    </div>
  )
}
