import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import axios from "axios"
import { Shield, User, Lock, ArrowRight } from "lucide-react"

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    try {
      const endpoint = isLogin ? "/api/v1/user/login" : "/api/v1/user/register"
      
      // 注意：根据后端 RegisterRequest 定义，注册使用的是 email 字段
      const payload = isLogin 
        ? { username, password } 
        : { email: username, password, captcha: "123456" } // 暂时硬编码验证码或提示用户

      const res = await axios.post(endpoint, payload)
      
      // 后端返回结构为 { status_code: 200, status_msg: "...", token: "..." }
      if (res.data?.status_code === 1000) {
        const token = res.data.token
        setAuth(token, username)
        navigate("/chat")
      } else {
        setError(res.data?.status_msg || "Action failed")
      }
    } catch (err: any) {
      setError(err.response?.data?.status_msg || "Connection error")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="comic-card w-full max-w-md bg-white p-8 space-y-8 relative">
        <div className="absolute -top-6 -left-6 bg-primary border-4 border-black px-4 py-2 font-black uppercase text-xl shadow-brutal transform -rotate-3">
          {isLogin ? "Welcome Back!" : "Join Us!"}
        </div>

        <div className="text-center space-y-2 pt-4">
          <div className="inline-block bg-secondary border-4 border-black p-3 rounded-full mb-2">
            <Shield size={40} strokeWidth={3} />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter italic">GoNexus Auth</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block font-black uppercase text-sm tracking-widest">Username / Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={20} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="comic-input w-full !pl-14 font-bold" 
                placeholder="HERO_NAME"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-black uppercase text-sm tracking-widest">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="comic-input w-full !pl-14 font-bold" 
                placeholder="********"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-destructive/20 border-4 border-destructive p-3 text-sm font-bold text-destructive uppercase animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="comic-btn w-full bg-primary py-4 text-xl uppercase font-black tracking-widest hover:bg-secondary">
            {isLogin ? "Login Now" : "Register Now"} <ArrowRight className="ml-2" strokeWidth={4} />
          </button>
        </form>

        <div className="text-center pt-4">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="font-black uppercase text-sm underline hover:text-primary transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  )
}
