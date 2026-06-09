import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, X } from "lucide-react"

interface NeoConfirmProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

export function NeoConfirm({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = 'danger'
}: NeoConfirmProps) {
  if (!isOpen) return null

  const getTheme = () => {
    switch (type) {
      case 'danger': return { bg: 'bg-destructive', icon: 'text-white' }
      case 'warning': return { bg: 'bg-primary', icon: 'text-black' }
      default: return { bg: 'bg-accent', icon: 'text-black' }
    }
  }

  const theme = getTheme()

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.9, opacity: 0, rotate: 2 }}
          className="relative w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-8 overflow-hidden"
        >
          {/* Decorative Corner */}
          <div className={`absolute top-0 right-0 w-16 h-16 ${theme.bg} border-b-4 border-l-4 border-black transform translate-x-8 -translate-y-8 rotate-45`} />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 ${theme.bg} border-4 border-black shadow-[3px_3px_0px_#000] flex items-center justify-center shrink-0`}>
                <AlertCircle size={32} strokeWidth={3} className={theme.icon} />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{title}</h3>
            </div>

            <p className="text-lg font-bold mb-8 leading-tight bg-muted p-4 border-2 border-black italic">
              "{message}"
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onConfirm}
                className={`comic-btn flex-1 py-4 px-6 ${theme.bg} text-black font-black uppercase tracking-widest text-lg shadow-[4px_4px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all`}
              >
                {confirmText}
              </button>
              <button
                onClick={onCancel}
                className="comic-btn flex-1 py-4 px-6 bg-white text-black font-black uppercase tracking-widest text-lg border-4 border-black shadow-[4px_4px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                {cancelText}
              </button>
            </div>
          </div>

          <button 
            onClick={onCancel}
            className="absolute top-4 right-4 text-black hover:rotate-90 transition-transform p-1"
          >
            <X size={24} strokeWidth={4} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
