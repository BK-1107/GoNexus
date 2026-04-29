import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { ImageRecognition } from "@/components/chat/ImageRecognition"

export function VisionPage() {
  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto flex flex-col gap-8">
      
      <header className="flex justify-between items-center bg-white border-4 border-black p-4 shadow-brutal">
        <div className="flex items-center gap-4">
          <Link to="/" className="comic-btn p-2 bg-secondary text-black">
            <ArrowLeft size={24} strokeWidth={3} />
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Vision <span className="text-primary">Lab</span></h1>
        </div>
      </header>

      <main className="bg-white border-4 border-black p-8 shadow-brutal min-h-[60vh] flex flex-col">
        <div className="inline-block bg-primary border-4 border-black px-4 py-2 font-bold transform -rotate-1 mb-8 self-start">
          👁️ Upload Image for Analysis
        </div>
        
        <ImageRecognition />
      </main>

    </div>
  )
}
