import { useEffect, useRef, useCallback, useState } from "react"
import { io, Socket } from "socket.io-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface VideoEvent {
  videoId: string
  progress?: number
  stage?: string
  status?: string
  error?: string
  clip?: any
}

interface UseVideoSocketProps {
  videoId: string | null
  onProgress?: (data: VideoEvent) => void
  onStatus?: (data: { transcript_status?: string; analysis_status?: string }) => void
  onClipReady?: (clip: any) => void
  onClipExportProgress?: (data: { clipId: string; progress: number }) => void
  onError?: (error: string) => void
}

export function useVideoSocket({
  videoId,
  onProgress,
  onStatus,
  onClipReady,
  onClipExportProgress,
  onError
}: UseVideoSocketProps) {
  const socketRef = useRef<Socket | null>(null)
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  
  // Usar refs para os callbacks para evitar que o useEffect dependa deles
  // e cause reconexões infinitas quando callbacks inline são passados.
  const cbRef = useRef({ onProgress, onStatus, onClipReady, onClipExportProgress, onError })
  useEffect(() => {
    cbRef.current = { onProgress, onStatus, onClipReady, onClipExportProgress, onError }
  }, [onProgress, onStatus, onClipReady, onClipExportProgress, onError])

  const connect = useCallback(async () => {
    if (!videoId) return
    
    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    const socket = io(`${API_URL}/ws`, {
      path: "/ws",
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket
    setTimeout(() => setSocketInstance(socket), 0)

    socket.on("connect", () => {
      console.log("[Socket] Connected, joining room:", videoId)
      setConnected(true)
      socket.emit("subscribe:video", videoId)
    })

    socket.on("video:progress", (data: VideoEvent) => {
      if (data.videoId !== videoId) return
      cbRef.current.onProgress?.(data)
    })

    socket.on("video:status", (data: any) => {
      if (data.videoId !== videoId) return
      cbRef.current.onStatus?.(data)
    })

    socket.on("clip:ready", (data: { videoId: string; clip: any }) => {
      if (data.videoId !== videoId) return
      cbRef.current.onClipReady?.(data.clip)
    })

    socket.on("clip:export-progress", (data: { clipId: string; videoId: string; progress: number }) => {
      if (data.videoId !== videoId) return
      cbRef.current.onClipExportProgress?.({ clipId: data.clipId, progress: data.progress })
    })

    socket.on("video:error", (data: VideoEvent) => {
      if (data.videoId !== videoId) return
      cbRef.current.onError?.(data.error ?? "Erro desconhecido")
    })

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason)
      setConnected(false)
    })

    socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error)
    })

    return () => {
      socket.disconnect()
    }
  }, [videoId])

  useEffect(() => {
    connect()
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [connect])

  return {
    socket: socketInstance,
    connected
  }
}
