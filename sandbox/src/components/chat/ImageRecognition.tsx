import { Upload, Image as ImageIcon, X, Loader2, CheckCircle2, Zap, Search, Info } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { imageApi } from "@/api/image"

interface ImageMeta {
  name: string
  size: string
  dimensions: string
  type: string
  lastModified: string
}

export function ImageRecognition() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle')
  const [backendResult, setBackendResult] = useState<string | null>(null)
  const [meta, setMeta] = useState<ImageMeta | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setStatus('idle')
      setBackendResult(null)

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

  const handleStartAnalysis = async () => {
    if (!selectedFile || status !== 'idle') return
    
    setStatus('analyzing')
    try {
      const res = await imageApi.recognize(selectedFile)
      if (res.data?.status_code === 1000) {
        setBackendResult(res.data.class_name)
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch (err) {
      console.error("Backend Analysis failed", err)
      setStatus('error')
    }
  }

  const reset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setStatus('idle')
    setBackendResult(null)
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
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="bg-primary p-4 border-4 border-black shadow-brutal mb-4">
              <Upload size={48} />
            </div>
            <p className="text-xl font-black uppercase">DROP OR SELECT IMAGE</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="comic-card p-4 bg-white relative">
                <button onClick={reset} className="absolute -top-4 -right-4 bg-destructive border-4 border-black p-2 z-10 shadow-brutal hover:translate-x-1 hover:translate-y-1 transition-all">
                  <X size={20} />
                </button>
                <div className="border-4 border-black aspect-video bg-muted relative overflow-hidden">
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
                    className="comic-card bg-white p-4 border-4 border-black"
                  >
                    <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-3">
                      <Info size={18} className="text-primary" />
                      <h4 className="font-black uppercase text-sm">Image Properties</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Dimensions", value: meta.dimensions },
                        { label: "File Size", value: meta.size },
                        { label: "Format", value: meta.type },
                        { label: "Modified", value: meta.lastModified },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <p className="text-[10px] font-black text-black/40 uppercase tracking-tighter">{item.label}</p>
                          <p className="text-xs font-bold truncate">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="comic-card p-6 bg-accent border-primary flex flex-col gap-4">
              <h3 className="text-xl font-black uppercase flex items-center gap-2">
                <Search size={20} /> Backend Intelligence
              </h3>
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                {status === 'idle' && <p className="font-bold text-black/30 italic">Ready for Backend Request...</p>}
                {status === 'analyzing' && <p className="font-black animate-pulse">BACKEND IS PROCESSING DATA...</p>}
                {status === 'done' && backendResult && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
                    <div className="bg-white border-4 border-black p-4 shadow-brutal">
                      <p className="font-black text-left leading-tight text-lg">{backendResult}</p>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-black">
                      <CheckCircle2 size={24} /> 100% VERIFIED BY GONEXUS
                    </div>
                  </motion.div>
                )}
                {status === 'error' && <p className="text-destructive font-black">⚠️ API CALL FAILED!</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
