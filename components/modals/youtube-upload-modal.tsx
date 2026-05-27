"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Youtube, Globe, Lock, EyeOff, Loader2, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clip } from "@/lib/api"
import { cn } from "@/lib/utils"

interface YoutubeUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { title: string; description: string; privacyStatus: string }) => Promise<void>
  clip: Clip | null
}

export function YoutubeUploadModal({ isOpen, onClose, onConfirm, clip }: YoutubeUploadModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [privacy, setPrivacy] = useState("unlisted")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (clip && isOpen) {
      setTitle(clip.title || "")
      setDescription(clip.justification || "")
      setPrivacy("unlisted")
      setSuccess(false)
    }
  }, [clip, isOpen])

  if (!isOpen || !clip) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm({ title, description, privacyStatus: privacy })
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      // Erro é tratado pelo pai
    } finally {
      setLoading(false)
    }
  }

  const thumb = clip.thumbnail_path?.startsWith("http") 
    ? clip.thumbnail_path 
    : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/uploads/${(clip.thumbnail_path || "").replace(/\\/g, "/")}`

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!loading ? onClose : undefined}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <Youtube className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Subir para o YouTube</h2>
                <p className="text-sm text-zinc-500">Revise as informações antes de publicar.</p>
              </div>
            </div>
            {!loading && (
              <button 
                onClick={onClose}
                className="rounded-full p-2 hover:bg-zinc-800 text-zinc-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="p-6">
            {success ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Enviado com Sucesso!</h3>
                  <p className="text-sm text-zinc-500">O vídeo está sendo processado pelo YouTube.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Preview Section */}
                <div className="space-y-4">
                  <div className="relative aspect-[9/16] w-full max-w-[200px] mx-auto rounded-xl overflow-hidden border border-zinc-800 bg-black shadow-lg">
                    <img src={thumb} alt="Preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                      <Youtube className="h-3 w-3 text-red-500" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Shorts</span>
                    </div>
                  </div>
                </div>

                {/* Form Section */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Título</label>
                      <span className={cn("text-[10px] font-medium", title.length > 90 ? "text-amber-500" : "text-zinc-600")}>
                        {title.length}/100
                      </span>
                    </div>
                    <Input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      maxLength={100}
                      placeholder="Título do vídeo"
                      className="bg-zinc-950 border-zinc-800 focus:ring-red-500 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Descrição</label>
                    <textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="Descrição do vídeo..."
                      rows={4}
                      className="w-full rounded-md bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-sans"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Visibilidade</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "public", icon: Globe, label: "Público" },
                        { id: "unlisted", icon: EyeOff, label: "Não Listado" },
                        { id: "private", icon: Lock, label: "Privado" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setPrivacy(opt.id)}
                          className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-lg border text-[10px] font-bold transition-all gap-1.5",
                            privacy === opt.id 
                              ? "bg-red-500/10 border-red-500 text-red-500" 
                              : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          )}
                        >
                          <opt.icon className="h-4 w-4" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!success && (
            <div className="border-t border-zinc-800 p-6 bg-zinc-900/50 space-y-3">
              {loading && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  <span className="text-[11px] text-amber-400/80 font-medium">
                    Gerando tags e descrição com IA...
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Tags SEO geradas automaticamente
                </span>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={onClose} 
                    disabled={loading}
                    className="text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleConfirm} 
                    className="bg-red-600 hover:bg-red-700 text-white min-w-[140px]"
                    disabled={loading || !title.trim()}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      "Confirmar"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
