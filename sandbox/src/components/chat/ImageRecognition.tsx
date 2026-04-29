import { Upload, Image as ImageIcon, X } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function ImageRecognition() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  return (
    <div className="w-full flex flex-col gap-6">
      
      <div className="flex items-center gap-4 border-b-4 border-black pb-4">
        <div className="bg-primary p-2 border-4 border-black shadow-[2px_2px_0_#000] transform -rotate-3">
          <ImageIcon size={32} />
        </div>
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Computer Vision</h2>
          <p className="font-bold">Upload an image for deep analysis</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedImage ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border-4 border-black border-dashed p-12 flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-secondary/20 group"
            onClick={() => setSelectedImage("https://via.placeholder.com/600x400?text=COMIC+STYLE+IMAGE")}
          >
            <div className="bg-primary p-4 border-4 border-black shadow-brutal mb-6 group-hover:translate-y-1 group-hover:translate-x-1 group-hover:shadow-brutal-active transition-all">
              <Upload size={48} strokeWidth={2.5} />
            </div>
            <p className="text-2xl font-black uppercase text-center bg-white px-2">DRAG & DROP IMAGE</p>
            <p className="font-bold text-black/60 text-center mt-2 uppercase">or click to select from files</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="comic-card p-6 relative bg-white"
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-4 -right-4 bg-destructive border-4 border-black text-black p-2 shadow-brutal z-10 hover:translate-y-1 hover:translate-x-1 hover:shadow-brutal-active transition-all"
            >
              <X size={24} strokeWidth={3} />
            </button>
            <img 
              src={selectedImage} 
              alt="Uploaded for recognition" 
              className="w-full h-64 object-cover border-4 border-black"
            />
            <div className="mt-6 flex justify-between items-center bg-secondary border-4 border-black p-4 shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)]">
              <span className="font-black uppercase text-xl">Ready for Scan</span>
              <button className="comic-btn bg-primary text-black px-6 py-3 text-lg uppercase">
                Analyze
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
