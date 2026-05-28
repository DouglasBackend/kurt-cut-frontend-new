"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Download, Trash2, Loader2, Sparkles,
  ExternalLink, Play, Pause,
  Volume2, VolumeX, Pencil, Plus,
  CheckCircle2, Clock, AlertCircle, Youtube, ArrowRight
} from "lucide-react"
import { clipsApi, videosApi, youtubeApi, Clip, Video as VideoType } from "@/lib/api"
import { useVideoSocket } from "@/hooks/useVideoSocket"
import { cn } from "@/lib/utils"
import { YoutubeUploadModal } from "@/components/modals/youtube-upload-modal"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"



// ─── InView hook ──────────────────────────────────────────────────────────────
function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

// ─── Player ───────────────────────────────────────────────────────────────────
function ClipPlayer({ src, score, thumbnail }: { src: string; score: number; thumbnail?: string }) {
  const { ref, inView } = useInView()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const handleClick = () => {
    if (!loaded) { setLoaded(true); return }
    const v = videoRef.current; if (!v) return
    playing ? v.pause() : v.play(); setPlaying(!playing)
  }
  const onCanPlay = () => {
    if (loaded && !playing) videoRef.current?.play().then(() => setPlaying(true)).catch(() => {})
  }
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current; if (!v) return
    v.muted = !muted; setMuted(!muted)
  }
  const onTimeUpdate = () => {
    const v = videoRef.current; if (!v || !v.duration) return
    setProgress((v.currentTime / v.duration) * 100)
  }

  return (
    <div
      ref={ref}
      className="relative aspect-[9/16] w-full bg-zinc-950 overflow-hidden group/player cursor-pointer select-none rounded-xl"
      onClick={handleClick}
    >
      <div className="absolute top-2 left-2 z-20">
        <span className="text-[10px] font-bold bg-black/70 backdrop-blur-sm text-amber-400 border border-amber-400/20 rounded-full px-2 py-0.5">
          🔥 {score}%
        </span>
      </div>

      {inView && (
        <>
          {loaded ? (
            <video
              ref={videoRef} src={src}
              className="h-full w-full object-cover"
              muted={muted} playsInline preload="metadata"
              onCanPlay={onCanPlay} onTimeUpdate={onTimeUpdate}
              onEnded={() => setPlaying(false)}
            />
          ) : (
            <div className="h-full w-full bg-zinc-900 flex items-center justify-center relative">
              {thumbnail && (
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover/player:scale-105" style={{ backgroundImage: `url(${thumbnail})` }} />
              )}
              <div className="absolute inset-0 bg-black/30 group-hover/player:bg-black/20 transition-colors" />
              <div className="h-11 w-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center relative z-10">
                <Play className="h-4 w-4 text-white fill-white ml-0.5" />
              </div>
            </div>
          )}

          <div className={cn("absolute inset-0 flex flex-col justify-between p-2.5 pointer-events-none transition-opacity", playing ? "opacity-0 group-hover/player:opacity-100" : "opacity-100")}>
            <div className="flex justify-end pointer-events-auto">
              {loaded && (
                <button onClick={toggleMute} className="h-7 w-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:text-white transition-all">
                  {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {!playing && (
                <div className="h-11 w-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  {loaded ? <Pause className="h-4 w-4 text-white fill-white" /> : <Play className="h-4 w-4 text-white fill-white ml-0.5" />}
                </div>
              )}
            </div>
            {loaded && (
              <div className="h-0.5 w-full bg-white/20 rounded-full mt-auto pointer-events-auto cursor-pointer" onClick={e => {
                e.stopPropagation()
                const v = videoRef.current; if (!v) return
                const r = e.currentTarget.getBoundingClientRect()
                v.currentTime = ((e.clientX - r.left) / r.width) * v.duration
              }}>
                <div className="h-full bg-white rounded-full transition-[width] duration-100" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Clip renderizando ────────────────────────────────────────────────────────
function ClipRendering() {
  return (
    <div className="relative aspect-[9/16] w-full bg-zinc-900 flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800/50">
      <div className="h-6 w-6 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
      <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Renderizando</span>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ video, onClick, onDelete, deleting }: {
  video: VideoType
  onClick: (id: string) => void
  onDelete: (id: string) => void
  deleting: boolean
}) {
  const isProcessing = 
    (video.transcript_status === "processing" || video.transcript_status === "pending") &&
    video.analysis_status !== "completed" && video.analysis_status !== "error"
  const isLoaded = !isProcessing
  const isReady = video.analysis_status === "completed"
  const thumb = video.thumbnail_path || video.youtube_thumbnail || (video.id ? `${API_URL}/uploads/${video.id}/thumbnail.jpg` : "/placeholder.png")
  
  const statusLabel = 
    video.transcript_status === "error" || video.analysis_status === "error" ? "Erro" :
    video.analysis_status === "completed" ? "Pronto" :
    video.analysis_status === "processing" ? "Analisando" :
    video.transcript_status === "processing" ? "Transcrevendo" :
    video.transcript_status === "pending" ? "Baixando" : "Pendente"

  const statusColor = 
    statusLabel === "Erro" ? "text-red-400 bg-red-400/10 border-red-400/20" :
    statusLabel === "Pronto" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
    "text-amber-400 bg-amber-400/10 border-amber-400/20"

  return (
    <div 
      className={cn(
        "group relative flex flex-col gap-3 p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/50 transition-all",
        isProcessing ? "cursor-not-allowed" : "cursor-pointer"
      )}
      onClick={() => isLoaded && onClick(video.id)}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={thumb} 
          alt={video.title} 
          className={cn(
            "h-full w-full object-cover transition-transform duration-500",
            isLoaded && "group-hover:scale-105"
          )} 
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
        
        <div className="absolute top-2 right-2">
          <div className={cn("px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-widest backdrop-blur-md", statusColor)}>
            {statusLabel}
          </div>
        </div>
      </div>

      <div className="px-1 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-zinc-100 truncate leading-none mb-1">
            {video.title}
          </h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
            {video.clips?.length || 0} clipes gerados
          </p>
        </div>
        
        <button
          disabled={deleting}
          onClick={(e) => { e.stopPropagation(); onDelete(video.id) }}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-40"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}

// ─── Card Clipes (Ajustado) ───────────────────────────────────────────────────
function ClipCard({ clip, onDelete, onEdit, onYoutubeUpload, deleting, uploading, progress }: {
  clip: Clip
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  onYoutubeUpload: (clip: Clip) => void
  deleting: boolean
  uploading: boolean
  progress?: number
}) {
  const isProcessing = clip.status === "processing" || clip.status === "pending"
  const isReady = clip.status === "completed" || clip.status === "done" || !!clip.file_path
  
  if (!isReady && !isProcessing) return null 
  
  let rawSrc = clip.file_path || clip.output_path || ""
  if (rawSrc) rawSrc = rawSrc.replace(/\\/g, "/")
  const src = !rawSrc ? "" : rawSrc.startsWith("http") ? rawSrc : `${API_URL}/${rawSrc.startsWith("uploads") ? "" : "uploads/"}${rawSrc}`
  
  let rawThumb = clip.thumbnail_path || ""
  if (rawThumb) rawThumb = rawThumb.replace(/\\/g, "/")
  const thumb = !rawThumb ? undefined : rawThumb.startsWith("http") ? rawThumb : `${API_URL}/${rawThumb.startsWith("uploads") ? "" : "uploads/"}${rawThumb}`

  const score = clip.viral_score || clip.score || 0

  return (
    <div className={cn("flex flex-col gap-2 transition-all", isProcessing && "opacity-80 pointer-events-none")}>
      <div className="relative overflow-hidden ring-1 ring-white/5 shadow-lg shadow-black/30 rounded-xl group/card">
        <ClipPlayer src={src} score={score} thumbnail={thumb} />
        
        {/* Overlay de Processamento */}
        {isProcessing && (
           <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
             <div className="relative h-12 w-12 mb-3">
               <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
                 <circle
                   cx="24" cy="24" r="21"
                   fill="none"
                   stroke="white/10"
                   strokeWidth="3"
                 />
                 <circle
                   cx="24" cy="24" r="21"
                   fill="none"
                   stroke="white"
                   strokeWidth="3"
                   strokeDasharray={`${2 * Math.PI * 21}`}
                   strokeDashoffset={`${2 * Math.PI * 21 * (1 - (progress || 5) / 100)}`}
                   strokeLinecap="round"
                   className="transition-all duration-500"
                 />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center">
                 <Loader2 className="h-5 w-5 text-white animate-spin opacity-40" />
               </div>
             </div>
             <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Processando</p>
             <p className="text-[14px] font-black text-white tabular-nums">{Math.round(progress || 0)}%</p>
           </div>
        )}
      </div>

      <div className="px-0.5">
        <p className="text-xs font-semibold text-zinc-100 leading-snug line-clamp-1">{clip.title}</p>
        {clip.duration && <p className="text-[10px] text-zinc-600 mt-0.5">{Math.round(clip.duration)}s</p>}
      </div>

      <div className="flex items-center justify-between px-0.5">
        <div className="flex gap-1">
          <button
            disabled={deleting || isProcessing}
            onClick={() => onDelete(clip.id)}
            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-20"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
            <button
              disabled={isProcessing}
              onClick={() => onEdit(clip.id)}
              className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-600 hover:text-zinc-200 hover:bg-white/5 transition-all disabled:opacity-20"
              title="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
                disabled={uploading || isProcessing}
                onClick={() => onYoutubeUpload(clip)}
                className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-20"
                title="Subir para o YouTube"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Youtube className="h-3.5 w-3.5" />}
              </button>
          </div>

        <div className="flex gap-1">
            <button
              disabled={isProcessing}
              onClick={() => window.open(src, "_blank")}
              className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-600 hover:text-zinc-200 hover:bg-white/5 transition-all disabled:opacity-20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            <button
              disabled={isProcessing}
              onClick={() => { const a = document.createElement("a"); a.href = src; a.download = `clip_${clip.id}.mp4`; a.click() }}
              className="h-7 px-3 flex items-center gap-1.5 rounded-md bg-white text-black text-[10px] font-bold hover:bg-zinc-200 transition-all disabled:opacity-20"
            >
              <Download className="h-3 w-3" /> Baixar
            </button>
          </div>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function ClipsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoId = searchParams.get("videoId")

  const [videos, setVideos] = useState<VideoType[]>([])
  const [clips, setClips] = useState<Clip[]>([])
  const [video, setVideo] = useState<VideoType | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState("")

  const [processing, setProcessing] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState("")
  const [clipProgress, setClipProgress] = useState<Record<string, number>>({})

  const [minimized, setMinimized] = useState(false)
  const lastFetchedVideoId = useRef<string | null>(undefined)

  const [isYtModalOpen, setIsYtModalOpen] = useState(false)
  const [selectedClipForYt, setSelectedClipForYt] = useState<Clip | null>(null)

  // ── Fetch inicial ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (lastFetchedVideoId.current === videoId) return
    setLoading(true); setError("")
    try {
      if (videoId) {
        const [v, c] = await Promise.all([videosApi.get(videoId), clipsApi.list(videoId)])
        setVideo(v); setClips(c)

        const ts = v.transcript_status; const as_ = v.analysis_status
        
        const isTsProcessing = ts === "processing" || ts === "pending"
        const isAsProcessing = as_ === "processing" || as_ === "pending"
        const isTsDone = ts === "completed" || ts === "error" || ts === "skipped" || ts === "failed"
        const isAsDone = as_ === "completed" || as_ === "error" || as_ === "skipped" || as_ === "failed"

        const stillProcessing =
          isTsProcessing ||
          isAsProcessing ||
          c.some(x => x.status === "processing" || x.status === "pending") ||
          (c.length === 0 && (!isTsDone || !isAsDone))

        if (c.length === 0 && (stillProcessing || ts === "error" || as_ === "error")) {
          router.push(`/clips/loading?videoId=${videoId}`)
          return
        }

        setProcessing(stillProcessing)
        setHasError(ts === "error" || as_ === "error")

        if (stillProcessing) {
          const st = await videosApi.jobStatus(videoId).catch(() => null)
          if (st?.progress) setProgress(st.progress)
          if (st?.message) setStatusMsg(st.message)
        }
      } else {
        const vList = await videosApi.list()
        setVideos(vList); setClips([]); setVideo(null); setProcessing(false)
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar.")
    } finally {
      setLoading(false)
      lastFetchedVideoId.current = videoId
    }
  }, [videoId, router])

  useEffect(() => { fetchData() }, [fetchData])

  // ── WebSocket para eventos em tempo real ──────────────────────────────────
  useVideoSocket({
    videoId,
    onProgress: ({ progress: p, stage }) => {
      setProgress(p ?? 0)
      setStatusMsg(stage ?? "")
      if (p && p >= 100) {
        setProcessing(false)
        if (minimized) setMinimized(false)
      }
    },
    onStatus: ({ transcript_status, analysis_status }) => {
      if (transcript_status === "error" || analysis_status === "error") {
        setHasError(true); setProcessing(false)
      }
    },
    onClipReady: async () => {
      if (!videoId) return
      try {
        const c = await clipsApi.list(videoId)
        setClips(c)
        const allDone = c.length > 0 && !c.some(x => x.status === "processing" || x.status === "pending")
        if (allDone) { setProcessing(false); setProgress(100) }
      } catch (_) {}
    },
    onClipExportProgress: ({ clipId, progress: p }) => {
      setClipProgress(prev => ({ ...prev, [clipId]: p }))
    },
    onError: (err) => { setHasError(true); setProcessing(false); setError(err) },
  })

  // ── Polling clips ainda renderizando ──────────────────────────────────────
  useEffect(() => {
    if (clips.length === 0) return
    const hasPending = clips.some(c => c.status === "processing" || c.status === "pending")
    if (!hasPending) return

    const id = setInterval(async () => {
      try {
        const c = videoId ? await clipsApi.list(videoId) : []
        if (c.length > 0) setClips(c)
        if (!c.some(x => x.status === "processing" || x.status === "pending")) clearInterval(id)
      } catch (_) {}
    }, 4000)
    return () => clearInterval(id)
  }, [clips, videoId])

  const handleDeleteClip = async (id: string) => {
    if (!confirm("Excluir este clipe?")) return
    setDeletingId(id)
    try {
      await clipsApi.delete(id)
      setClips(prev => prev.filter(c => c.id !== id))
    } catch (err: any) {
      setError(err.message || "Erro ao excluir.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Excluir este projeto e todos os seus clipes?")) return
    setDeletingId(id)
    try {
      await videosApi.delete(id)
      setVideos(prev => prev.filter(v => v.id !== id))
    } catch (err: any) {
      setError(err.message || "Erro ao excluir projeto.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (clipId: string) => {
    const clip = clips.find(c => c.id === clipId)
    const resolvedVideoId = videoId || clip?.video_id || null
    if (!resolvedVideoId) return
    router.push(`/editor?videoId=${resolvedVideoId}&clipId=${clipId}`)
  }
  
  const handleYoutubeUpload = async (clip: Clip) => {
    try {
      const status = await youtubeApi.status()
      if (!status || !status.id) {
        if (confirm("Você precisa conectar sua conta do YouTube primeiro. Deseja ir para as integrações?")) router.push("/integrations")
        return
      }
      setSelectedClipForYt(clip)
      setIsYtModalOpen(true)
    } catch (err: any) {
      alert(err.message || "Erro ao verificar status do YouTube.")
    }
  }

  const onConfirmYoutubeUpload = async (data: { title: string; description: string; privacyStatus: string }) => {
    if (!selectedClipForYt) return
    setUploading(selectedClipForYt.id)
    try {
      let filePath = selectedClipForYt.file_path || selectedClipForYt.output_path || ""
      if (filePath.startsWith("http")) {
        const parts = filePath.split("uploads/")
        filePath = parts.length > 1 ? parts.pop() || "" : filePath
      }
      await youtubeApi.upload({
        filePath,
        title: data.title,
        description: data.description,
        privacyStatus: data.privacyStatus as any,
        clipId: selectedClipForYt.id,
      })
    } catch (err: any) {
      alert(err.message || "Erro ao subir para o YouTube.")
      throw err
    } finally {
      setUploading(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
      <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
    </div>
  )



  const readyClips = clips.filter(c => c.status === "completed" || c.status === "done" || c.status === "error" || c.status === "processing" || c.status === "pending" || !!c.file_path)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-1">
            {videoId ? "Projeto" : "Biblioteca"}
          </p>
          <div className="flex items-center gap-3">
             {videoId && (
               <button onClick={() => router.push("/clips")} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-zinc-400 transition-colors">
                  <ArrowRight className="h-4 w-4 rotate-180" />
               </button>
             )}
            <h1 className="text-2xl font-bold text-zinc-100 leading-none">
              {videoId ? (video?.title || "Carregando...") : "Meus Projetos"}
            </h1>
          </div>
          
          {videoId && readyClips.length > 0 && (
            <div className="flex items-center gap-3 mt-2 ml-11">
              <span className="text-xs text-zinc-500">{readyClips.length} clipe{readyClips.length !== 1 ? "s" : ""} pronto{readyClips.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {videoId && (
            <button
              onClick={() => router.push(`/editor?videoId=${videoId}`)}
              className="h-9 px-4 flex items-center gap-1.5 rounded-lg border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-all"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar tudo
            </button>
          )}
          <button
            onClick={() => router.push("/upload")}
            className="h-9 px-4 flex items-center gap-1.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Novo Projeto
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* View de PROJETOS */}
      {!videoId && (
        videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 gap-5 text-center">
            <div className="h-14 w-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-zinc-600" />
            </div>
            <div className="space-y-1 max-w-xs">
              <p className="font-semibold text-zinc-200 text-sm">Nenhum projeto ainda</p>
              <p className="text-xs text-zinc-500">Importe seu primeiro vídeo para começar.</p>
            </div>
            <button
              onClick={() => router.push("/upload")}
              className="h-9 px-5 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all"
            >
              Criar Projeto
            </button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map(v => (
              <ProjectCard
                key={v.id}
                video={v}
                onClick={(id) => router.push(`/clips?videoId=${id}`)}
                onDelete={handleDeleteVideo}
                deleting={deletingId === v.id}
              />
            ))}
          </div>
        )
      )}

      {/* View de CLIPES (dentro de um projeto) */}
      {videoId && (
        readyClips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 gap-5 text-center">
             {processing ? (
                <>
                   <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
                   <p className="text-sm text-zinc-500">Estamos preparando seus clipes...</p>
                </>
             ) : (
                <>
                  <AlertCircle className="h-8 w-8 text-zinc-600" />
                  <p className="text-sm text-zinc-500">Nenhum clipe encontrado para este projeto.</p>
                </>
             )}
          </div>
        ) : (
          <div className="grid gap-x-4 gap-y-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {readyClips.map(clip => (
              <ClipCard
                key={clip.id}
                clip={clip}
                onDelete={handleDeleteClip}
                onEdit={handleEdit}
                onYoutubeUpload={handleYoutubeUpload}
                deleting={deletingId === clip.id}
                uploading={uploading === clip.id}
                progress={clipProgress[clip.id]}
              />
            ))}
          </div>
        )
      )}
      <YoutubeUploadModal 
        isOpen={isYtModalOpen}
        onClose={() => setIsYtModalOpen(false)}
        clip={selectedClipForYt}
        onConfirm={onConfirmYoutubeUpload}
      />
    </div>
  )
}
