"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "./auth-context"
import { io, Socket } from "socket.io-client"

const WS_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export interface Task {
  id: string
  videoId: string
  title: string
  progress: number
  status: string
  isCompleted: boolean
  hasError: boolean
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "error"
  timestamp: Date
  read: boolean
  link?: string
}

interface NotificationContextType {
  tasks: Task[]
  notifications: Notification[]
  addTask: (videoId: string, title: string) => void
  removeTask: (taskId: string) => void
  clearNotifications: () => void
  markAsRead: (id: string) => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const socketRef = useRef<Socket | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        setToken(localStorage.getItem("token"))
      }, 0)
    }
  }, [])

  const removeTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }, [])

  const addTask = useCallback((videoId: string, title: string) => {
    const taskId = Math.random().toString(36).substr(2, 9)
    setTasks(prev => [
      ...prev,
      {
        id: taskId,
        videoId,
        title,
        progress: 0,
        status: "Iniciando...",
        isCompleted: false,
        hasError: false
      }
    ])

    if (socketRef.current) {
      socketRef.current.emit("subscribe:video", videoId)
    }
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  // Connect global socket for user notifications
  const removeTaskRef = useRef(removeTask)
  useEffect(() => {
    removeTaskRef.current = removeTask
  }, [removeTask])

  useEffect(() => {
    if (!user || !token) return

    const socket = io(`${WS_URL}/ws`, {
      path: "/ws",
      auth: { token },
      transports: ["websocket", "polling"],
    })

    socket.on("connect", () => {
      console.log("[NotificationContext] Connected to WS")
    })

    socket.on("clip:ready", (data: any) => {
      const { videoId, clip } = data
      setNotifications(prev => [
        {
          id: Math.random().toString(36).substr(2, 9),
          title: "Clipe Pronto!",
          message: `O clipe "${clip.titulo || 'Sem título'}" foi renderizado com sucesso.`,
          type: "success",
          timestamp: new Date(),
          read: false,
          link: `/clips?videoId=${videoId}`
        },
        ...prev
      ])

      // Atualiza a tarefa e agenda remoção
      setTasks(prev => prev.map(t => {
        if (t.videoId === videoId) {
          // Remover após 5 segundos se já estiver 100%
          setTimeout(() => removeTaskRef.current(t.id), 1500);
          return { ...t, progress: 100, isCompleted: true, status: "Concluído" };
        }
        return t;
      }))
    })

    socket.on("clip:export-progress", (data: any) => {
      const { videoId, progress } = data
      setTasks(prev => prev.map(t => {
        if (t.videoId === videoId) {
          const newProg = Math.max(t.progress, progress)
          // Se chegou a 100, também agendar remoção em caso de perda do evento ready
          if (newProg >= 100 && !t.isCompleted) {
             setTimeout(() => removeTaskRef.current(t.id), 1500)
          }
          return { ...t, progress: newProg, status: "Renderizando clipes..." }
        }
        return t
      }))
    })

    socket.on("video:error", (data: any) => {
      const { videoId, error } = data
      setTasks(prev => prev.map(t => {
        if (t.videoId === videoId) {
          setTimeout(() => removeTaskRef.current(t.id), 8000); // Dar tempo de ler o erro
          return { ...t, hasError: true, status: "Erro: " + error }
        }
        return t
      }))
      
      setNotifications(prev => [
        {
          id: Math.random().toString(36).substr(2, 9),
          title: "Erro na Renderização",
          message: error || "Ocorreu um erro ao processar seu vídeo.",
          type: "error",
          timestamp: new Date(),
          read: false
        },
        ...prev
      ])
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [user, token])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{
      tasks,
      notifications,
      addTask,
      removeTask,
      clearNotifications,
      markAsRead,
      unreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
