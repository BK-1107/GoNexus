import { BrowserRouter, Routes, Route } from "react-router-dom"
import { LandingPage } from "@/pages/LandingPage"
import { ChatPage } from "@/pages/ChatPage"
import { VisionPage } from "@/pages/VisionPage"
import { KnowledgePage } from "@/pages/KnowledgePage"
import { AuthPage } from "@/pages/AuthPage"

function App() {
  return (
    <BrowserRouter>
      <div className="w-full min-h-screen halftone-bg relative">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/vision" element={<VisionPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
