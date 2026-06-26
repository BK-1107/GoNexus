import { Link } from "react-router-dom"
import { ArrowRight, Star, Brain, Image as ImageIcon, MessageSquare, Construction } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

export function LandingPage() {
  const [showUnderConstruction, setShowUnderConstruction] = useState(false)
  const navItems = [
    { name: "Features", path: "https://github.com/BK-1107/GoNexus" },
    { name: "About Me", path: "https://bk-1107.com/about/" },
    { name: "Docs", path: "https://github.com/BK-1107/GoNexus" },
  ]

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto flex flex-col gap-16">
      
      {/* Header */}
      <header className="flex justify-between items-center bg-white border-4 border-black p-4 shadow-brutal sticky top-8 z-50">
        <motion.h1 
          whileHover={{ scale: 1.1, rotate: -2 }}
          className="text-3xl font-black uppercase tracking-tighter cursor-pointer"
        >
          Go<span className="text-primary">Nexus</span>
        </motion.h1>
        
        <nav className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => (
            <motion.a
              key={item.name}
              href={item.path}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.2, color: "#FFDE03", rotate: 5 }}
              className="font-black uppercase tracking-widest text-sm hover:underline decoration-4 underline-offset-4"
            >
              {item.name}
            </motion.a>
          ))}
          <div className="flex gap-4 ml-4">
            <Link to="/auth" className="comic-btn px-6 py-2 bg-secondary text-black">Login</Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/chat" className="comic-btn px-6 py-2 bg-primary text-black">Start Free</Link>
            </motion.div>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="inline-block bg-secondary border-4 border-black px-4 py-2 font-bold transform -rotate-2"
          >
            Private Knowledge AI Platform
          </motion.div>
          
          <div className="relative">
            <motion.h2 
              className="text-7xl font-black uppercase leading-[0.9] tracking-tighter cursor-default"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <motion.span 
                whileHover={{ y: -10, color: "#22C55E" }} 
                className="inline-block transition-colors duration-100"
              >
                Chat With
              </motion.span> <br/>
              <motion.span 
                whileHover={{ scale: 1.1, rotate: 2 }}
                className="text-primary inline-block" 
                style={{ textShadow: "4px 4px 0 #000" }}
              >
                Knowledge
              </motion.span>{" "}
              <motion.span 
                whileHover={{ skewX: -20, color: "#A78BFA" }}
                className="inline-block transition-all"
              >
                Fast.
              </motion.span>
            </motion.h2>
          </div>

          <div className="flex gap-4 pt-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/chat" className="comic-btn px-10 py-5 bg-primary text-2xl group overflow-hidden relative">
                <span className="relative z-10 flex items-center gap-2">
                  Enroll Now <ArrowRight className="group-hover:translate-x-2 transition-transform" strokeWidth={4} />
                </span>
                <motion.div 
                  className="absolute inset-0 bg-secondary"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ type: "tween" }}
                />
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Abstract Graphic Area */}
        <div className="relative h-[500px] flex items-center justify-center">
          <motion.div 
            className="comic-card w-full h-full bg-[#FFDE03] relative overflow-hidden flex items-center justify-center"
            initial={{ rotate: 3, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
          >
            {/* Abstract Shapes - Now Draggable & Interactive */}
            <motion.div 
              drag
              dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
              whileHover={{ scale: 1.1, cursor: 'grab' }}
              whileDrag={{ scale: 1.2, cursor: 'grabbing', zIndex: 50 }}
              animate={{ rotate: 360 }} 
              transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" } }}
              className="absolute -top-20 -left-20 w-64 h-64 border-8 border-black opacity-10 rounded-3xl"
            />
            
            <motion.div 
              drag
              dragSnapToOrigin
              whileHover={{ scale: 1.2, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              animate={{ y: [0, -20, 0] }} 
              transition={{ y: { duration: 4, repeat: Infinity } }}
              className="absolute top-10 right-10 w-20 h-20 bg-primary border-4 border-black shadow-brutal cursor-pointer z-10"
            />
            
            <motion.div 
              drag
              dragSnapToOrigin
              whileHover={{ scale: 1.1, rotate: -5, cursor: 'grab' }}
              whileDrag={{ cursor: 'grabbing' }}
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 10,
                scale: { duration: 3, repeat: Infinity }
              }}
              className="absolute bottom-20 left-10 w-32 h-32 border-4 border-black rounded-full halftone-bg shadow-brutal cursor-pointer z-10"
            />
            
            <motion.div 
              drag
              dragConstraints={{ left: -150, right: 150, top: -150, bottom: 150 }}
              dragElastic={0.2}
              className="z-10 text-center space-y-4 cursor-move"
            >
              <motion.div 
                whileHover={{ scale: 1.05, rotate: -1 }}
                className="bg-white border-4 border-black p-4 shadow-brutal transform -rotate-3 inline-block"
              >
                <p className="text-4xl font-black uppercase tracking-tighter">AI AGENTIC</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 1 }}
                className="bg-secondary border-4 border-black p-2 shadow-brutal transform rotate-2"
              >
                <p className="text-2xl font-black uppercase">REVOLUTION</p>
              </motion.div>
            </motion.div>

            {/* Squiggles / Dots */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100">
               <motion.path 
                 d="M10,10 Q20,40 40,20 T80,50" 
                 fill="none" 
                 stroke="black" 
                 strokeWidth="2" 
                 animate={{ pathLength: [0, 1], pathOffset: [0, 1] }}
                 transition={{ duration: 5, repeat: Infinity }}
               />
               <circle cx="85" cy="15" r="3" fill="black" />
               <rect x="10" y="80" width="10" height="10" fill="black" />
            </svg>
          </motion.div>
          
          {/* Floating Tag */}
          <motion.div 
            drag
            dragSnapToOrigin
            whileHover={{ scale: 1.1 }}
            animate={{ y: [0, -10, 0] }}
            transition={{ y: { duration: 2, repeat: Infinity } }}
            className="absolute -bottom-6 -right-6 bg-accent border-4 border-black px-6 py-3 font-black uppercase text-xl shadow-brutal z-20 cursor-help"
          >
            v2.0 Beta
          </motion.div>
        </div>
      </section>

      {/* Capabilities Catalog */}
      <section className="space-y-8">
        <h2 className="text-5xl font-black uppercase tracking-tighter bg-white inline-block px-4 py-2 border-4 border-black shadow-brutal">Tool Catalog</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Link to="/chat" className="comic-card p-8 bg-primary hover:bg-white flex flex-col gap-4 group transition-all">
            <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center rounded-full group-hover:bg-primary transition-colors">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-2xl font-black uppercase">AI Chat</h3>
            <p className="font-medium">Stream answers grounded in your private knowledge base.</p>
          </Link>
          
          <Link to="/vision" className="comic-card p-8 bg-secondary hover:bg-white flex flex-col gap-4 group transition-all">
            <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center rounded-full group-hover:bg-secondary transition-colors">
              <ImageIcon size={32} />
            </div>
            <h3 className="text-2xl font-black uppercase">Vision Analysis</h3>
            <p className="font-medium">Upload images for instant object recognition.</p>
          </Link>

          <button
            type="button"
            onClick={() => setShowUnderConstruction(true)}
            className="comic-card p-8 bg-accent hover:bg-white flex flex-col gap-4 group transition-all text-left"
          >
            <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center rounded-full group-hover:bg-accent transition-colors">
              <Brain size={32} />
            </div>
            <h3 className="text-2xl font-black uppercase">Memory</h3>
            <p className="font-medium">Extract, import, and shape durable chat context.</p>
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="comic-card p-12 -mt-8 bg-white text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full halftone-bg opacity-10 pointer-events-none" />
        <div className="relative z-10 -translate-y-4">
          <div className="flex justify-center gap-2 text-secondary mb-4">
            {[1,2,3,4,5].map(i => <Star key={i} fill="currentColor" size={32} className="drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />)}
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">"Absolutely mind-blowing platform!"</h2>
        </div>
      </section>

      {showUnderConstruction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.8, rotate: -2, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            className="comic-card max-w-md bg-white p-8 text-center"
          >
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center border-4 border-black bg-secondary shadow-brutal">
              <Construction size={44} strokeWidth={3.5} />
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter">Under Construction</h3>
            <p className="mt-3 font-bold uppercase text-black/60">
              Memory tools are coming soon. Please check back later.
            </p>
            <button
              type="button"
              onClick={() => setShowUnderConstruction(false)}
              className="comic-btn mt-6 bg-primary px-8 py-3 font-black uppercase"
            >
              Got It
            </button>
          </motion.div>
        </div>
      )}

    </div>
  )
}
