import { BrowserRouter, Routes, Route } from "react-router-dom"
import { LandingPage } from "@/pages/LandingPage"
import { ChatPage } from "@/pages/ChatPage"
import { VisionPage } from "@/pages/VisionPage"

function App() {
  return (
    <BrowserRouter>
      <div className="w-full min-h-screen halftone-bg relative">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/vision" element={<VisionPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
