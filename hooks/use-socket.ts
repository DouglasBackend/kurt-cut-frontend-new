"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export function useSocket(videoId?: string) {
  const socketRef = useRef<Socket | null>(null)
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<{ event: string; data: any } | null>(null)
  const [progress, setProgress] = useState<{ progress: number; stage: string } | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const socket = io(`${API_URL}/ws`, {
      path: "/ws",
      transports: ["websocket"],
      reconnectionAttempts: 5,
    })

    socketRef.current = socket
    setTimeout(() => setSocketInstance(socket), 0)

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id)
      setIsConnected(true)
      if (videoId) {
        socket.emit("subscribe:video", videoId)
      }
    })

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected")
      setIsConnected(false)
    })

    socket.on("video:progress", (data) => {
      console.log("[Socket] Progress:", data)
      if (data.videoId === videoId) {
        setProgress({ progress: data.progress, stage: data.stage })
      }
    })

    socket.on("video:status", (data) => {
      console.log("[Socket] Status:", data)
      if (data.videoId === videoId) {
        setStatus(data)
      }
    })

    socket.on("video:error", (data) => {
      console.error("[Socket] Error:", data)
      if (data.videoId === videoId) {
        setError(data.error)
      }
    })

    socket.on("clip:ready", (data) => {
      console.log("[Socket] Clip Ready:", data)
      setLastEvent({ event: "clip:ready", data })
    })

    return () => {
      if (videoId) {
        socket.emit("unsubscribe:video", videoId)
      }
      socket.disconnect()
    }
  }, [videoId])

  const subscribeToVideo = useCallback((id: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("subscribe:video", id)
    }
  }, [isConnected])

  return {
    socket: socketInstance,
    isConnected,
    progress,
    status,
    error,
    lastEvent,
    subscribeToVideo,
  }
}
