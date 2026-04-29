import { Link } from "react-router-dom"
import { ArrowRight, Star, Zap, Image as ImageIcon, MessageSquare } from "lucide-react"

export function LandingPage() {
  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto flex flex-col gap-16">
      
      {/* Header */}
      <header className="flex justify-between items-center bg-white border-4 border-black p-4 shadow-brutal">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Gopher<span className="text-primary">AI</span></h1>
        <nav className="flex gap-4">
          <Link to="/chat" className="comic-btn px-6 py-2 bg-secondary text-black">Login</Link>
          <Link to="/chat" className="comic-btn px-6 py-2 bg-primary text-black">Start Free</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-block bg-secondary border-4 border-black px-4 py-2 font-bold transform -rotate-2">
            🚀 The Ultimate Playground
          </div>
          <h2 className="text-7xl font-black uppercase leading-[0.9] tracking-tighter">
            Build Your <br/>
            <span className="text-primary" style={{ textShadow: "4px 4px 0 #000" }}>Future</span> Fast.
          </h2>
          <p className="text-xl font-medium border-l-4 border-black pl-4 py-2 bg-white">
            Access our massive catalog of AI tools, track your learning progress, and join thousands of students worldwide.
          </p>
          <div className="flex gap-4">
            <Link to="/chat" className="comic-btn px-8 py-4 bg-primary text-xl">
              Enroll Now <ArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
        
        {/* Progress Tracking Demo */}
        <div className="comic-card p-6 space-y-6 bg-[#A78BFA]">
          <h3 className="text-2xl font-black uppercase border-b-4 border-black pb-2 bg-white px-2 inline-block">Progress Tracker</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border-4 border-black p-4 flex items-center justify-between">
                <span className="font-bold">Module {i} Mastery</span>
                <div className="w-32 h-6 border-4 border-black bg-white overflow-hidden">
                  <div className={`h-full bg-secondary border-r-4 border-black w-[${i * 30}%]`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Catalog */}
      <section className="space-y-8">
        <h2 className="text-5xl font-black uppercase tracking-tighter bg-white inline-block px-4 py-2 border-4 border-black shadow-brutal">Tool Catalog</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Link to="/chat" className="comic-card p-8 bg-primary hover:bg-white flex flex-col gap-4 group">
            <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center rounded-full group-hover:bg-primary transition-colors">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-2xl font-black uppercase">Chat Session</h3>
            <p className="font-medium">Engage with our advanced conversational AI.</p>
          </Link>
          
          <Link to="/vision" className="comic-card p-8 bg-secondary hover:bg-white flex flex-col gap-4 group">
            <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center rounded-full group-hover:bg-secondary transition-colors">
              <ImageIcon size={32} />
            </div>
            <h3 className="text-2xl font-black uppercase">Vision Analysis</h3>
            <p className="font-medium">Upload images for instant object recognition.</p>
          </Link>

          <div className="comic-card p-8 bg-destructive hover:bg-white flex flex-col gap-4 group">
            <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center rounded-full group-hover:bg-destructive transition-colors">
              <Zap size={32} />
            </div>
            <h3 className="text-2xl font-black uppercase">Fast APIs</h3>
            <p className="font-medium">Integrate AI seamlessly into your projects.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="comic-card p-12 bg-white text-center space-y-8">
        <div className="flex justify-center gap-2 text-secondary">
          {[1,2,3,4,5].map(i => <Star key={i} fill="currentColor" size={32} className="drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />)}
        </div>
        <h2 className="text-4xl font-black uppercase tracking-tighter">"Absolutely mind-blowing platform!"</h2>
        <p className="text-xl font-medium">— Student Review</p>
      </section>

    </div>
  )
}
