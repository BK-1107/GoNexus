import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import axios from "axios"
import { apiUrl } from "@/api/base"
import { Shield, User, Lock, ArrowRight, Mail, KeyRound } from "lucide-react"

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [inviteVerified, setInviteVerified] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [captcha, setCaptcha] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState("")
  const [isSendingCaptcha, setIsSendingCaptcha] = useState(false)
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()

  const handleInviteCheck = async () => {
    setError("")
    try {
      const res = await axios.post(apiUrl("/user/check-invite"), { inviteCode })
      if (res.data?.status_code === 1000) {
        setInviteVerified(true)
      } else {
        setError(res.data?.status_msg || "Invalid invite code")
      }
    } catch (err: any) {
      setError(err.response?.data?.status_msg || "Connection error")
    }
  }

  const handleSendCaptcha = async () => {
    if (!email.trim() || isSendingCaptcha) return
    setError("")
    setIsSendingCaptcha(true)
    try {
      const res = await axios.post(apiUrl("/user/captcha"), { email })
      if (res.data?.status_code !== 1000) {
        setError(res.data?.status_msg || "Failed to send captcha")
      }
    } catch (err: any) {
      setError(err.response?.data?.status_msg || "Connection error")
    } finally {
      setIsSendingCaptcha(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isLogin && !inviteVerified) {
      await handleInviteCheck()
      return
    }

    try {
      const endpoint = isLogin ? "/user/login" : "/user/register"
      const payload = isLogin ? { username, password } : { email, password, captcha }
      const res = await axios.post(apiUrl(endpoint), payload)

      if (res.data?.status_code === 1000) {
        const token = res.data.token
        setAuth(token, isLogin ? username : email)
        navigate("/chat")
      } else {
        setError(res.data?.status_msg || "Action failed")
      }
    } catch (err: any) {
      setError(err.response?.data?.status_msg || "Connection error")
    }
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setInviteVerified(false)
    setError("")
    setPassword("")
    setCaptcha("")
    setInviteCode("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="comic-card w-full max-w-md bg-white p-8 space-y-8 relative">
        <div className="absolute -top-6 -left-6 bg-primary border-4 border-black px-4 py-2 font-black uppercase text-xl shadow-brutal transform -rotate-3">
          {isLogin ? "Welcome Back!" : inviteVerified ? "Join Us!" : "Invite Only"}
        </div>

        <div className="text-center space-y-2 pt-4">
          <div className="inline-block bg-secondary border-4 border-black p-3 rounded-full mb-2">
            <Shield size={40} strokeWidth={3} />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter italic">GoNexus Auth</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isLogin && (
            <div className="space-y-2">
              <label className="block font-black uppercase text-sm tracking-widest">Username</label>
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
          )}

          {!isLogin && !inviteVerified && (
            <div className="space-y-2">
              <label className="block font-black uppercase text-sm tracking-widest">Invite Code</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={20} />
                <input
                  type="password"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="comic-input w-full !pl-14 font-bold"
                  placeholder="SECRET PHRASE"
                  required
                />
              </div>
            </div>
          )}

          {!isLogin && inviteVerified && (
            <>
              <div className="space-y-2">
                <label className="block font-black uppercase text-sm tracking-widest">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="comic-input w-full !pl-14 font-bold"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-black uppercase text-sm tracking-widest">Captcha</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                    className="comic-input flex-1 font-bold"
                    placeholder="EMAIL CODE"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendCaptcha}
                    disabled={!email.trim() || isSendingCaptcha}
                    className="comic-btn bg-secondary px-4 text-sm font-black uppercase disabled:opacity-50"
                  >
                    {isSendingCaptcha ? "Sending" : "Send"}
                  </button>
                </div>
              </div>
            </>
          )}

          {(isLogin || inviteVerified) && (
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
          )}

          {error && (
            <div className="bg-destructive/20 border-4 border-destructive p-3 text-sm font-bold text-destructive uppercase animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="comic-btn w-full bg-primary py-4 text-xl uppercase font-black tracking-widest hover:bg-secondary">
            {isLogin ? "Login Now" : inviteVerified ? "Register Now" : "Unlock Register"} <ArrowRight className="ml-2" strokeWidth={4} />
          </button>
        </form>

        <div className="text-center pt-4">
          <button
            onClick={switchMode}
            className="font-black uppercase text-sm underline hover:text-primary transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  )
}
