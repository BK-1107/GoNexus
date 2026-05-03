import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { LandingPage } from "@/pages/LandingPage"
import { ChatPage } from "@/pages/ChatPage"
import { VisionPage } from "@/pages/VisionPage"
import { KnowledgePage } from "@/pages/KnowledgePage"
import { AuthPage } from "@/pages/AuthPage"
import { useAuthStore } from "@/store/authStore"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />
}

function App() {
  return (
    <BrowserRouter>
      <div className="w-full min-h-screen halftone-bg relative">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          
          <Route path="/vision" element={
            <ProtectedRoute>
              <VisionPage />
            </ProtectedRoute>
          } />

          <Route path="/knowledge" element={
            <ProtectedRoute>
              <KnowledgePage />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
