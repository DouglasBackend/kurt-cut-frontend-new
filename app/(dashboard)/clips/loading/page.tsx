"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { videosApi } from "@/lib/api"

export default function LoadingClipsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const videoId = searchParams.get("videoId")

  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState("")
  const redirectedRef = useRef(false)

  // Polling-based approach: check job status every 3 seconds
  // This avoids the infinite loop caused by the WebSocket hook's object references
  useEffect(() => {
    if (!videoId) {
      // No videoId: fake progress then redirect to clips
      const timer = setInterval(() => {
        setProgress((old) => {
          if (old >= 100) {
            clearInterval(timer)
            if (!redirectedRef.current) {
              redirectedRef.current = true
              setTimeout(() => router.push("/clips"), 500)
            }
            return 100
          }
          return Math.min(old + Math.random() * 10, 100)
        })
      }, 500)
      return () => clearInterval(timer)
    }

    // Poll job status from the backend
    const poll = async () => {
      try {
        const st = await videosApi.jobStatus(videoId)
        
        if (typeof st.progress === "number") {
          setProgress(st.progress)
        }
        if (st.message) {
          setStatusMsg(st.message)
        }

        // Redirect on error
        if (st.status === "failed") {
          if (!redirectedRef.current) {
            redirectedRef.current = true
            router.push(`/upload?error=${encodeURIComponent(st.message || "Erro no processamento")}`)
          }
          return true // stop polling
        }

        // Redirect on completion
        if (st.status === "completed" || (typeof st.progress === "number" && st.progress >= 100)) {
          setProgress(100)
          setStatusMsg("Concluído! Redirecionando para o editor...")
          if (!redirectedRef.current) {
            redirectedRef.current = true
            setTimeout(() => router.push(`/clips?videoId=${videoId}`), 800)
          }
          return true // stop polling
        }

        return false // continue polling
      } catch {
        // On error, keep polling
        return false
      }
    }

    // Initial poll
    poll()
    
    // Set up interval
    const id = setInterval(async () => {
      const done = await poll()
      if (done) clearInterval(id)
    }, 3000)

    return () => clearInterval(id)
  }, [videoId, router])

  const steps = [
    { id: "import", title: "Importação", range: [0, 25], icon: "⬇️" },
    { id: "transcribe", title: "Transcrição", range: [26, 55], icon: "🎙️" },
    { id: "analyze", title: "Análise de IA", range: [56, 85], icon: "🧠" },
    { id: "finalize", title: "Finalização", range: [86, 100], icon: "✨" },
  ]

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-all duration-1000" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-all duration-1000" />

        <div className="relative z-10 flex flex-col items-center space-y-10">
          {/* Header */}
          <div className="text-center space-y-3">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Processamento Ativo</span>
             </div>
             <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
               Criando a <span className="text-primary italic">mágica</span>...
             </h1>
             <p className="text-zinc-400 text-sm md:text-base max-w-md mx-auto">
               Nossa IA está Analisando seu vídeo para encontrar os melhores Clipes.
             </p>
          </div>

          {/* Stepper */}
          <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((step, idx) => {
              const isActive = progress >= step.range[0] && progress <= step.range[1]
              const isCompleted = progress > step.range[1]
              
              return (
                <div key={step.id} className="relative flex flex-col items-center text-center space-y-3 group/step">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 border-2",
                    isCompleted ? "bg-primary border-primary text-white scale-90" : 
                    isActive ? "bg-zinc-800 border-primary shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)] scale-110" : 
                    "bg-zinc-900 border-white/5 text-zinc-600"
                  )}>
                    {isCompleted ? (
                      <svg className="h-6 w-6 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={cn("transition-all", isActive ? "grayscale-0 animate-bounce" : "grayscale opacity-40")}>{step.icon}</span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors",
                      isActive ? "text-primary" : isCompleted ? "text-zinc-400" : "text-zinc-600"
                    )}>
                      Passo {idx + 1}
                    </p>
                    <p className={cn(
                      "text-xs font-bold transition-colors",
                      isActive || isCompleted ? "text-white" : "text-zinc-600"
                    )}>
                      {step.title}
                    </p>
                  </div>

                  {/* Connector lines (Desktop) */}
                  {idx < steps.length - 1 && (
                    <div className="hidden md:block absolute top-7 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-[2px] bg-zinc-800">
                       <div 
                         className="h-full bg-primary transition-all duration-[2000ms]" 
                         style={{ width: isCompleted ? "100%" : isActive ? "50%" : "0%" }}
                       />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Subtitle / Detailed Status */}
          <div className="w-full space-y-4 pt-4 border-t border-white/5">
             <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status Atual</p>
                  <p className="text-sm font-bold text-white animate-pulse">
                    {statusMsg || "Processando vídeo..."}
                  </p>
                </div>
                <div className="text-right">
                   <p className="text-2xl font-black text-white tabular-nums leading-none">{Math.round(progress)}%</p>
                </div>
             </div>
             
             {/* Progress Bar background */}
             <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-700 ease-out" 
                  style={{ width: `${progress}%` }}
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
