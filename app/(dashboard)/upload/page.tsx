/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  UploadCloud, Link as LinkIcon, Loader2, Sparkles,
  Check, Film, Monitor, Clock, Eye, ThumbsUp,
  X, ArrowRight, Scissors, Zap, Shield, User,
  ChevronLeft, ChevronRight, Square, SlidersHorizontal, Wand2, Ban
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useRouter } from "next/navigation"
import { projectsApi, videosApi, Project } from "@/lib/api"
import { Slider } from "@/components/ui/slider"
import { useAuth } from "@/contexts/auth-context"
import { SUBTITLE_PRESETS, PRESET_STYLE_MAP, SubtitleCard } from "@/components/SubtitlePresets"
import { CreditsModal } from "@/components/modals/credits-modal"
import { cn } from "@/lib/utils"
import { PLANS } from "@/lib/billing.constants"

interface ClipPreferences {
  aspect_ratio: "9:16" | "16:9"
  subtitle_preset: string
  generate_subtitles: boolean
  burn_subtitles: boolean
  face_tracking: boolean
  layout: 'auto' | 'face_tracking' | 'centered' | 'split' | 'react' | 'none'
  analysis_start?: number
  analysis_end?: number
  target_duration?: number
}

const DEFAULT_PREFS: ClipPreferences = {
  aspect_ratio: "9:16",
  subtitle_preset: "highlight",
  generate_subtitles: true,
  burn_subtitles: true,
  face_tracking: true,
  layout: 'auto',
  analysis_start: 0,
  analysis_end: 0,
  target_duration: 60,
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function UploadPage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const planoKey = (user?.plano || 'free').toUpperCase()
  const limits = (PLANS as any)[planoKey] || PLANS.FREE

  const [step, setStep] = useState<"input" | "options">("input")
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false)
  const [tab, setTab] = useState<"link" | "file">("link")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [youtubeMetadata, setYoutubeMetadata] = useState<any>(null)
  const [loadingMetadata, setLoadingMetadata] = useState(false)
  const [metadataError, setMetadataError] = useState("")

  const [prefs, setPrefs] = useState<ClipPreferences>(DEFAULT_PREFS)
  const [duration, setDuration] = useState(0)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const carouselRef = useRef<HTMLDivElement>(null)

  const fetchMetadata = useCallback(async (url: string) => {
    if (!url.trim()) return
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) { setMetadataError("Link do YouTube inválido."); return }
    setLoadingMetadata(true); setMetadataError(""); setYoutubeMetadata(null)
    try {
      const meta = await videosApi.getYoutubeMetadata(url)
      
      if (meta.duration > limits.max_source_duration) {
        const maxMin = Math.round(limits.max_source_duration / 60)
        setMetadataError(`O vídeo é muito longo para seu plano atual. Limite: ${maxMin} minutos.`)
        setLoadingMetadata(false)
        return
      }

      setYoutubeMetadata(meta);
      setStep("options")
      if (meta.duration) {
        setDuration(meta.duration)
        setPrefs(p => ({ ...p, analysis_end: meta.duration }))
      }
    } catch { setMetadataError("Não foi possível obter informações do vídeo.") }
    finally { setLoadingMetadata(false) }
  }, [limits.max_source_duration])

  // Randomize initial subtitle preset
  useEffect(() => {
    const randomPreset = SUBTITLE_PRESETS[Math.floor(Math.random() * SUBTITLE_PRESETS.length)];
    if (randomPreset) {
      setPrefs(p => ({ ...p, subtitle_preset: randomPreset.id }));
    }
  }, []);

  // Auto-fetch metadata when YouTube URL is pasted
  useEffect(() => {
    const isYouTube = youtubeUrl.includes("youtube.com") || youtubeUrl.includes("youtu.be");
    const id = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/)?.[1];
    
    if (isYouTube && id && !loadingMetadata && !youtubeMetadata && !metadataError) {
      fetchMetadata(youtubeUrl);
    }
  }, [youtubeUrl, fetchMetadata, loadingMetadata, youtubeMetadata, metadataError]);

  useEffect(() => {
    projectsApi.list().then(list => {
      setProjects(list)
      if (list.length > 0) setSelectedProject(list[0].id)
    }).catch(() => { })
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") fetchMetadata(youtubeUrl) }
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size / (1024 * 1024) > limits.max_upload_size_mb) {
        setError(`O arquivo excede o limite do seu plano (${limits.max_upload_size_mb}MB).`)
        return
      }

      setSelectedFile(f);
      setStep("options");
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > limits.max_source_duration) {
          const maxMin = Math.round(limits.max_source_duration / 60)
          setError(`O vídeo é muito longo para seu plano atual. Limite: ${maxMin} minutos.`)
          resetInput()
          return
        }
        setDuration(video.duration);
        setPrefs(p => ({ ...p, analysis_end: Math.floor(video.duration) }));
      };
      video.src = URL.createObjectURL(f);
    }
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      setSelectedFile(f);
      setStep("options");
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        setDuration(video.duration);
        setPrefs(p => ({ ...p, analysis_end: Math.floor(video.duration) }));
      };
      video.src = URL.createObjectURL(f);
    }
  }
  const setP = <K extends keyof ClipPreferences>(k: K, v: ClipPreferences[K]) => setPrefs(p => ({ ...p, [k]: v }))

  const ensureProject = async () => {
    if (selectedProject) return selectedProject
    const p = await projectsApi.create({ title: "Meu Projeto" })
    setProjects(prev => [...prev, p]); setSelectedProject(p.id); return p.id
  }

  const handleGenerate = async () => {
    if ((user?.creditos_disponiveis || 0) < 1) {
      setIsCreditsModalOpen(true)
      return
    }

    setSubmitting(true); setError("")
    try {
      const projectId = await ensureProject()

      const presetCfg = PRESET_STYLE_MAP[prefs.subtitle_preset] || PRESET_STYLE_MAP["highlight"]

      const opts = {
        aspect_ratio: prefs.aspect_ratio,
        generate_subtitles: prefs.generate_subtitles,
        burn_subtitles: false,
        face_tracking: prefs.layout === 'face_tracking',
        layout: prefs.layout,
        analysis_start: prefs.analysis_start || 0,
        analysis_end: prefs.analysis_end || 0,
        target_duration: prefs.target_duration || 60,
        subtitle_style: {
          preset: prefs.subtitle_preset,
          ...presetCfg,
        },
      }
      let v: any
      if (tab === "file" && selectedFile) {
        v = await videosApi.upload(projectId, selectedFile); await videosApi.startProcessing(v.id, opts)
      } else {
        v = await videosApi.importYoutube(projectId, youtubeUrl, opts)
      }
      
      // Atualiza os créditos no frontend após iniciar o processamento
      await refreshUser().catch(() => {})
      
      router.push(`/clips/loading?videoId=${v.id}`)
    } catch (err: any) {
      if (err.message?.includes("Créditos insuficientes")) {
        setIsCreditsModalOpen(true)
      } else {
        setError(err.message || "Erro ao processar o vídeo.")
      }
      setSubmitting(false)
    }
  }

  const canGenerate = !submitting && (tab === "file" ? !!selectedFile : !!youtubeMetadata)
  const resetInput = () => { setYoutubeMetadata(null); setYoutubeUrl(""); setSelectedFile(null); setStep("input"); setMetadataError("") }

  const fmtDuration = (sec: number) => {
    if (!sec) return null
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    return `${m}:${String(s).padStart(2, "0")}`
  }
  const fmtNumber = (n: number) => {
    if (!n) return "0"
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return n.toLocaleString("pt-BR")
  }

  const scrollCarousel = (dir: "left" | "right") => {
    if (!carouselRef.current) return
    carouselRef.current.scrollBy({ left: dir === "left" ? -440 : 440, behavior: "smooth" })
  }

  return (
    <>
      <div className="min-h-screen bg-zinc-950 flex flex-col" style={{ fontFamily: "system-ui, sans-serif" }}>
        {/* ── Top Bar ── */}
        <header className="h-12 border-b border-zinc-800/50 flex items-center px-5 shrink-0 gap-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
              <Scissors className="h-3 w-3 text-black" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-white tracking-tight">Kurt Cut</span>
          </div>
          <div className="h-3.5 w-px bg-zinc-800" />
          <span className="text-xs text-zinc-600">Novo Projeto</span>
          <div className="ml-auto flex items-center gap-1.5">
            {["Importar", "Configurar", "Legenda"].map((s, i) => {
              const done = (i === 0 && step === "options") || i === 2
              const active = (i === 0 && step === "input") || (i >= 1 && step === "options")
              return (
                <div key={s} className="flex items-center gap-1.5">
                  {i > 0 && <div className={`h-px w-3 ${active || done ? "bg-zinc-600" : "bg-zinc-800"}`} />}
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${active ? "bg-zinc-800 text-zinc-200" : done ? "text-zinc-600" : "text-zinc-700"}`}>
                    <span className={`h-1 w-1 rounded-full ${active ? "bg-white" : done ? "bg-zinc-600" : "bg-zinc-700"}`} />
                    <span className="hidden sm:inline">{s}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </header>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full max-w-4xl mx-auto px-5 sm:px-10 py-7 space-y-8">
            {/* ══ 01 · Importar ══ */}
            <section>
              <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-600 font-semibold mb-3">01 · Importar vídeo</p>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                <div className="flex border-b border-zinc-800/70">
                  {([["link", LinkIcon, "YouTube / Link"] as const, ["file", UploadCloud, "Arquivo local"] as const]).map(([id, Icon, label]) => (
                    <button key={id} onClick={() => { setTab(id); resetInput() }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-all ${tab === id ? "text-white border-b-2 border-white -mb-px" : "text-zinc-500 hover:text-zinc-300"}`}>
                      <Icon className="h-3.5 w-3.5" />{label}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  {tab === "link" ? (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input type="url" placeholder="https://youtube.com/watch?v=..."
                          value={youtubeUrl}
                          onChange={e => { 
                            setYoutubeUrl(e.target.value); 
                            setMetadataError(""); // Limpa erro ao digitar
                            if (youtubeMetadata) { setYoutubeMetadata(null); setStep("input") } 
                          }}
                          onKeyDown={handleKeyDown} disabled={loadingMetadata || submitting}
                          className="flex-1 h-11 rounded-xl bg-zinc-800/80 border border-zinc-700/60 px-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50" />
                        <button onClick={() => fetchMetadata(youtubeUrl)}
                          disabled={!youtubeUrl.trim() || loadingMetadata || submitting}
                          className="h-11 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 transition-all flex items-center gap-2 border border-zinc-700/60 text-xs font-semibold shrink-0">
                          {loadingMetadata ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-3.5 w-3.5" />Buscar</>}
                        </button>
                      </div>

                      {metadataError && <p className="text-xs text-red-400">{metadataError}</p>}
                      {!youtubeMetadata && !metadataError && (
                        <p className="text-xs text-zinc-700">{loadingMetadata ? "Buscando informações..." : "Cole o link e pressione Enter ou clique em Buscar"}</p>
                      )}

                      <AnimatePresence>
                        {youtubeMetadata && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden"
                          >
                            <div className="relative w-full" style={{ aspectRatio: "16/6" }}>
                              <img src={youtubeMetadata.thumbnail} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent" />
                              {youtubeMetadata.duration > 0 && (
                                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/80 rounded-lg px-3 py-1.5 backdrop-blur-sm border border-white/10">
                                  <Clock className="h-3.5 w-3.5 text-zinc-300" />
                                  <span className="text-sm font-bold text-white tabular-nums">{fmtDuration(youtubeMetadata.duration)}</span>
                                </div>
                              )}
                              <button onClick={resetInput}
                                className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-full bg-black/60 text-zinc-400 hover:text-white hover:bg-black/80 transition-colors">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="px-5 py-5 space-y-4">
                              <p className="text-lg font-bold text-zinc-100 leading-snug">{youtubeMetadata.title}</p>
                              {youtubeMetadata.channel && (
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                                    <User className="h-3.5 w-3.5 text-zinc-400" />
                                  </div>
                                  <span className="text-sm font-medium text-zinc-300">{youtubeMetadata.channel}</span>
                                </div>
                              )}
                              <div className="flex items-stretch gap-5 pt-1">
                                {youtubeMetadata.views > 0 && (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-2xl font-black text-white tabular-nums leading-none">{fmtNumber(youtubeMetadata.views)}</span>
                                    <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5"><Eye className="h-3 w-3" /> visualizações</span>
                                  </div>
                                )}
                                {youtubeMetadata.views > 0 && youtubeMetadata.likes > 0 && <div className="w-px bg-zinc-800 self-stretch" />}
                                {youtubeMetadata.likes > 0 && (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-2xl font-black text-white tabular-nums leading-none">{fmtNumber(youtubeMetadata.likes)}</span>
                                    <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5"><ThumbsUp className="h-3 w-3" /> curtidas</span>
                                  </div>
                                )}
                                {youtubeMetadata.duration > 0 && (youtubeMetadata.views > 0 || youtubeMetadata.likes > 0) && <div className="w-px bg-zinc-800 self-stretch" />}
                                {youtubeMetadata.duration > 0 && (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-2xl font-black text-white tabular-nums leading-none">{fmtDuration(youtubeMetadata.duration)}</span>
                                    <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> duração</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div
                      className={`rounded-xl border border-dashed transition-all cursor-pointer ${isDragging ? "border-white/30 bg-white/5" : selectedFile ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-700/60 hover:border-zinc-600"}`}
                      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => !selectedFile && fileInputRef.current?.click()}
                    >
                      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                      {selectedFile ? (
                        <div className="flex items-center gap-3 px-5 py-5">
                          <div className="h-11 w-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <Film className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-100 truncate">{selectedFile.name}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                          </div>
                          <button type="button" onClick={e => { e.stopPropagation(); resetInput() }} className="text-xs text-zinc-600 hover:text-zinc-300 px-2 shrink-0">Trocar</button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-14 gap-3">
                          <UploadCloud className="h-8 w-8 text-zinc-600" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-zinc-400">Arraste ou clique para selecionar</p>
                            <p className="text-xs text-zinc-700 mt-1">MP4, MOV, AVI · máx {limits.max_upload_size_mb} MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ══ 02 · Configurar ══ */}
            <AnimatePresence>
              {step === "options" && (
                <motion.section
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-600 font-semibold mb-3">02 · Configurar</p>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold mb-4 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Duração dos cortes
                      </p>
                      <div className="flex gap-2">
                        {([
                          { value: 30, label: "30s", sub: "Rápido" },
                          { value: 60, label: "60s", sub: "Padrão" },
                          { value: 180, label: "3min", sub: "Longo" },
                        ]).map(opt => (
                          <button key={opt.value} onClick={() => setP("target_duration", opt.value)}
                            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all ${prefs.target_duration === opt.value ? "border-zinc-500 bg-zinc-800/60 text-white" : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"}`}>
                            <p className="text-sm font-bold leading-none">{opt.label}</p>
                            <p className="text-[9px] text-zinc-600 mt-1">{opt.sub}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-2xl">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-5 flex items-center gap-2">
                        <Monitor className="h-3.5 w-3.5 text-zinc-400" /> Enquadramento
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { id: 'auto', name: 'Automático', desc: 'IA decide o melhor enquadramento', icon: Sparkles, color: 'from-purple-500/20 to-indigo-500/20' },
                          { id: 'face_tracking', name: 'Foco no rosto', desc: 'Mantém o orador centralizado', icon: User, color: 'from-blue-500/20 to-cyan-500/20' },
                          { id: 'kurtcut', name: 'Modo KurtCut', desc: 'Thumb (topo) + Banner + Vídeo', icon: Zap, color: 'from-yellow-500/20 to-orange-500/20' },
                          { id: 'centered', name: 'Centro', desc: 'Enquadramento central fixo', icon: Square, color: 'from-emerald-500/20 to-teal-500/20' },
                          { id: 'split', name: 'Tela Dividida', desc: 'Rosto (topo) + Cena (baixo)', icon: SlidersHorizontal, color: 'from-orange-500/20 to-amber-500/20' },
                          { id: 'react', name: 'React', desc: 'Vídeo em destaque + Overlay', icon: Wand2, color: 'from-pink-500/20 to-rose-500/20' },
                          { id: 'none', name: 'Desativado', desc: 'Sem enquadramento especial', icon: Ban, color: 'from-zinc-500/20 to-zinc-600/20' },
                        ].map((l) => (
                          <button
                            key={l.id}
                            onClick={() => setP('layout', l.id as any)}
                            className={cn(
                              "relative group overflow-hidden flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-95",
                              prefs.layout === l.id 
                                ? "bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                                : "bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:border-zinc-500"
                            )}
                          >
                            <div className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                              prefs.layout === l.id ? "bg-black/5" : "bg-zinc-800"
                            )}>
                              <l.icon className={cn("h-5 w-5", prefs.layout === l.id ? "text-black" : "text-zinc-500")} />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-xs font-black tracking-tight flex items-center gap-1.5">
                                {l.name}
                                {l.id === 'auto' && (
                                  <span className="text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded text-zinc-500">Recomendado</span>
                                )}
                              </span>
                              <span className="text-[10px] font-bold opacity-60 leading-tight mt-0.5">{l.desc}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold mb-4 flex items-center gap-1.5">
                        <Monitor className="h-3 w-3" /> Proporção da tela
                      </p>
                      <div className="flex gap-3">
                        {([
                          { value: "9:16" as const, label: "9:16", sub: "TikTok · Reels · Shorts", icon: <div className="w-3.5 h-6 border-2 border-current rounded-[3px]" /> },
                          { value: "16:9" as const, label: "16:9", sub: "YouTube · Web · Desktop", icon: <div className="w-7 h-4 border-2 border-current rounded-[3px]" /> },
                        ]).map(opt => (
                          <button key={opt.value} onClick={() => setP("aspect_ratio", opt.value)}
                            className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${prefs.aspect_ratio === opt.value ? "border-zinc-500 bg-zinc-800/60 text-white" : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"}`}>
                            {opt.icon}
                            <div>
                              <p className="text-sm font-bold leading-none">{opt.label}</p>
                              <p className="text-[10px] text-zinc-600 mt-1">{opt.sub}</p>
                            </div>
                            {prefs.aspect_ratio === opt.value && <Check className="h-3.5 w-3.5 ml-auto text-zinc-400 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-2.5">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold mb-4">Legendas &amp; Opções</p>
                      {[
                        {
                          label: "Gerar Legendas com IA (Apenas Preview)", active: prefs.generate_subtitles, disabled: false,
                          onClick: () => { const v = !prefs.generate_subtitles; setPrefs(p => ({ ...p, generate_subtitles: v })) }
                        },
                      ].map(item => (
                        <button key={item.label} onClick={item.onClick} disabled={item.disabled}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all w-full ${item.disabled ? "opacity-40 cursor-not-allowed border-zinc-800 text-zinc-700" : item.active ? "border-zinc-600/50 bg-zinc-800/50 text-zinc-200" : "border-zinc-800 text-zinc-600 hover:border-zinc-700"}`}>
                          <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 ${item.active && !item.disabled ? "bg-white" : "bg-zinc-800 border border-zinc-700"}`}>
                            {item.active && !item.disabled && <Check className="h-2.5 w-2.5 text-black" strokeWidth={3} />}
                          </div>
                          {item.label}
                        </button>
                      ))}
                      <div className="pt-4 pb-2">
                        <div className="flex justify-between items-end mb-4">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Trecho de análise</p>
                          <div className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700">
                            <span className="text-[11px] font-bold text-white tabular-nums">
                              {fmtDuration(prefs.analysis_start || 0)} — {fmtDuration(prefs.analysis_end || duration)}
                            </span>
                          </div>
                        </div>
                        <Slider
                          value={[prefs.analysis_start || 0, prefs.analysis_end || duration || 100]}
                          min={0}
                          max={duration || 100}
                          step={1}
                          onValueChange={([start, end]) => {
                            setPrefs(p => ({ ...p, analysis_start: start, analysis_end: end }))
                          }}
                          className="my-6"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-600 pt-0.5">* O intervalo selecionado será usado para detectar as melhores partes.</p>
                    </div>

                    {projects.length > 1 && (
                      <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                        className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-300 focus:outline-none">
                        {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                    )}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* ══ 03 · Estilo da Legenda ══ */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-600 font-semibold">03 · Estilo da Legenda</p>
                {step === "options" && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-700/50 bg-zinc-900/60">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {SUBTITLE_PRESETS.find(p => p.id === prefs.subtitle_preset)?.label}
                    </span>
                  </motion.div>
                )}
              </div>

              {step === "input" ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-center gap-3 py-12">
                  <div className="h-10 w-10 rounded-2xl border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                    <LinkIcon className="h-5 w-5 text-zinc-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-zinc-400">Importe um vídeo primeiro</p>
                    <p className="text-xs text-zinc-700 mt-1">Os estilos ficarão disponíveis em seguida</p>
                  </div>
                </div>
              ) : (
                <div className="relative group/carousel">
                  <div 
                    ref={carouselRef}
                    className="grid grid-rows-3 grid-flow-col gap-2 overflow-x-auto pb-4 scrollbar-none snap-x select-none pr-32"
                  >
                    {SUBTITLE_PRESETS.map((preset, idx) => (
                      <motion.div
                        key={preset.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.01, duration: 0.15 }}
                        className="w-[180px] snap-start"
                      >
                        <SubtitleCard
                          preset={preset}
                          selected={prefs.subtitle_preset === preset.id}
                          onSelect={() => setP("subtitle_preset", preset.id)}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={() => scrollCarousel("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-10 w-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-black/80 hover:scale-110 z-20 backdrop-blur-sm shadow-xl"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => scrollCarousel("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-10 w-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-black/80 hover:scale-110 z-20 backdrop-blur-sm shadow-xl"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Gradiente de fade no final do carrossel */}
                  <div className="absolute top-0 right-0 bottom-4 w-32 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none z-10" />
                </div>
              )}
            </section>

            {/* CTA */}
            <div className="space-y-3 pt-2 pb-10">
              {error && (
                <div className="rounded-xl bg-red-500/8 border border-red-500/15 px-4 py-3 text-sm text-red-400">{error}</div>
              )}
              <button
                disabled={!canGenerate}
                onClick={handleGenerate}
                style={{ height: 52 }}
                className={`w-full rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${canGenerate ? "bg-white text-black hover:bg-zinc-100 active:scale-[0.99]" : "bg-zinc-800/50 text-zinc-700 cursor-not-allowed"}`}
              >
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Iniciando...</>
                  : <><Sparkles className="h-4 w-4" />Gerar Clipes</>
                }
              </button>
              <div className="flex gap-2">
                {[{ icon: Zap, t: "Geração com IA" }, { icon: Scissors, t: "Cortes Precisos" }, { icon: Shield, t: "100% Seguro" }].map(({ icon: Icon, t }) => (
                  <div key={t} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
                    <Icon className="h-3 w-3 text-zinc-600" />
                    <span className="text-[10px] text-zinc-600 font-medium">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreditsModal 
        isOpen={isCreditsModalOpen} 
        onClose={() => setIsCreditsModalOpen(false)} 
      />
    </>
  )
}
